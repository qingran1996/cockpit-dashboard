# Material Microdetail and Contact Shadow Phase Six Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the approved campus layout more believable wall, roof, and ground contact through restrained Blender-authored weathering geometry and a Web shadow policy sized for the enlarged site.

**Architecture:** Blender remains the source of truth for visible facade age, roof patina, and four-sided base weathering, exported as named GLB meshes parented to each building. A small Three.js shadow-quality module owns renderer/key-light tuning and classifies loaded GLB meshes so buildings cast while campus ground surfaces receive shadows without making thin decals expensive shadow casters.

**Tech Stack:** Blender 5.2 Python API, glTF/GLB, Three.js, React/Vite, Node test runner.

## Global Constraints

- Preserve the approved building and road layout, floor explosion hierarchy, traffic routes, gates, sports courts, and camera direction.
- Do not use `img2threejs` or external bitmap texture dependencies.
- Keep `public/models/factory-campus-graybox.glb` below 20 MiB.
- Keep weathering restrained and functional: administration remains cleaner than production and warehouse buildings.
- Do not commit, push, merge, or delete the worktree without explicit user instruction.

---

### Task 1: Blender Surface-Age Contract

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: existing `BUILDINGS`, `material()`, `box()`, and per-building roots.
- Produces: `create_building_surface_age(building_id, width, depth, height, kind, mats, root)` and exported `SURFACE_DETAIL__*` meshes with `layerRole` and `detailTier` metadata.

- [ ] **Step 1: Write the failing Blender contract**

```js
test('building envelopes export restrained four-sided weathering and roof patina', () => {
  const { blendPath } = getGeneratedFixture()
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], { encoding: 'utf8' })
  const audit = JSON.parse(inspected.stdout.split('\n').find((line) => line.startsWith('SURFACE_AGE_AUDIT=')).slice(18))
  assert.equal(audit.parents.length, 12)
  assert.equal(audit.baseBands, 48)
  assert.ok(audit.streaks >= 32)
  assert.ok(audit.roofPatina >= 20)
  assert.deepEqual(audit.missingRoles, [])
})
```

- [ ] **Step 2: Run the focused contract and verify RED**

Run:
```bash
env BLENDER_TEST_BLEND=assets/blender/factory-campus-graybox.blend BLENDER_TEST_GLB=public/models/factory-campus-graybox.glb node --test --test-concurrency=1 --test-name-pattern='building envelopes export restrained four-sided weathering' tools/blender/create_factory_campus_graybox.test.js
```

Expected: FAIL because `MAT__facade-weathering`, `MAT__roof-patina`, and `SURFACE_DETAIL__*` do not exist.

- [ ] **Step 3: Implement restrained GLB-safe surface age**

```python
def create_building_surface_age(building_id, width, depth, height, kind, mats, root):
    detail = empty(f"SURFACE_DETAIL__{building_id}", parent=root)
    detail["layerRole"] = "building-surface-age"
    for side_name, size, location in surface_base_band_specs(width, depth):
        band = box(f"SURFACE_DETAIL__{building_id}__base-{side_name}", size, location, mats["facade_weathering"], detail, 0.004)
        band["layerRole"] = "facade-base-weathering"
        band["detailTier"] = "micro"
```

Add `MAT__facade-weathering`, `MAT__facade-weathering-light`, and `MAT__roof-patina` with high roughness and low-contrast color values, then call the helper from `create_building()`.

- [ ] **Step 4: Regenerate a temporary model and verify GREEN**

Run the Blender generator into `/private/tmp/campus-phase-six-contract.blend` and `/private/tmp/campus-phase-six-contract.glb`, then rerun the focused contract against those files. Expected: PASS.

### Task 2: Web Contact-Shadow Policy

**Files:**
- Create: `src/scene/campusShadowQuality.js`
- Create: `tests/campusShadowQuality.test.js`
- Modify: `src/scene/factoryCampusAsset.js`
- Modify: `src/hooks/useIndustrialScene.js`

