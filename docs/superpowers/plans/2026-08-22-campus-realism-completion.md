# Campus Realism Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise the existing interactive factory campus from clean digital-twin styling to a more convincing industrial site while preserving its layout, pale building palette, interactions, performance, and 40 MiB GLB ceiling.

**Architecture:** Keep Blender as the source of truth for geometry and embedded PBR materials. Add three removable realism systems—ground circulation, ecological edge, and rear/roof services—under dedicated roots so the existing blend can be updated incrementally and the full generator stays reproducible. Keep Web changes limited to presentation and renderer policies that cannot be authored in GLB.

**Tech Stack:** Blender 5.2 Python, glTF/GLB, Three.js r165, React 18, Vite 5, Node test runner.

## Global Constraints

- Preserve the current campus and building layout.
- Building envelopes remain pale white, warm white, or light gray; no dark facade replacement.
- `public/models/factory-campus-graybox.glb` must remain below 40 MiB.
- New ground and facade detail must avoid coplanar surfaces, Z-fighting, and high-frequency texture moire.
- Keep building selection, floor explosion, interior focus, gate traffic, sunlight controls, and material lab operational.
- Every Blender system must be removable and repeatable through a named root and incremental updater.

---

### Task 1: Functional Ground and Road Realism

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Modify: `tools/blender/update_factory_ground_contact.py`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tests/generatedModelContract.test.js`

**Interfaces:**
- Consumes: `configure_ground_function_zones(mats, campus)` and `create_ground_contact_realism(mats, campus)`.
- Produces: `create_ground_circulation_realism(mats, campus)` and root `SITE__ground-circulation-realism` with `groundDetailRole` metadata.

- [ ] **Step 1: Write the failing artifact contract**

```js
test('generated campus defines readable circulation wear and drainage without coplanar decals', () => {
  const gltf = readGlbJson(MODEL_PATH)
  const nodes = gltf.nodes ?? []
  const roles = nodes.map((node) => node.extras?.groundDetailRole).filter(Boolean)
  assert.ok(roles.filter((role) => role === 'tire-wear').length >= 8)
  assert.ok(roles.filter((role) => role === 'drainage').length >= 8)
  assert.ok(roles.includes('service-yard'))
})
```

- [ ] **Step 2: Run the contract and confirm it fails because the new roles are missing**

Run: `node --test --test-name-pattern="circulation wear" tests/generatedModelContract.test.js`
Expected: FAIL with insufficient `groundDetailRole` counts.

- [ ] **Step 3: Add broad, low-frequency road wear, service pads, drains, and entrance aprons**

```python
def create_ground_circulation_realism(mats, campus):
    root = empty("SITE__ground-circulation-realism", parent=campus)
    root["realismSystem"] = "functional-circulation"
    # Add raised service yards, tire-wear strips, drain runs, and entrance aprons.
    # Every top surface uses a unique Z layer at least 0.012 above its receiver.
    return root
```

- [ ] **Step 4: Call the function from the full generator and incremental ground updater**

Run the updater against `assets/blender/factory-campus-graybox.blend` and export `public/models/factory-campus-graybox.glb`.

- [ ] **Step 5: Run the ground contract and GLB size check**

Run: `node --test tests/generatedModelContract.test.js`
Expected: PASS and GLB `< 41943040` bytes.

### Task 2: Layered Vegetation and Natural Site Boundary

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Modify: `tools/blender/update_factory_vegetation_realism.py`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tests/generatedModelContract.test.js`

**Interfaces:**
- Consumes: existing `vegetationSpecies`, `vegetationTier`, and `forestBand` metadata.
- Produces: `create_vegetation_transition_realism(mats, campus)` and root `VEGETATION__transition-realism`.

- [ ] **Step 1: Write a failing GLB contract for ecological transition layers**

```js
test('generated campus softens the forest boundary with diverse ecological layers', () => {
  const gltf = readGlbJson(MODEL_PATH)
  const nodes = gltf.nodes ?? []
  const roles = nodes.map((node) => node.extras?.ecologyRole).filter(Boolean)
  assert.ok(roles.filter((role) => role === 'forest-edge-shrub').length >= 18)
  assert.ok(roles.filter((role) => role === 'meadow-transition').length >= 10)
})
```

- [ ] **Step 2: Run it and confirm the missing-role failure**

Run: `node --test --test-name-pattern="ecological layers" tests/generatedModelContract.test.js`
Expected: FAIL.

- [ ] **Step 3: Add irregular meadow islands, shrub masses, and canopy understory using linked meshes**

```python
def create_vegetation_transition_realism(mats, campus):
    root = empty("VEGETATION__transition-realism", parent=campus)
    root["ecologySystem"] = "irregular-forest-edge"
    # Reuse shared shrub meshes and keep all sports/gate clearance zones empty.
    return root
```

- [ ] **Step 4: Integrate the system into full generation and vegetation updater**

Run the vegetation updater and export the formal `.blend` and `.glb`.

- [ ] **Step 5: Verify species diversity, clearance, draw-call-aware instancing, and file size**

Run: `node --test tests/generatedModelContract.test.js tools/blender/create_factory_campus_graybox.test.js`
Expected: PASS.

