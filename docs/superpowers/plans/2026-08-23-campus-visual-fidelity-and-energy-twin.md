# Campus Visual Fidelity and Energy Twin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the existing factory campus from a detailed digital mock-up into a visually convincing, performant industrial digital twin, then connect water, power, and steam dashboard states to visible networks inside the 3D campus.

**Architecture:** Blender remains the source of truth for campus geometry, pale PBR materials, reusable asset prototypes, building identity, vegetation, and utility-network paths. Three.js remains responsible for camera composition, day/evening presentation, distance quality, energy highlighting, and animated flow. Each new Blender system uses a named removable root and metadata contract so that the formal `.blend` and GLB remain reproducible.

**Tech Stack:** Blender 5.2 Python, glTF/GLB, Three.js r165, React 18, Vite 5, Node test runner.

## Global Constraints

- Preserve the approved campus footprint, building positions, sports courts, roads, parking, gate, and traffic routes.
- Building walls remain pale white, warm white, or light gray; dark contrast is limited to joints, frames, equipment, service doors, and shadow gaps.
- Keep `public/models/factory-campus-graybox.glb` below 40 MiB; target 32 MiB or less after reuse work.
- Reduce exported unique meshes from 5610 to 3800 or fewer and materials from 119 to 100 or fewer before adding new high-detail systems.
- Do not add external runtime texture requests; Web continues to load one formal GLB.
- Preserve building selection, all-floor explosion, floor inspection, material lab, gate traffic, vehicle routes, sunlight controls, day/evening modes, and reduced-motion behavior.
- Repeated props must share mesh data and materials; avoid coplanar decals, Z-fighting, high-frequency normal maps, and dense geometry that is invisible at the default camera.
- Unity project files and Unity export assets remain outside this Web/Blender delivery.

---

### Task 1: Reusable Asset and Visibility Budget

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Create: `tools/blender/update_factory_asset_efficiency.py`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tests/generatedModelContract.test.js`
- Modify: `src/scene/campusMaterialQuality.js`
- Modify: `tests/campusMaterialQuality.test.js`

**Interfaces:**
- Consumes: existing `detailTier`, `vegetationTier`, `layerRole`, and shared-material metadata.
- Produces: Blender helpers `linked_instance(name, source, location, rotation, scale, parent)` and `tag_visibility_tier(root)`, plus Web policy `resolveCampusVisibilityTier(distance, focused)`.

- [ ] **Step 1: Add failing GLB reuse and budget contracts**

```js
test('formal campus reuses repeated assets within the render budget', () => {
  const gltf = readGlbJson(MODEL_PATH)
  assert.ok((gltf.meshes ?? []).length <= 3800)
  assert.ok((gltf.materials ?? []).length <= 100)
  assert.ok(statSync(MODEL_PATH).size <= 32 * 1024 * 1024)
})
```

- [ ] **Step 2: Run the new contract and record the current 5610-mesh, 119-material failure**

Run: `node --test --test-name-pattern="render budget" tests/generatedModelContract.test.js`
Expected: FAIL on mesh and material counts.

- [ ] **Step 3: Add one linked-instance path for repeated geometry**

```python
def linked_instance(name, source, location, rotation=(0, 0, 0), scale=(1, 1, 1), parent=None):
    obj = source.copy()
    obj.data = source.data
    obj.name = name
    obj.location = location
    obj.rotation_euler = rotation
    obj.scale = scale
    obj.parent = parent
    bpy.context.collection.objects.link(obj)
    obj["sharedPrototype"] = source.name
    return obj
