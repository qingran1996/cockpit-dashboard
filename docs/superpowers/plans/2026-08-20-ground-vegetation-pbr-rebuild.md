# Ground and Vegetation PBR Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the campus's flat ground and spherical trees with embedded, deployable PBR ground materials and reusable clustered tree forms while raising the formal GLB budget to 35 MiB.

**Architecture:** Blender deterministically generates small tileable Base Color, Normal, and Roughness images, packs them into the editable `.blend`, and connects them through glTF-compatible Principled BSDF nodes. Representative ground meshes receive scaled UVs, while near and perimeter trees use tapered reusable trunks and multi-lobe joined crown prototypes; background forest keeps linked instances. Three.js continues to consume one GLB with no external texture requests.

**Tech Stack:** Blender 5.2 Python API, glTF 2.0/GLB embedded images, Three.js, React/Vite, Node test runner.

## Global Constraints

- Raise the deployable GLB limit from 20 MiB to 35 MiB (36,700,160 bytes).
- Preserve all approved buildings, roads, courts, parking, gates, traffic paths, floor explosion, and camera direction.
- Do not use `img2threejs` or external runtime texture requests.
- PBR maps must be embedded in the GLB and use standard Base Color, Normal, and Roughness inputs.
- Reuse tree mesh prototypes and keep the formal Web asset below 35 MiB.
- Do not commit, push, merge, or remove the worktree without explicit user instruction.

---

### Task 1: Deployment Budget Contract

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `README.md`

**Interfaces:**
- Consumes: generated GLB file size.
- Produces: one explicit 35 MiB deployment budget shared by tests and documentation.

- [ ] **Step 1: Change the budget test first**

```js
test('generated Web GLB stays within the 35 MiB PBR deployment budget', () => {
  const { glbPath } = getGeneratedFixture()
  assert.ok(statSync(glbPath).size <= 35 * 1024 * 1024)
})
```

- [ ] **Step 2: Run the focused budget test**

Run:
```bash
env BLENDER_TEST_BLEND=assets/blender/factory-campus-graybox.blend BLENDER_TEST_GLB=public/models/factory-campus-graybox.glb node --test --test-concurrency=1 --test-name-pattern='35 MiB PBR deployment budget' tools/blender/create_factory_campus_graybox.test.js
```

Expected: PASS for the current 16.72 MB GLB, proving the new delivery policy before adding PBR data.

- [ ] **Step 3: Update README limits**

Replace the 20 MiB prose and shell check with 35 MiB / `36700160`, and document the reason: embedded shared PBR maps plus reusable vegetation geometry.

### Task 2: Embedded Ground PBR

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: Blender materials `MAT__asphalt`, `MAT__concrete`, `MAT__entry-paving`, `MAT__lawn`, `MAT__bioswale-soil`, and `MAT__planting-mulch`.
- Produces: `create_pbr_texture_set()`, `apply_pbr_texture_set()`, `configure_ground_uv_tiling()`, packed images named `PBR__<family>__base-color`, `PBR__<family>__normal`, and `PBR__<family>__roughness`.

- [ ] **Step 1: Write the failing real-BLEND contract**

```js
test('ground materials export embedded base color normal and roughness maps with tiled UVs', () => {
  const audit = inspectBlendForGroundPbr()
  assert.deepEqual(Object.keys(audit.materials).sort(), ['MAT__asphalt', 'MAT__bioswale-soil', 'MAT__concrete', 'MAT__entry-paving', 'MAT__lawn', 'MAT__planting-mulch'])
  assert.ok(Object.values(audit.materials).every((record) => record.base && record.normal && record.roughness))
  assert.ok(audit.uvRanges['SITE__ground'][0] >= 8)
  assert.ok(audit.uvRanges['SITE__outer-boulevard'][0] >= 8)
})
```

- [ ] **Step 2: Verify RED against the formal model**

Run the focused test against `assets/blender/factory-campus-graybox.blend`. Expected: FAIL because no packed PBR image nodes are connected.

- [ ] **Step 3: Implement deterministic packed texture sets**

```python
def create_pbr_texture_set(family, base_color, roughness, scale, size=256):
    images = {
        "base": create_generated_pbr_image(f"PBR__{family}__base-color", size, base_color, "base", scale),
        "normal": create_generated_pbr_image(f"PBR__{family}__normal", size, base_color, "normal", scale),
        "roughness": create_generated_pbr_image(f"PBR__{family}__roughness", size, base_color, "roughness", roughness),
    }
    for image in images.values():
        image.pack()
    return images
```

