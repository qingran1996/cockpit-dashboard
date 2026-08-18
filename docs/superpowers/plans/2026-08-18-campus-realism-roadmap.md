# Factory Campus Realism Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the approved campus layout from a digital sand-table into a credible industrial digital twin with readable interiors, constructed building envelopes, coherent gate traffic, and layered atmosphere.

**Architecture:** Blender remains the source of editable geometry, materials, semantic nodes, and layout. The GLB exports those nodes and motion metadata; Three.js owns cutaway presentation, inspection lighting, and synchronized behavior. Each phase ends with generated `.blend`/`.glb` assets, automated contracts, a production build, and browser screenshots.

**Tech Stack:** Blender 5.x Python API, glTF/GLB, Three.js r165, React 18, Vite 5, Node test runner.

## Global Constraints

- Preserve all approved building footprints, X/Y positions, perimeter roads, parking, gate location, forest boundary, and the front-left initial camera direction.
- Keep `assets/blender/factory-campus-graybox.blend` as the editable source and `public/models/factory-campus-graybox.glb` as the Web asset.
- Preserve existing `BLDG__*`, `FLOOR__*`, vehicle, patrol, and gate node contracts unless a migration test is added first.
- Keep the GLB at or below 15 MB and add no external runtime texture requests.
- Honor `prefers-reduced-motion` for people, vehicles, and barriers.
- Do not use `img2threejs`; model explicitly in Blender Python.
- Use TDD and commit each independently reviewable phase.

---

## Phase 1 — Interior Readability

**Outcome:** Entering a floor presents a legible room rather than a cyan transparent volume.

**Acceptance:** Administration L02 and main production L01 can be focused; current furniture and people are unobstructed, adjacent floors are subdued, and browser logs have no errors.

### Task 1: Focused-floor cutaway, lighting, and camera

**Files:**
- Modify: `src/components/IndustrialScene.jsx`
- Modify: `src/hooks/useIndustrialScene.js`
- Modify: `src/scene/floorInteraction.js`
- Modify: `src/scene/floorCamera.js`
- Create: `src/scene/floorInspectionLighting.js`
- Modify: `tests/floorInteraction.test.js`
- Modify: `tests/floorCamera.test.js`
- Create: `tests/floorInspectionLighting.test.js`

**Interfaces:**
- Consumes: existing `focusedFloorId`, floor roots, and `createFloorCameraPose({ floorWorldPosition, buildingSize })`.
- Produces: `floorView: { buildingId, exploded, focusedFloorId }` and `createFloorInspectionLighting(): { group, key, update(position, active), dispose() }`.

- [ ] **Step 1: Write failing focused-floor tests**

```js
applyFloorView([building], {
  buildingId: 'administration',
  exploded: true,
  focusedFloorId: 'L02',
})
updateFloorAnimations([building], 1, true)
assert.equal(floors[1].userData.focused, true)
assert.equal(floors[1].children.find(x => x.userData.layerRole === 'floor-volume').visible, false)
assert.ok(floors[0].children.find(x => x.userData.layerRole === 'interior-prop').material.opacity <= .22)
```

```js
const lighting = createFloorInspectionLighting()
lighting.update([2, 1.8, -4], true)
assert.equal(lighting.group.visible, true)
assert.equal(lighting.key.color.getHex(), 0xffd7a0)
assert.deepEqual(lighting.group.position.toArray(), [2, 2.45, -4])
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/floorInteraction.test.js tests/floorCamera.test.js tests/floorInspectionLighting.test.js`

Expected: FAIL because focused volume hiding and inspection lighting do not exist.

- [ ] **Step 3: Implement focused presentation**

Add `focusedFloorId` to the memoized `floorView`. In `applyFloorView`, hide the focused floor's `floor-volume`, keep its slab/core/interior opaque, reduce non-focused interiors to `0.18`–`0.22`, and restore all state when focus closes.

- [ ] **Step 4: Implement one reusable inspection light**