```

Use this helper for trees, shrubs, lamps, bollards, roof vents, HVAC louvers, fence posts, drain covers, benches, cones, pallets, and repeated window modules. Do not link objects that require different topology or material slots.

- [ ] **Step 4: Tag distance tiers and make the updater idempotent**

Tag facade microdetail, tree branches, fence wires, road wear, and small operational props as `near`; roof equipment and street furniture as `mid`; buildings, main roads, tree crowns, and pipe racks as `far`. `update_factory_asset_efficiency.py` must remove `SYSTEM__asset-efficiency` before rebuilding shared prototypes.

- [ ] **Step 5: Extend Web visibility policy without changing interaction roots**

```js
export function resolveCampusVisibilityTier(distance, focused = false) {
  if (focused || distance <= 88) return 'near'
  if (distance <= 120) return 'mid'
  return 'far'
}
```

Only hide descendants tagged above the active tier; never hide `BLDG__*`, `FLOOR__*`, `ROUTE__*`, `WAYPOINT__*`, gates, or active vehicles.

- [ ] **Step 6: Regenerate assets and verify the budget**

Run: `node --test tests/campusMaterialQuality.test.js tests/generatedModelContract.test.js`
Run: `stat -f '%z' public/models/factory-campus-graybox.glb`
Expected: tests PASS, unique meshes `<= 3800`, materials `<= 100`, GLB `<= 33554432` bytes.

- [ ] **Step 7: Commit the reusable-asset foundation**

```bash
git add tools/blender/create_factory_campus_graybox.py tools/blender/update_factory_asset_efficiency.py tools/blender/create_factory_campus_graybox.test.js tests/generatedModelContract.test.js src/scene/campusMaterialQuality.js tests/campusMaterialQuality.test.js assets/blender/factory-campus-graybox.blend public/models/factory-campus-graybox.glb
git commit -m "perf: reuse factory campus assets by visibility tier"
```

### Task 2: Building Identity and Silhouette Pass

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Create: `tools/blender/update_factory_building_identity.py`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tests/generatedModelContract.test.js`
- Modify: `src/scene/buildingRegistry.js`
- Modify: `tests/buildingRegistry.test.js`

**Interfaces:**
- Consumes: roots named `BLDG__<building-id>` and existing `artDirection`/`buildingId` metadata.
- Produces: removable roots `IDENTITY__<building-id>` and metadata `identityRole`, `identityTier`, and `functionalZone`.

- [ ] **Step 1: Add failing identity contracts for the four principal archetypes**

```js
test('hero buildings expose distinct functional silhouettes', () => {
  const nodes = readGlbJson(MODEL_PATH).nodes ?? []
  const roles = new Set(nodes.map((node) => node.extras?.identityRole).filter(Boolean))
  for (const role of ['administration-arrival', 'production-monitor', 'warehouse-logistics', 'utility-process']) {
    assert.ok(roles.has(role), role)
  }
})
```

- [ ] **Step 2: Verify the identity contract fails before adding the new roots**

Run: `node --test --test-name-pattern="functional silhouettes" tests/generatedModelContract.test.js`
Expected: FAIL with the first missing `identityRole`.

- [ ] **Step 3: Deepen the administration arrival sequence**

Create a wider stepped forecourt, canopy soffit, recessed vestibule, two-story lobby volume, side service entrance, stone panel rhythm, and restrained corporate sign. Keep every new object under `IDENTITY__administration`, with no footprint movement.

```python
identity = empty("IDENTITY__administration", parent=building_root)
identity["identityRole"] = "administration-arrival"
identity["identityTier"] = "hero"
```

- [ ] **Step 4: Differentiate production, warehouse, process, and utility silhouettes**

Add production monitor roofs and crane-bay rhythm; warehouse dock canopies, seals, ramps, and office pods; process-building pipe entry frames and scrubber silhouettes; utility-building louvers, cable trays, cooling equipment, and safe exhaust stacks. Reuse the Task 1 prototype system for repeated parts.

- [ ] **Step 5: Add facade depth without darkening the wall palette**

Use real reveals of `0.08–0.16` model units for doors/windows, `0.025–0.035` bevels on exposed trim, and pale material variants with roughness `0.58–0.84`. Do not use dark full-wall materials to create depth.

- [ ] **Step 6: Regenerate and verify interaction compatibility**

Run: `node --test tests/buildingRegistry.test.js tests/factoryCampusAsset.test.js tests/generatedModelContract.test.js`
Expected: all 12 buildings resolve, floor nodes remain selectable, and all four identity roles exist.

- [ ] **Step 7: Commit building identity**

```bash
git add tools/blender/create_factory_campus_graybox.py tools/blender/update_factory_building_identity.py tools/blender/create_factory_campus_graybox.test.js tests/generatedModelContract.test.js src/scene/buildingRegistry.js tests/buildingRegistry.test.js assets/blender/factory-campus-graybox.blend public/models/factory-campus-graybox.glb
git commit -m "feat: strengthen factory building identities"
```