Use deterministic sinusoidal and hashed grain fields. Connect Base Color directly, Normal through a Normal Map node, and Roughness directly to the Principled shader. Mark non-color images as `Non-Color`.

- [ ] **Step 4: Add dimension-based UV tiling**

```python
def configure_ground_uv_tiling():
    tile_sizes = {"MAT__asphalt": 3.0, "MAT__concrete": 2.0, "MAT__entry-paving": 1.4, "MAT__lawn": 2.4, "MAT__bioswale-soil": 1.2, "MAT__planting-mulch": 0.8}
    for obj in bpy.data.objects:
        if obj.type == "MESH" and obj.data.materials and obj.data.materials[0].name in tile_sizes:
            scale_active_uv(obj, max(1.0, obj.dimensions.x / tile_sizes[obj.data.materials[0].name]), max(1.0, obj.dimensions.y / tile_sizes[obj.data.materials[0].name]))
```

- [ ] **Step 5: Generate a temporary model and verify GREEN**

Generate `/private/tmp/campus-pbr-contract.blend` and `.glb`, then run the focused PBR contract. Expected: PASS.

### Task 3: Reusable Clustered Trees

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: existing perimeter, inner, and forest tree placement arrays and PBR bark/foliage texture sets.
- Produces: `tapered_trunk()`, `clustered_crown()`, three reusable crown mesh variants, and `vegetationForm`/`instanceFamily` metadata.

- [ ] **Step 1: Write the failing vegetation contract**

```js
test('near vegetation uses tapered trunks clustered crowns and reusable PBR prototypes', () => {
  const audit = inspectBlendForVegetationPbr()
  assert.ok(audit.perimeterForms.every((record) => record.form === 'clustered-canopy'))
  assert.ok(audit.innerForms.every((record) => record.form === 'clustered-canopy'))
  assert.ok(audit.uniquePerimeterCrownMeshes >= 3 && audit.uniquePerimeterCrownMeshes <= 4)
  assert.ok(audit.crownVertexCounts.every((count) => count >= 120))
  assert.ok(audit.materials['MAT__trunk'].normal)
  assert.ok(audit.materials['MAT__foliage'].roughness)
})
```

- [ ] **Step 2: Verify RED against the formal model**

Expected: FAIL because the existing trees use a cylindrical trunk and single icosphere crown without PBR maps or form metadata.

- [ ] **Step 3: Implement tapered reusable vegetation**

```python
def tapered_trunk(name, radius, height, location, mat, parent, vertices=8):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius * 1.18, radius2=radius * 0.62, depth=height, location=location)
    trunk = bpy.context.object
    trunk.name = name
    trunk.parent = parent
    trunk.data.materials.append(mat)
    trunk["vegetationForm"] = "tapered-trunk"
    return trunk
```

Build each crown prototype as four transformed icosphere lobes joined into one mesh, set `vegetationForm=clustered-canopy`, and link one of three variants for every perimeter and inner tree. Keep background forest on three linked prototype families.

- [ ] **Step 4: Verify vegetation and full temporary-model tests**

Run the focused vegetation contract, then all Blender contracts against the temporary asset. Expected: all PASS and GLB below 35 MiB.

### Task 4: Formal Assets, Documentation, and Visual QA

**Files:**
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`
- Modify: `README.md`

**Interfaces:**
- Consumes: green generator, embedded PBR materials, reusable vegetation prototypes, and 35 MiB contract.
- Produces: formal editable BLEND and deployable Web GLB.

- [ ] **Step 1: Generate formal assets**

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --python tools/blender/create_factory_campus_graybox.py -- --blend-output assets/blender/factory-campus-graybox.blend --glb-output public/models/factory-campus-graybox.glb
```

- [ ] **Step 2: Run full verification**

```bash
env BLENDER_TEST_BLEND=assets/blender/factory-campus-graybox.blend BLENDER_TEST_GLB=public/models/factory-campus-graybox.glb node --test --test-concurrency=1 tools/blender/create_factory_campus_graybox.test.js
npm test
npm run build
git diff --check
```

- [ ] **Step 3: Visual QA**

Reload port 5180 and inspect day, campus-focus, and evening modes. Accept only if asphalt/concrete/grass respond differently to light, UVs do not visibly stretch, near trees read as irregular multi-lobe crowns, the gate and sports courts remain unobstructed, shadows have no black blocks, and no texture is missing.

- [ ] **Step 4: Document final asset policy**

Document embedded PBR families, reusable tree prototypes, the 35 MiB limit, and the rule that Blender procedural nodes must be baked or generated as standard images before GLB export.