```js
export function createFloorInspectionLighting() {
  const group = new THREE.Group()
  const key = new THREE.PointLight(0xffd7a0, 0, 8, 2)
  const fill = new THREE.PointLight(0x7adfff, 0, 10, 2)
  key.position.set(0, .65, 0)
  fill.position.set(-.8, .35, .8)
  group.add(key, fill)
  return {
    group,
    key,
    update(position, active) {
      group.visible = active
      group.position.fromArray(position).add(new THREE.Vector3(0, .65, 0))
      key.intensity = active ? 2.2 : 0
      fill.intensity = active ? .65 : 0
    },
    dispose() {},
  }
}
```

Attach this group once to the Three.js scene. Bias the inspection camera target toward the occupied floor zone and keep the camera at least `.45` model units above its target.

- [ ] **Step 5: Verify GREEN and commit**

Run: `node --test tests/floorInteraction.test.js tests/floorCamera.test.js tests/floorInspectionLighting.test.js`

```bash
git add src/components/IndustrialScene.jsx src/hooks/useIndustrialScene.js src/scene/floorInteraction.js src/scene/floorCamera.js src/scene/floorInspectionLighting.js tests/floorInteraction.test.js tests/floorCamera.test.js tests/floorInspectionLighting.test.js
git commit -m "feat: clarify focused floor inspection"
```

### Task 2: Functional interior zoning

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Generate: `assets/blender/factory-campus-graybox.blend`
- Generate: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Consumes: existing `INTERIOR__*`, `PROP__*`, and `WALKER__*` hierarchy.
- Produces: `ZONE__<building>__<floor>__<zone>` groups with `usage` and `clearAisleWidth` metadata.

- [ ] **Step 1: Add failing Blender contracts**

```js
const zones = [
  'ZONE__administration__L02__open-office',
  'ZONE__administration__L02__lounge',
  'ZONE__main-production-hall__L01__process-line',
  'ZONE__main-production-hall__L01__inspection-aisle',
  'ZONE__front-warehouse__L01__packing',
]
assert.ok(zones.every(name => contract.nodes.includes(name)))
assert.ok(contract.zoneClearances.every(value => value >= .55))
```

- [ ] **Step 2: Run focused Blender test and verify RED**

Run: `node --test --test-name-pattern "Blender floors contain" tools/blender/create_factory_campus_graybox.test.js`

- [ ] **Step 3: Add reusable zone helpers and compose by function**

```py
def create_zone(name, location, parent, usage, clear_aisle_width):
    zone = empty(name, location, parent)
    zone["layerRole"] = "interior-zone"
    zone["usage"] = usage
    zone["clearAisleWidth"] = clear_aisle_width
    return zone

def create_desk_cluster(prefix, location, rows, columns, mats, parent):
    group = empty(prefix, location, parent)
    for row in range(rows):
        for column in range(columns):
            index = row * columns + column + 1
            x = (column - (columns - 1) / 2) * 0.62
            y = (row - (rows - 1) / 2) * 0.58
            box(f"{prefix}__desk-{index:02d}", (.50, .24, .15), (x, y, .27), mats["interior_worktop"], group, .025)
            create_chair(f"{prefix}__chair-{index:02d}", (x, y + .25, .18), mats, group, math.pi)
    return group

def create_lounge_cluster(prefix, location, mats, parent):
    group = empty(prefix, location, parent)
    create_sofa(f"{prefix}__sofa-01", (0, -.28, .18), .85, mats, group)
    create_sofa(f"{prefix}__sofa-02", (-.58, .20, .18), .65, mats, group, math.pi / 2)
    box(f"{prefix}__coffee-table-01", (.48, .30, .10), (.05, .18, .23), mats["interior_worktop"], group, .025)
    return group

def create_factory_work_cell(prefix, location, mats, parent):
    group = empty(prefix, location, parent)
    box(f"{prefix}__worktable", (1.10, .34, .18), (0, 0, .28), mats["interior_worktop"], group, .025)
    box(f"{prefix}__tool-cart", (.32, .28, .36), (-.72, 0, .28), mats["interior_storage"], group, .018)
    box(f"{prefix}__control-panel", (.42, .16, .54), (.68, -.10, .40), mats["interior_equipment"], group, .018)
    return group

def create_packing_cell(prefix, location, mats, parent):
    group = empty(prefix, location, parent)
    box(f"{prefix}__packing-table", (.95, .38, .18), (0, 0, .28), mats["interior_worktop"], group, .025)
    box(f"{prefix}__dispatch-bin-01", (.34, .34, .28), (-.68, .05, .22), mats["interior_storage"], group, .018)
    box(f"{prefix}__dispatch-bin-02", (.34, .34, .28), (.68, .05, .22), mats["interior_storage"], group, .018)
    return group
```