### Task 3: Ground, Vegetation, and Horizon Composition

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Create: `tools/blender/update_factory_site_composition.py`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tests/generatedModelContract.test.js`
- Modify: `src/scene/campusEnvironment.js`
- Modify: `tests/campusEnvironment.test.js`

**Interfaces:**
- Consumes: current `SITE__ground-circulation-realism`, `VEGETATION__transition-realism`, sports/gate clearance zones, and embedded ground/foliage PBR families.
- Produces: roots `SITE__horizon-transition` and `VEGETATION__hero-specimens`, plus metadata `horizonRole`, `landscapeRole`, and `clearanceClass`.

- [ ] **Step 1: Add failing contracts for a non-rectangular horizon transition and hero planting**

```js
test('campus boundary dissolves through layered horizon and planting', () => {
  const nodes = readGlbJson(MODEL_PATH).nodes ?? []
  const horizon = nodes.filter((node) => node.extras?.horizonRole)
  const heroes = nodes.filter((node) => node.extras?.landscapeRole === 'hero-tree')
  assert.ok(horizon.length >= 12)
  assert.ok(heroes.length >= 8)
})
```

- [ ] **Step 2: Run the contract and confirm the new roles are missing**

Run: `node --test --test-name-pattern="boundary dissolves" tests/generatedModelContract.test.js`
Expected: FAIL.

- [ ] **Step 3: Break up the hard rectangular site edge**

Create overlapping meadow, scrub, drainage, and forest-floor islands with different broad silhouettes and Z offsets of at least `0.02`. Keep the front boulevard legible, but remove the impression of a single dark-green rectangular board.

- [ ] **Step 4: Recompose vegetation by visual hierarchy**

Place 8–12 near/mid hero trees at administration, sports, parking, and pedestrian nodes; retain irregular mid-story shrubs; lower and thin the forest edge nearest the campus; increase density only toward the far horizon. Preserve gate, court, road, and building access clearance metadata.

- [ ] **Step 5: Add broad ground-value separation**

Differentiate new asphalt, aged asphalt, loading concrete, pedestrian paving, lawns, bioswale soil, mulch, and forest floor through low-frequency base-color and roughness variation. Keep normal-map intensity below `0.12` and physical tiling at `3.2–5.0` model units to avoid moire.

- [ ] **Step 6: Verify boundary, clearance, and asset budgets**

Run: `node --test tests/campusEnvironment.test.js tests/generatedModelContract.test.js`
Run: `node --test --test-name-pattern="clearance|vegetation|forest" tools/blender/create_factory_campus_graybox.test.js`
Expected: all clearance tests PASS and the GLB remains below 40 MiB.

- [ ] **Step 7: Commit site composition**

```bash
git add tools/blender/create_factory_campus_graybox.py tools/blender/update_factory_site_composition.py tools/blender/create_factory_campus_graybox.test.js tests/generatedModelContract.test.js src/scene/campusEnvironment.js tests/campusEnvironment.test.js assets/blender/factory-campus-graybox.blend public/models/factory-campus-graybox.glb
git commit -m "feat: reshape campus landscape and horizon"
```

### Task 4: Camera, Daylight, and Evening Art Direction

**Files:**
- Modify: `src/scene/campusLightingProfiles.js`
- Modify: `src/scene/campusLightingMode.js`
- Modify: `src/scene/campusPostProcessing.js`
- Modify: `src/scene/campusViewDefaults.js`
- Modify: `src/styles/index.css`
- Modify: `tests/campusLightingProfiles.test.js`
- Modify: `tests/campusPostProcessing.test.js`
- Modify: `tests/campusViewDefaults.test.js`
- Modify: `tests/campusFocusToggle.test.js`

**Interfaces:**
- Consumes: existing day/evening profiles, sunlight console values, `INITIAL_CAMERA`, `FOCUS_CAMERA`, and `.is-campus-focus`.
- Produces: bounded `resolveCampusBackdrop(mode)` and a focus viewport that stays fully inside the browser at 1512×731, 1920×1080, and ultrawide sizes.

- [ ] **Step 1: Add failing tests for readable evening facades and focus viewport bounds**

```js
test('evening profile keeps pale facades readable against a non-black horizon', () => {
  const profile = createCampusLightingProfiles().evening
  assert.ok(profile.hemisphereIntensity >= 0.55)
  assert.ok(profile.environmentIntensity >= 0.08)
  assert.notEqual(profile.skyColor.toLowerCase(), '#000000')
})
```

Add a layout assertion requiring the focused scene top coordinate to remain `>= 0` and its bottom coordinate to remain `<= viewportHeight` for a 1512×731 viewport.

- [ ] **Step 2: Run lighting, camera, and focus tests to confirm the new acceptance rules fail**

Run: `node --test tests/campusLightingProfiles.test.js tests/campusViewDefaults.test.js tests/campusFocusToggle.test.js`
Expected: FAIL on the new evening/background or focus-bound assertions.

- [ ] **Step 3: Replace the black evening void with a layered architectural backdrop**

Use a deep blue-gray sky, a lighter low horizon, restrained distance fog, and warm operational lights. Preserve the requested evening default while keeping roofs, rear facades, roads, and vegetation readable.

- [ ] **Step 4: Rebalance day presentation around material readability**

Keep day PBR environment reflection at `0.10`; use neutral hemisphere fill, warm key light, restrained exposure, and SSAO contact separation. Do not change pale wall base colors to compensate for lighting.

- [ ] **Step 5: Fix focus-mode framing and the empty lower band**

Remove any focus transform that places `.industrial-scene` above `y=0`; calculate focus height from the actual viewport rather than the hidden 1080p dashboard canvas. Keep controls inside the bottom-right safe area and preserve the approved oblique campus angle.

- [ ] **Step 6: Verify browser presentation at four baselines**

Inspect default evening, default day, focused evening, and focused day at 1512×731 and 1920×1080. Required observations: no cropped model, no empty lower band, no black building sides, no white clipping, no visible Z-fighting, and readable road/vegetation separation.

- [ ] **Step 7: Run full Web verification and commit**

Run: `node --test tests/*.test.js`
Run: `npm run build`
Expected: all tests PASS and Vite build exits 0.

```bash
git add src/scene/campusLightingProfiles.js src/scene/campusLightingMode.js src/scene/campusPostProcessing.js src/scene/campusViewDefaults.js src/styles/index.css tests/campusLightingProfiles.test.js tests/campusPostProcessing.test.js tests/campusViewDefaults.test.js tests/campusFocusToggle.test.js
git commit -m "fix: improve campus framing and architectural lighting"
```

### Task 5: Water, Power, and Steam Network Twin

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Create: `tools/blender/update_factory_energy_networks.py`
- Create: `src/scene/campusEnergyNetworkRegistry.js`
- Create: `src/scene/campusEnergyNetworkAnimation.js`
- Modify: `src/hooks/useIndustrialScene.js`
- Modify: `src/components/IndustrialScene.jsx`
- Modify: `src/App.jsx`
- Create: `tests/campusEnergyNetworkRegistry.test.js`
- Create: `tests/campusEnergyNetworkAnimation.test.js`
- Modify: `tests/generatedModelContract.test.js`

**Interfaces:**
- Consumes: active energy key `'water' | 'power' | 'steam'`, existing dashboard detail state, building IDs, and Blender pipe/cable route geometry.
- Produces: roots `ENERGY_NETWORK__water`, `ENERGY_NETWORK__power`, and `ENERGY_NETWORK__steam`; metadata `energyType`, `networkSegmentId`, `sourceBuildingId`, `targetBuildingId`, and `flowDirection`; Web APIs `collectCampusEnergyNetworks(root)` and `updateCampusEnergyNetworks(networks, state, seconds)`.

- [ ] **Step 1: Add failing GLB contracts for all three physical networks**

```js
test('formal campus exports connected water power and steam networks', () => {
  const nodes = readGlbJson(MODEL_PATH).nodes ?? []
  for (const energyType of ['water', 'power', 'steam']) {
    const segments = nodes.filter((node) => node.extras?.energyType === energyType)
    assert.ok(segments.length >= 8, energyType)
    assert.ok(segments.every((node) => node.extras?.networkSegmentId))
  }
})
```

- [ ] **Step 2: Run the contract and confirm all three network counts fail**

Run: `node --test --test-name-pattern="connected water power" tests/generatedModelContract.test.js`
Expected: FAIL.

- [ ] **Step 3: Create maintainable Blender network roots**

Use existing pipe racks and road utility corridors. Water uses blue-gray pipes and meter nodes; power uses cable-tray/cabinet paths rather than exposed glowing cables; steam uses insulated warm-gray pipework with valves and condensate return markers. Every route must connect named source and consumer buildings and avoid roads at vehicle height.

- [ ] **Step 4: Add a strict Web registry**

```js
export function collectCampusEnergyNetworks(root) {
  const networks = new Map([['water', []], ['power', []], ['steam', []]])
  root.traverse((object) => {
    const type = object.userData.energyType
    if (!networks.has(type)) return
    if (!object.userData.networkSegmentId) throw new Error(`missing networkSegmentId: ${object.name}`)
    networks.get(type).push(object)
  })
  return networks
}
```

- [ ] **Step 5: Add restrained energy highlighting and flow**

When no detail is open, networks use physical PBR materials. Opening water, power, or steam detail highlights only that network, fades the other two to their base state, and animates low-frequency pulses along declared flow direction. Reduced motion shows a static highlight; closing the detail restores all original materials.

- [ ] **Step 6: Connect alarms and dashboard selection to the campus**

Pass the active energy key from `App.jsx` to `IndustrialScene`. A selected warning may additionally supply `buildingId` and `networkSegmentId`; the camera moves only when the operator explicitly chooses “定位厂区”, never when a detail page merely opens.

- [ ] **Step 7: Verify network isolation, restoration, and performance**

Run: `node --test tests/campusEnergyNetworkRegistry.test.js tests/campusEnergyNetworkAnimation.test.js tests/generatedModelContract.test.js`
Run: `node --test tests/*.test.js`
Expected: one active network at a time, exact material restoration, reduced-motion PASS, full suite PASS.

- [ ] **Step 8: Commit the energy twin**

```bash
git add tools/blender/create_factory_campus_graybox.py tools/blender/update_factory_energy_networks.py src/scene/campusEnergyNetworkRegistry.js src/scene/campusEnergyNetworkAnimation.js src/hooks/useIndustrialScene.js src/components/IndustrialScene.jsx src/App.jsx tests/campusEnergyNetworkRegistry.test.js tests/campusEnergyNetworkAnimation.test.js tests/generatedModelContract.test.js assets/blender/factory-campus-graybox.blend public/models/factory-campus-graybox.glb
git commit -m "feat: connect campus water power and steam networks"
```

### Task 6: Visual Acceptance and Delivery Contract

**Files:**
- Modify: `README.md`
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tests/generatedModelContract.test.js`

**Interfaces:**
- Consumes: all completed visual, performance, and energy-network systems.
- Produces: formal Blender source, formal Web GLB, reproducible updater commands, and an acceptance record.

- [ ] **Step 1: Run all source and asset contracts**

Run: `node --test tests/*.test.js`
Run: `BLENDER_TEST_BLEND=assets/blender/factory-campus-graybox.blend BLENDER_TEST_GLB=public/models/factory-campus-graybox.glb node --test --test-concurrency=1 tools/blender/create_factory_campus_graybox.test.js`
Expected: all Web and Blender contracts PASS.

- [ ] **Step 2: Verify final asset budgets**

Run: `stat -f '%z' public/models/factory-campus-graybox.glb`
Expected: below `41943040` bytes, with target at or below `33554432` bytes.

Parse the GLB JSON and require unique meshes `<= 3800`, materials `<= 100`, all 12 building roots, all required floor roots, all traffic routes, and the three energy network roots.

- [ ] **Step 3: Run production build and Git hygiene checks**

Run: `npm run build`
Run: `git diff --check`
Expected: build exit 0 and no whitespace errors outside Unity-generated files.

- [ ] **Step 4: Complete the visual acceptance matrix**

Inspect front-left, rear-right, administration close-up, warehouse loading, sports/landscape, floor inspection, default evening, default day, focused evening, and focused day. Require pale readable facades, distinct hero silhouettes, non-rectangular horizon transition, visible road hierarchy, porous vegetation, no clipping, no black void, no Z-fighting, and stable texture sampling while orbiting.

- [ ] **Step 5: Document the maintenance workflow**

Update `README.md` with all new removable roots, incremental updater commands, asset budgets, energy-network metadata, Web highlighting behavior, and the separation between Blender-authored geometry and Web-authored animation.

- [ ] **Step 6: Commit formal delivery assets and documentation**

```bash
git add README.md assets/blender/factory-campus-graybox.blend public/models/factory-campus-graybox.glb tools/blender/create_factory_campus_graybox.test.js tests/generatedModelContract.test.js
git commit -m "docs: finalize campus visual fidelity delivery"
```
