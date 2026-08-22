# Factory Campus Photorealism Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the approved factory campus from a detailed real-time visualization toward an immediately believable industrial environment, while keeping every building wall visibly pale rather than black from all practical Web camera directions.

**Architecture:** Keep the approved campus layout, building hierarchy, floor explosion, traffic, gate, sports, and energy interactions unchanged. Improve realism in independently reviewable passes: establish pale-envelope and lighting contracts first, then add construction depth, ground/contact storytelling, vegetation ecology, operational props, and finally Web rendering/LOD. Each pass updates Blender-authored assets and validates the exported GLB in the actual Three.js daylight and evening pipelines.

**Tech Stack:** Blender 5.2 Python API, glTF/GLB standard PBR, Three.js 0.165, React 18, Vite 5, Node.js test runner, browser visual verification.

## Global Constraints

- Building walls must remain pale white, cool white, warm white, or light beige; no primary facade face may render black or near-black.
- Wall PBR materials must use metallic values at or below `0.12` and roughness between `0.58` and `0.84`.
- Roof PBR materials must remain light gray with roughness at or above `0.55`; roofs must not read as dark metal in daylight.
- Preserve the approved building positions, roads, parking, sports courts, gate, vegetation clearances, floor hierarchy, camera interaction, and traffic metadata.
- Use only GLB-safe standard PBR textures and geometry; Blender-only procedural nodes must be baked or generated into embedded images.
- Keep the Web GLB below `40 MiB` (`41,943,040` bytes).
- Do not add runtime external texture requests for the campus asset.
- Do not use the `img2threejs` skill.
- Do not commit, push, merge, or remove the worktree without explicit user instruction.

---