Office: open-office islands plus a sofa/coffee-table lounge. Factory: equipment follows one production axis with a central logistics aisle and side inspection aisle. Warehouse: racks terminate before a packing/dispatch zone. Laboratory: benches, sample cart, analyzer, and stool retain a clean circulation loop. Walker paths must not intersect prop bounding boxes.

- [ ] **Step 4: Regenerate assets and verify GREEN**

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --python tools/blender/create_factory_campus_graybox.py -- --blend-output assets/blender/factory-campus-graybox.blend --glb-output public/models/factory-campus-graybox.glb
node --test --test-name-pattern "Blender floors contain" tools/blender/create_factory_campus_graybox.test.js
```

- [ ] **Step 5: Commit functional interiors**

```bash
git add tools/blender/create_factory_campus_graybox.py tools/blender/create_factory_campus_graybox.test.js assets/blender/factory-campus-graybox.blend public/models/factory-campus-graybox.glb
git commit -m "feat: organize functional floor interiors"
```

---

## Phase 2 — Constructed Building Envelopes

**Outcome:** Buildings read as assembled industrial architecture with shell, structural frame, recessed openings, roof drainage, and service accessories.

**Acceptance:** Administration, main production, laboratory, and gatehouse each show at least four depth layers in close view; every building has a distinct but coherent facade rhythm.

### Task 3: Facade construction and vertical-scale correction

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `src/scene/buildingRegistry.js`
- Modify: `tests/buildingRegistry.test.js`
- Generate: `assets/blender/factory-campus-graybox.blend`
- Generate: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Consumes: `BUILDINGS`, `BUILDING_FLOORS`, facade material families, and building roots.
- Produces: `FACADE__<id>__*`, `ROOF__<id>__*`, and `SERVICE__<id>__*` nodes, plus synchronized registry sizes.

- [ ] **Step 1: Write failing facade and height tests**

```js
for (const record of facadeRecords) {
  assert.ok(record.frames >= 2)
  assert.ok(record.reveals >= 2)
  assert.ok(record.gutters >= 1)
  assert.ok(record.downpipes >= 2)
  assert.equal(record.parent, `BLDG__${record.id}`)
}
assert.ok(heightById.administration / 3 >= 1.35)
assert.ok(heightById.laboratory / 3 >= 1.15)
assert.ok(heightById['rear-high-bay'] >= 5.0)
assert.ok(heightById.gatehouse >= 1.65)
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/buildingRegistry.test.js --test-name-pattern "height"`

Run: `node --test --test-name-pattern "constructed|cladding" tools/blender/create_factory_campus_graybox.test.js`

- [ ] **Step 3: Implement modular construction helpers**

```py
def create_window_bay(prefix, center, size, wall_axis, mats, parent):
    frame_size = (size[0] + .12, .10, size[2] + .12) if wall_axis == "y" else (.10, size[1] + .12, size[2] + .12)
    box(f"{prefix}__reveal", frame_size, center, mats["facade_frame"], parent, .012)
    glass_offset = (0, .035, 0) if wall_axis == "y" else (.035, 0, 0)
    glass_center = tuple(center[index] - glass_offset[index] for index in range(3))
    box(f"{prefix}__glass", size, glass_center, mats["glass"], parent, .008)