**Interfaces:**
- Consumes: Three.js renderer, `CampusKey`, GLB mesh names, `buildingId`, `layerRole`, and `detailTier` metadata.
- Produces: `configureCampusMeshShadows(root)` and `configureCampusShadowQuality({ renderer, root })`.

- [ ] **Step 1: Write failing unit tests**

```js
test('configures enlarged-campus key shadows and keeps microdecals out of the caster pass', async () => {
  const root = new THREE.Group()
  const key = new THREE.DirectionalLight()
  key.name = 'CampusKey'
  root.add(key)
  const renderer = { shadowMap: { enabled: false, type: null } }
  module.configureCampusShadowQuality({ renderer, root })
  assert.equal(key.shadow.mapSize.width, 2048)
  assert.equal(key.shadow.camera.left, -44)
  assert.equal(key.shadow.camera.right, 44)
  assert.equal(key.shadow.bias, -.0003)
  assert.equal(key.shadow.normalBias, .035)
})
```

```js
test('makes buildings cast and campus ground receive while microdetails only receive', async () => {
  const building = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
  building.userData.buildingId = 'administration'
  const ground = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
  ground.userData.layerRole = 'site-ground'
  const micro = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
  micro.userData.buildingId = 'administration'
  micro.userData.detailTier = 'micro'
  const root = new THREE.Group().add(building, ground, micro)
  module.configureCampusMeshShadows(root)
  assert.deepEqual([building.castShadow, building.receiveShadow], [true, true])
  assert.deepEqual([ground.castShadow, ground.receiveShadow], [false, true])
  assert.deepEqual([micro.castShadow, micro.receiveShadow], [false, true])
})
```

- [ ] **Step 2: Run tests and verify RED**

Run:
```bash
node --test tests/campusShadowQuality.test.js
```

Expected: FAIL because `src/scene/campusShadowQuality.js` is absent.

- [ ] **Step 3: Implement and integrate the shadow policy**

```js
export function configureCampusMeshShadows(root) {
  root.traverse((object) => {
    if (!object.isMesh) return
    const isMicrodetail = object.userData.detailTier === 'micro'
    const isGround = ['site-ground', 'road-surface', 'landscape-ground'].includes(object.userData.layerRole)
    object.castShadow = Boolean(object.userData.buildingId) && !isMicrodetail
    object.receiveShadow = Boolean(object.userData.buildingId) || isGround || isMicrodetail
  })
}
```

Call mesh classification after GLB preparation and renderer/key-light configuration after `createIndustrialScene()`.

- [ ] **Step 4: Run focused and full Web tests**

Run:
```bash
node --test tests/campusShadowQuality.test.js
npm test
```

Expected: all tests PASS.

### Task 3: Formal Assets and Visual Verification

**Files:**
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`
- Modify: `README.md`

**Interfaces:**
- Consumes: green Blender generator and Web shadow policy.
- Produces: formal editable BLEND, deployable GLB, documented phase-six art direction.

- [ ] **Step 1: Generate formal BLEND and GLB**

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --python tools/blender/create_factory_campus_graybox.py -- --blend-output assets/blender/factory-campus-graybox.blend --glb-output public/models/factory-campus-graybox.glb
```

- [ ] **Step 2: Run full model and Web verification**

```bash
env BLENDER_TEST_BLEND=assets/blender/factory-campus-graybox.blend BLENDER_TEST_GLB=public/models/factory-campus-graybox.glb node --test --test-concurrency=1 tools/blender/create_factory_campus_graybox.test.js
npm test
npm run build
git diff --check
```

Expected: Blender and Web suites PASS, production build exits 0, and diff check is empty.

- [ ] **Step 3: Verify deployment and visuals**

Confirm the GLB is below 20 MiB, Blender has exited, port 5180 remains available, and inspect day/evening plus campus-focus views in the Web app for readable wall age, stronger building-ground contact, no flicker, no black shadow blocks, and no altered layout.

- [ ] **Step 4: Document the phase**

Add a README note explaining that Blender owns the exported surface-age geometry while Three.js owns enlarged-campus key-shadow quality and mesh caster/receiver policy.