### Task 3: Rear Elevation and Roof Operations

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Create: `tools/blender/update_factory_service_envelopes.py`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tests/generatedModelContract.test.js`

**Interfaces:**
- Consumes: building roots named `BLDG__<building-id>` and registry dimensions.
- Produces: `create_rear_service_envelope(building_id, width, depth, height, mats, root)` with `serviceEnvelopeRole` metadata.

- [ ] **Step 1: Write a failing contract requiring rear doors, ventilation, protected service pads, and roof drainage per building**

```js
test('every interactive building has a credible rear service envelope', () => {
  const gltf = readGlbJson(MODEL_PATH)
  const nodes = gltf.nodes ?? []
  for (const id of BUILDING_IDS) {
    const roles = nodes.filter((node) => node.extras?.buildingId === id)
      .map((node) => node.extras?.serviceEnvelopeRole)
    assert.ok(roles.includes('rear-service-door'), id)
    assert.ok(roles.includes('rear-ventilation'), id)
  }
})
```

- [ ] **Step 2: Run it and confirm it fails on the first missing building**

Run: `node --test --test-name-pattern="rear service envelope" tests/generatedModelContract.test.js`
Expected: FAIL.

- [ ] **Step 3: Build restrained rear service assemblies and varied roof maintenance markers**

```python
def create_rear_service_envelope(building_id, width, depth, height, mats, root):
    rear_y = -depth / 2
    service = empty(f"SERVICE_ENVELOPE__{building_id}", parent=root)
    door = box(f"SERVICE_ENVELOPE__{building_id}__door", (.72, .10, 1.15),
               (-width * .22, rear_y - .08, .64), mats["service_door"], service, .025)
    door["serviceEnvelopeRole"] = "rear-service-door"
    vent = box(f"SERVICE_ENVELOPE__{building_id}__vent", (.86, .08, .48),
               (width * .22, rear_y - .08, min(height - .5, 1.25)), mats["vent"], service, .018)
    vent["serviceEnvelopeRole"] = "rear-ventilation"
    return service
```

- [ ] **Step 4: Add an idempotent incremental updater and regenerate the formal assets**

Run: `/Applications/Blender.app/Contents/MacOS/Blender assets/blender/factory-campus-graybox.blend --background --python tools/blender/update_factory_service_envelopes.py -- --generator tools/blender/create_factory_campus_graybox.py --blend-output assets/blender/factory-campus-graybox.blend --glb-output public/models/factory-campus-graybox.glb`
Expected: one removable service system per building and successful GLB export.

- [ ] **Step 5: Verify building interaction metadata still resolves after export**

Run: `node --test tests/buildingRegistry.test.js tests/factoryCampusAsset.test.js tests/generatedModelContract.test.js`
Expected: PASS.

### Task 4: Web Presentation and Daylight Readability

**Files:**
- Modify: `src/scene/campusLightingProfiles.js`
- Modify: `src/styles/index.css`
- Modify: `tests/campusLightingProfiles.test.js`
- Modify: `tests/campusFocusToggle.test.js`

**Interfaces:**
- Consumes: existing day/evening commissioning profiles and `.is-campus-focus` class.
- Produces: a brighter but bounded day ground response and a full-height focused campus viewport.

- [ ] **Step 1: Write failing tests for a bounded day fill and complete focus viewport**

```js
test('day profile keeps pale buildings bright while lifting dark ground', () => {
  assert.ok(DAYLIGHT_PROFILE.hemisphereIntensity >= 1.4)
  assert.ok(DAYLIGHT_PROFILE.exposure <= 1.35)
})
```

- [ ] **Step 2: Verify the tests fail for the current profile/layout**

Run: `node --test tests/campusLightingProfiles.test.js tests/campusFocusToggle.test.js`
Expected: FAIL on the new readability assertions.

- [ ] **Step 3: Adjust bounded daylight fill and remove the empty focus-mode lower band**

Keep environment reflection at the approved day default `0.10`; do not change building base colors.

- [ ] **Step 4: Run focused tests, all Web tests, and production build**

Run: `node --test tests/*.test.js`
Run: `vite build`
Expected: all tests pass and build exits 0.

### Task 5: Asset Export and Visual Acceptance

**Files:**
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`
- Modify: `README.md`

**Interfaces:**
- Consumes: completed ground, vegetation, service-envelope, and Web presentation systems.
- Produces: the formal editable Blender source and runtime GLB.

- [ ] **Step 1: Run `git diff --check` and complete model contracts**

Run: `git diff --check`
Run: `node --test tests/*.test.js`
Run: `BLENDER_TEST_BLEND=assets/blender/factory-campus-graybox.blend BLENDER_TEST_GLB=public/models/factory-campus-graybox.glb node --test tools/blender/create_factory_campus_graybox.test.js`

- [ ] **Step 2: Verify GLB size and metadata counts**

Run: `stat -f '%z' public/models/factory-campus-graybox.glb`
Expected: integer below `41943040`.

- [ ] **Step 3: Build and inspect default, close, rear, day, and evening views in the running Web app**

Expected: pale facades, differentiated ground, softened vegetation boundary, richer rear/roof silhouettes, no obvious overlap, moire, or Z-fighting.

- [ ] **Step 4: Record the maintenance commands and realism systems in `README.md`**

Document each incremental updater, its removable root, and the 40 MiB budget.