def create_roof_edge(prefix, width, depth, height, mats, parent):
    box(f"{prefix}__parapet-front", (width + .18, .12, .24), (0, depth / 2, height + .12), mats["corner_flashing"], parent, .018)
    box(f"{prefix}__parapet-rear", (width + .18, .12, .24), (0, -depth / 2, height + .12), mats["corner_flashing"], parent, .018)
    box(f"{prefix}__parapet-left", (.12, depth, .24), (-width / 2, 0, height + .12), mats["corner_flashing"], parent, .018)
    box(f"{prefix}__parapet-right", (.12, depth, .24), (width / 2, 0, height + .12), mats["corner_flashing"], parent, .018)

def create_drainage_set(prefix, width, depth, height, mats, parent):
    box(f"{prefix}__gutter", (width, .10, .10), (0, depth / 2 + .08, height - .04), mats["pipe"], parent, .012)
    for index, x in enumerate((-width * .43, width * .43), start=1):
        cylinder(f"{prefix}__downpipe-{index:02d}", .045, height - .18, (x, depth / 2 + .10, height / 2), mats["pipe"], parent, vertices=10)

def create_service_wall(prefix, center, width, mats, parent):
    box(f"{prefix}__service-panel", (width, .12, .52), center, mats["interior_equipment"], parent, .018)
    for index in range(4):
        x = center[0] - width * .30 + index * width * .20
        box(f"{prefix}__louver-{index + 1:02d}", (width * .12, .05, .34), (x, center[1] + .08, center[2]), mats["facade_frame"], parent, .008)
```

Add roof-edge flashing, gutters, downpipes, recessed openings, entrance steps, service louvers, exterior lights, and loading accessories. Use linked meshes for repeated windows, louvers, and lights. Raise administration, laboratory, gatehouse, and rear high-bay selectively while preserving every footprint and X/Y location; derive all facade and roof Z values from the updated heights.

- [ ] **Step 4: Regenerate and verify layout invariants**

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --python tools/blender/create_factory_campus_graybox.py -- --blend-output assets/blender/factory-campus-graybox.blend --glb-output public/models/factory-campus-graybox.glb
node --test tests/buildingRegistry.test.js
node --test --test-name-pattern "layout|constructed|cladding|hierarchy" tools/blender/create_factory_campus_graybox.test.js
```

Expected: height/facade tests PASS and all X/Y layout assertions remain unchanged.

- [ ] **Step 5: Commit constructed envelopes**

```bash
git add tools/blender/create_factory_campus_graybox.py tools/blender/create_factory_campus_graybox.test.js src/scene/buildingRegistry.js tests/buildingRegistry.test.js assets/blender/factory-campus-graybox.blend public/models/factory-campus-graybox.glb
git commit -m "feat: deepen industrial building envelopes"
```

---

## Phase 3 — Gate Sequence and Traffic Behavior

**Outcome:** The gate becomes a believable arrival sequence, and the vehicle responds to access control instead of passing through an independent decorative loop.

**Acceptance:** The shuttle slows at recognition, waits for at least 85% barrier opening, crosses, and triggers closing only after clearance; no trees block the sight triangle.

### Task 4: Physical gate sequence and shared state machine

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Create: `src/scene/gateTrafficCycle.js`
- Modify: `src/scene/gateAnimation.js`
- Modify: `src/scene/vehicleAnimation.js`
- Modify: `src/hooks/useIndustrialScene.js`
- Create: `tests/gateTrafficCycle.test.js`
- Modify: `tests/gateAnimation.test.js`
- Modify: `tests/vehicleAnimation.test.js`
- Generate: `assets/blender/factory-campus-graybox.blend`
- Generate: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Produces: physical nodes `GATE__recognition-zone`, `GATE__stop-line`, `GATE__speed-bump-01`, `GATE__lane-arrow-*`, `GATE__visitor-bay`.
- Produces: `sampleGateTrafficCycle(seconds, speed): { phase, vehicleProgress, barrierOpen, waiting, returning }`.