### Task 1: Pale Building Envelope and Multi-Angle Lighting Contract

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tests/campusLightingMode.test.js`
- Modify: `tests/campusEnvironment.test.js`
- Create: `tests/campusFacadeReadability.test.js`

**Interfaces:**
- Consumes: Blender material/image pixels, `DAY_MODE`, `EVENING_MODE`, environment intensities, and the six approved facade inspection headings.
- Produces: numeric contracts for pale wall base color, non-metallic cladding, roof brightness, environment fill, and multi-angle readable facade luminance.

- [x] **Step 1: Add a failing Blender pale-envelope audit**

Add an audit that records every material whose `architecturalPbrFamily` is `industrial-coated-metal`, `warehouse-sandwich-panel`, `administration-limestone`, or `architectural-concrete`. Assert literal bounds:

```js
assert.ok(record.baseColorMean >= 0.80)
assert.ok(record.baseColorMinimum >= 0.62)
assert.ok(record.metallic <= 0.12)
assert.ok(record.roughness >= 0.58 && record.roughness <= 0.84)
```

For `galvanized-roof`, assert `baseColorMean >= 0.72`, `metallic <= 0.16`, and `roughness >= 0.55`.

- [x] **Step 2: Add a failing Web lighting contract**

Define `MIN_DAY_FACADE_AMBIENT = 0.22`, `MIN_DAY_ENVIRONMENT_INTENSITY = 0.78`, and a six-direction inspection table:

```js
const facadeInspectionHeadings = [0, 60, 120, 180, 240, 300]
```

Assert that daylight always has nonzero hemisphere bounce, neutral facade fill, PMREM environment light, tone mapping, and exposure limits that preserve pale walls without clipping.

- [x] **Step 3: Run focused tests and verify RED**

Run:

```bash
node --test tests/campusFacadeReadability.test.js tests/campusLightingMode.test.js tests/campusEnvironment.test.js
BLENDER_TEST_BLEND=assets/blender/factory-campus-graybox.blend BLENDER_TEST_GLB=public/models/factory-campus-graybox.glb node --test --test-name-pattern='pale envelope|architectural PBR|wall cladding' tools/blender/create_factory_campus_graybox.test.js
```

Expected: at least the current roof roughness, selected wall image mean, or daylight fill contract fails against the current baseline.

### Task 2: Rebuild Pale PBR Wall and Roof Families

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Modify: `tools/blender/update_factory_architectural_pbr.py`
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Consumes: Task 1 material bounds.
- Produces: five standard PBR families with embedded Base Color, Normal, Roughness, and Occlusion images and pale per-building variants.

- [x] **Step 1: Normalize the wall palette by building function**

Use these target linear color families before texture variation:

```python
PALE_ENVELOPE_PALETTE = {
    "factory": (0.86, 0.88, 0.89),
    "warehouse": (0.88, 0.86, 0.80),
    "process": (0.83, 0.87, 0.89),
    "utility": (0.80, 0.84, 0.85),
    "laboratory": (0.88, 0.90, 0.87),
    "administration": (0.90, 0.87, 0.80),
}
```

Limit base-color procedural variation to `±8%` for wall panels and `±10%` for stone/concrete. Keep dark values only on physical joints, glazing, louvers, dock rubber, equipment, and shadow gaps.

- [x] **Step 2: Correct physical response**

Set wall metallic to `0.00–0.08`, wall roughness to `0.62–0.78`, roof metallic to `0.08–0.14`, and roof roughness to `0.58–0.70`. Reduce normal strength on broad wall faces to `0.18–0.32` so the normal map creates texture without dirty gray shading.

- [x] **Step 3: Prevent double-darkening**

Ensure Base Color is interpreted as sRGB, while Normal, Roughness, and Occlusion images use `Non-Color`. Keep occlusion values centered above `0.88` and reserve stronger occlusion for joints and recesses rather than full facade faces.

- [x] **Step 4: Export to temporary assets and verify GREEN**

Run the updater against the approved `.blend`, output temporary Blender/GLB files, and run Task 1 tests. Only after they pass, overwrite the tracked `.blend` and GLB.

- [x] **Step 5: Inspect six daylight headings**

In the Web campus-only view, capture the six headings from Task 1. Reject the pass if any primary wall or roof appears black, charcoal, clipped white, or uniformly textureless.

### Task 3: Architectural Construction Depth

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Create: `tools/blender/update_factory_construction_depth.py`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Consumes: pale wall families from Task 2 and existing `BLDG__*` hierarchy.
- Produces: recessed openings, edge bevels, panel profiles, sill/drip geometry, roof perimeter construction, and construction metadata under each building root.

- [x] **Step 1: Add failing construction-depth contracts**

Assert every major building contains `opening-reveal`, `window-sill`, `drip-edge`, `corner-flashing`, `wall-plinth`, `roof-parapet`, and `roof-drainage` roles. Require window/door reveals to be at least `0.08` model units deep and major exposed edges to have bevel width between `0.025` and `0.08`.

- [x] **Step 2: Recess doors and windows**

Move glazing and door slabs behind the exterior wall plane by `0.08–0.15` units. Add four-sided reveal geometry using the same pale envelope family, with dark frames limited to narrow physical members.

- [x] **Step 3: Add wall and roof construction logic**

Add pressed panel ribs or shallow panel cassettes at real construction spacing, window sills, door heads, drip edges, roof parapet caps, gutters, downpipe offsets, and equipment curbs. Parent all additions to the corresponding `BLDG__<id>` root so building focus and floor explosion remain compatible.

- [x] **Step 4: Verify geometry and interaction**

Run the building hierarchy, four-sided envelope, floor explosion, focus visibility, GLB node-contract, and size tests. Inspect the administration center, main production hall, both warehouses, and one utility building at close range.

### Task 4: Ground PBR, Contact Zones, and Site Wear

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Create: `tools/blender/update_factory_ground_contact.py`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Consumes: existing road, parking, plaza, access-spur, loading-yard, drainage, and building-footprint geometry.
- Produces: function-specific ground materials and localized wear anchored to real operational causes.

- [x] **Step 1: Add failing ground-zone contracts**

Require distinct material roles for `new-asphalt`, `aged-asphalt`, `loading-concrete`, `entry-paving`, `parking-surface`, `walkway`, `lawn`, `mulch`, and `bare-soil`. Require localized contact details at loading docks, drains, vehicle stopping zones, and wall bases while keeping sports surfaces and gate lanes clear.

- [x] **Step 2: Rebuild ground PBR scale**

Use real-world tiling targets: asphalt `2.0 m`, concrete `2.4 m`, paving `1.2–1.6 m`, lawn `1.8–2.6 m`, and planting soil `1.2–1.8 m`. Increase macro color variation while keeping normal-map strength below `0.45` to avoid noisy terrain.

- [x] **Step 3: Add cause-based wear**

Add restrained tire darkening at turns and loading bays, concrete joint lines, asphalt repairs, drain discoloration, dock abrasion, wall-base dust, and occasional oil marks. Place every mark from named route, drain, dock, or building anchors rather than random full-site scattering.

- [x] **Step 4: Strengthen contact without black halos**

Use geometry and subtle AO-compatible material transitions at wall bases, curbs, tree grates, equipment pads, and vehicle wheels. Reject black decal borders, z-fighting, and heavy ambient-occlusion rings.

- [x] **Step 5: Verify from opening and low-angle cameras**

Check the default overview, administration entrance, warehouse loading yard, gate, parking canopy, and a low oblique roadway view.

### Task 5: Vegetation Ecology and Near-Tree Fidelity

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Modify: `tools/blender/update_factory_vegetation_realism.py`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Consumes: existing six species, near/mid/far metadata, PBR foliage layers, and all clearance zones.
- Produces: porous near crowns, branch hierarchy, understory transition, tree-base integration, and distance-appropriate mesh budgets.

- [x] **Step 1: Add failing porous-canopy contracts**

Require near trees to have visible trunk, primary branches, at least three separated crown masses, and a canopy void ratio sufficient to avoid a solid ball silhouette. Keep six species and no more than twelve reusable crown meshes.

- [x] **Step 2: Refine near-tree geometry**

Use branch forks plus small asymmetric leaf clusters or limited alpha-clipped leaf cards on only the nearest trees. Keep two-sided foliage, `alphaTest`-compatible cutouts, and no blended leaf transparency.

- [x] **Step 3: Integrate planting into the ground**

Add tree-base mulch, sparse grass, leaf litter color patches, low shrubs, and bare-soil transitions. Break the forest boundary with irregular understory depth rather than a uniform green apron.

- [x] **Step 4: Verify performance and clearances**

Run tree/building/road/sports/gate collision tests, crown reuse tests, GLB budget, Web frame stability, and daylight/evening foliage inspection.

### Task 6: Industrial Operational Storytelling

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Create: `tools/blender/update_factory_operational_realism.py`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `src/scene/campusRouteAnimation.js`
- Modify: `tests/campusRouteAnimation.test.js`
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Consumes: building functions, loading routes, gate cycle, patrol paths, and equipment zones.
- Produces: concentrated functional props, purposeful workers, parked vehicle variation, and maintained animation metadata.

- [x] **Step 1: Add failing role-based prop contracts**

Require loading docks to expose bumpers, dock seals, pallets, cages, safety cones, and service signage; process buildings to expose valves, instruments, cable trays, and pipe labels; management areas to expose arrival furniture, planters, and restrained signage.

- [x] **Step 2: Concentrate props by operational zone**

Place props only at gate, loading, maintenance, process, parking, administration-entry, and sports-support zones. Preserve clear fire lanes, door swings, pedestrian paths, and vehicle trajectories.

- [x] **Step 3: Give people observable purpose**

Use short routes between doors, equipment, loading points, and guard posts. Add stopping/inspection phases through existing metadata rather than adding unrestricted random walking.

- [x] **Step 4: Verify animation and collision**

Run route, gate, vehicle-heading, patrol, floor-interior, and model-contract tests, then inspect traffic running and paused states.

### Task 7: Web Photoreal Rendering and Performance

**Files:**
- Modify: `src/hooks/useIndustrialScene.js`
- Modify: `src/scene/campusEnvironment.js`
- Modify: `src/scene/campusLightingMode.js`
- Modify: `src/scene/campusShadowQuality.js`
- Create: `src/scene/campusMaterialQuality.js`
- Create: `src/scene/campusPostProcessing.js`
- Create: `tests/campusMaterialQuality.test.js`
- Create: `tests/campusPostProcessing.test.js`
- Modify: `tests/campusEnvironment.test.js`
- Modify: `tests/campusLightingMode.test.js`

**Interfaces:**
- Consumes: standard PBR GLB materials, PMREM environment texture, day/evening modes, scene receiver/caster roles, and model distance metadata.
- Produces: controlled environment reflections, texture anisotropy, contact shading, anti-aliasing policy, restrained post-processing, and LOD/material quality settings.

- [x] **Step 1: Add failing rendering-quality tests**

Assert renderer output color space, tone mapping, exposure bounds, PMREM presence, maximum anisotropy application, shadow-map type, facade environment intensity, transparent foliage shadow policy, and reduced-motion fallbacks.

- [x] **Step 2: Stabilize material rendering**

Set color textures to sRGB and data textures to linear/non-color; apply anisotropy to oblique ground and wall textures; keep facade `envMapIntensity` within `0.55–0.90`; keep glass and metal in independent higher ranges.

- [x] **Step 3: Add controlled contact and anti-aliasing**

Introduce a bounded SSAO/GTAO-style contact pass or equivalent lightweight contact strategy, excluding transparent foliage and microdetails from expensive shadow casting. Use TAA/SMAA only if it improves leaf, fence, and diagonal roof stability without softening dashboard text.

- [x] **Step 4: Add restrained post-processing**

Limit bloom to emissive operational lights and bright glass highlights. Do not bloom pale walls, road markings, or dashboard overlays. Preserve separate day and evening exposure/color grading.

- [x] **Step 5: Add distance quality policy**

Keep high-quality construction and near vegetation inside the campus focus distance; use shared mid/far meshes outside it. Apply KTX2 only after side-by-side texture comparison confirms no visible wall or foliage degradation.

- [x] **Step 6: Run final acceptance**

Run all Node tests, complete Blender contracts, production build, GLB size/no-external-image audit, and browser inspection in overview, campus-only, building focus, floor interior, day, and evening modes.

## Phase Acceptance Gates

1. **Phase 1 — Pale envelope:** all four wall directions and roofs remain pale and readable in daylight; no black primary facade faces.
2. **Phase 2 — Construction depth:** openings, edges, joints, drainage, and roof construction read at medium camera distance.
3. **Phase 3 — Ground/contact:** roads, hardscape, planting, buildings, vehicles, and equipment visibly sit on the same physical site.
4. **Phase 4 — Vegetation ecology:** near trees are porous and branched; mid/far vegetation forms a natural boundary without cloning or penetration.
5. **Phase 5 — Operational life:** props and people explain how each zone is used without cluttering safety routes.
6. **Phase 6 — Rendering:** PBR response, shadows, anti-aliasing, and post-processing improve realism without harming dashboard readability or exceeding the asset budget.

## Recommended Execution Order

Execute Tasks 1–2 first as the mandatory pale-wall correction. Review screenshots before Task 3. Continue Tasks 3–4 as the largest photorealism gain, then Tasks 5–6, and finish with Task 7 only after Blender-authored materials and geometry are stable.