- [ ] **Step 1: Write failing geometry and behavior tests**

```js
for (const name of [
  'GATE__recognition-zone', 'GATE__stop-line', 'GATE__speed-bump-01',
  'GATE__lane-arrow-inbound', 'GATE__lane-arrow-outbound', 'GATE__visitor-bay',
]) assert.ok(contract.nodes.includes(name))
assert.equal(contract.entryTreeConflicts, 0)
```

```js
assert.equal(sampleGateTrafficCycle(2.1, .1).phase, 'recognition-wait')
assert.equal(sampleGateTrafficCycle(2.7, .1).barrierOpen, 1)
assert.equal(sampleGateTrafficCycle(2.1, .1).waiting, true)
assert.ok(sampleGateTrafficCycle(3.2, .1).vehicleProgress > .4)
assert.equal(sampleGateTrafficCycle(4.4, .1).phase, 'clear-and-close')
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/gateTrafficCycle.test.js tests/gateAnimation.test.js tests/vehicleAnimation.test.js`

Run: `node --test --test-name-pattern "gate" tools/blender/create_factory_campus_graybox.test.js`

- [ ] **Step 3: Model the arrival sequence**

Add a speed bump before the reader, recognition pad, stop line, inbound/outbound arrows, visitor pull-off bay, and low planting only near the gatehouse. Preserve a minimum `1.4` model-unit vehicle clearance and remove tree crowns from the gate sight box.

- [ ] **Step 4: Implement one shared piecewise cycle**

```js
const SEGMENTS = {
  approach: [0, .18],
  recognitionWait: [.18, .25],
  opening: [.20, .30],
  crossing: [.30, .48],
  clearAndClose: [.48, .58],
  returnJourney: [.58, 1],
}
```

Use cubic smoothstep. Hold vehicle position during recognition until `barrierOpen >= .85`; close only after clearance; mirror the process on return. Both gate and vehicle updaters consume the same sample. Reduced-motion mode returns the barrier to closed and parks the shuttle outside the gate.

- [ ] **Step 5: Regenerate, verify GREEN, and commit**

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --python tools/blender/create_factory_campus_graybox.py -- --blend-output assets/blender/factory-campus-graybox.blend --glb-output public/models/factory-campus-graybox.glb
node --test tests/gateTrafficCycle.test.js tests/gateAnimation.test.js tests/vehicleAnimation.test.js
node --test --test-name-pattern "gate" tools/blender/create_factory_campus_graybox.test.js
git add tools/blender/create_factory_campus_graybox.py tools/blender/create_factory_campus_graybox.test.js src/scene/gateTrafficCycle.js src/scene/gateAnimation.js src/scene/vehicleAnimation.js src/hooks/useIndustrialScene.js tests/gateTrafficCycle.test.js tests/gateAnimation.test.js tests/vehicleAnimation.test.js assets/blender/factory-campus-graybox.blend public/models/factory-campus-graybox.glb
git commit -m "feat: synchronize factory gate traffic"
```

---

## Phase 4 — Materials, Landscape, and Atmosphere

**Outcome:** Materials separate clearly, planting feels designed rather than arrayed, and an optional evening mode adds operational atmosphere without reducing dashboard contrast.

**Acceptance:** Wall, coated steel, asphalt, concrete, glass, and vegetation remain distinguishable; gate sight lines remain open; evening mode adds road/facade lights without extra texture downloads.

### Task 5: PBR families, planting rhythm, and evening mode

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Create: `src/scene/campusLightingMode.js`
- Modify: `src/hooks/useIndustrialScene.js`
- Modify: `src/components/IndustrialScene.jsx`
- Modify: `src/styles/index.css`
- Create: `tests/campusLightingMode.test.js`
- Generate: `assets/blender/factory-campus-graybox.blend`
- Generate: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Produces: bounded PBR material values and at least five linked crown scale variants.
- Produces: `deriveCampusLightingState(mode)` and `applyCampusLightingMode({ scene, renderer, lights }, mode)` for `mode: 'day'|'evening'`.

- [ ] **Step 1: Write failing material, landscape, and lighting tests**

```js
assert.ok(materials.wall.roughness >= .62)
assert.ok(materials.coatedSteel.metallic >= .45)
assert.ok(materials.asphalt.roughness >= .82)
assert.ok(landscape.crownScaleVariants >= 5)
assert.ok(landscape.perimeterSpacingVariance >= .18)
assert.equal(landscape.entryCanopyIntrusions, 0)
```

```js
const evening = deriveCampusLightingState('evening')
assert.equal(evening.exposure, .82)
assert.equal(evening.skyColor, 0x061222)
assert.ok(evening.roadLightIntensity > deriveCampusLightingState('day').roadLightIntensity)
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/campusLightingMode.test.js`

Run: `node --test --test-name-pattern "material|forest|landscape" tools/blender/create_factory_campus_graybox.test.js`

- [ ] **Step 3: Refine without external textures**

Tune base color, roughness, metallic, coat, and transmission per material family. Add deterministic scale/rotation sequences to linked trees; cluster ornamental planting around administration, keep loading/fire lanes sparse, and retain only low planting at the entrance.

Add one accessible `日间 / 傍晚` control beside reset view. Reuse existing lights and emissive meshes; adjust scene fog, exposure, ambient/key intensity, road lamps, and facade luminaires. Do not persist user data.

- [ ] **Step 4: Regenerate and verify GREEN**

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --python tools/blender/create_factory_campus_graybox.py -- --blend-output assets/blender/factory-campus-graybox.blend --glb-output public/models/factory-campus-graybox.glb
node --test tests/campusLightingMode.test.js
node --test --test-name-pattern "material|forest|landscape" tools/blender/create_factory_campus_graybox.test.js
test $(stat -f%z public/models/factory-campus-graybox.glb) -le 15728640
```

- [ ] **Step 5: Commit environmental refinement**

```bash
git add tools/blender/create_factory_campus_graybox.py tools/blender/create_factory_campus_graybox.test.js src/scene/campusLightingMode.js src/hooks/useIndustrialScene.js src/components/IndustrialScene.jsx src/styles/index.css tests/campusLightingMode.test.js assets/blender/factory-campus-graybox.blend public/models/factory-campus-graybox.glb
git commit -m "feat: refine campus materials and atmosphere"
```

---

## Final Integration Gate

- [ ] Run `npm test`; expected zero failures.
- [ ] Run `node --test tools/blender/create_factory_campus_graybox.test.js`; expected zero failures and all 12 buildings present.
- [ ] Run `npm run build`; expected exit 0.
- [ ] Run `test $(stat -f%z public/models/factory-campus-graybox.glb) -le 15728640`; expected exit 0.
- [ ] Run `git diff --check`; expected no output.
- [ ] Browser QA at `http://localhost:5180/`: capture day overview, administration L02 interior, main production L01 interior, gate recognition/open/close states, and evening overview.
- [ ] Reject the release if furniture is obscured, accessories float, trees block the gate, the barrier intersects a vehicle, or dashboard panels lose contrast.
- [ ] Update `README.md` with Blender generation command, asset paths, semantic node rules, Web-runtime behavior, 15 MB budget, and verification commands.
- [ ] Commit documentation with `git commit -m "docs: record campus realism workflow"`.

## Delivery Order

1. Phase 1 — interior readability; highest immediate impact and prerequisite for judging interior detail.
2. Phase 2 — building construction; improves overview and close-range credibility without changing the plan layout.
3. Phase 3 — gate traffic; provides the strongest signature behavior after geometry stabilizes.
4. Phase 4 — materials and atmosphere; final unification after geometry and behavior stop moving.

Do not begin a later phase until the previous phase's acceptance criteria, generated assets, automated tests, and browser screenshots are complete.
