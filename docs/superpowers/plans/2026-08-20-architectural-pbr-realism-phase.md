# Architectural PBR Realism Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the campus buildings' scalar-only wall and roof materials with five embedded, glTF-compatible PBR material families that remove the uniform plastic appearance while preserving the approved layout and Web interactions.

**Architecture:** Blender deterministically generates one shared Normal, Roughness, and Occlusion set per architectural family plus tinted Base Color variants for the materials in that family. Materials connect directly to Principled BSDF inputs and a `glTF Material Output` occlusion socket, building meshes receive dimension-based tiled UVs, and Blender exports all images inside the GLB. Three.js continues to load the same single model and only supplies lighting, shadows, and tone mapping.

**Tech Stack:** Blender 5.2 Python API, glTF 2.0 metallic-roughness materials, embedded GLB images, Three.js, Node test runner.

## Global Constraints

- Preserve every approved building transform, floor hierarchy, road, court, gate, route, camera direction, and interaction node name.
- Do not use `img2threejs` or external runtime texture requests.
- Keep `public/models/factory-campus-graybox.glb` at or below 35 MiB (36,700,160 bytes).
- Export standard Base Color, Normal, Roughness, and Occlusion textures for every architectural family.
- Painted metal and stone remain dielectric (`metallic <= 0.12`); galvanized roof materials remain metallic (`metallic >= 0.50`).
- Do not commit, push, merge, or remove the worktree without explicit user instruction.

---

### Task 1: Five-Family Architectural PBR Contract

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`

**Interfaces:**
- Consumes: formal or generated BLEND/GLB fixture.
- Produces: a real-asset contract for `industrial-coated-metal`, `warehouse-sandwich-panel`, `administration-limestone`, `architectural-concrete`, and `galvanized-roof`.

- [ ] **Step 1: Write the failing BLEND contract**

Audit representative materials `MAT__factory-wall`, `MAT__warehouse-wall`, `MAT__admin-stone`, `MAT__wall-plinth`, and `MAT__roof`. Require `architecturalPbrFamily`, four image channels (`base-color`, `normal`, `roughness`, `occlusion`), embedded images of at least 256×256, Non-Color data maps, and a linked `glTF Material Output` Occlusion socket.

- [ ] **Step 2: Write the GLB boundary assertions**

Parse the GLB JSON chunk and require all five representative materials to expose `baseColorTexture`, `metallicRoughnessTexture`, `normalTexture`, and `occlusionTexture`, with every referenced image using a binary `bufferView` and no external URI.

- [ ] **Step 3: Verify RED against the current formal assets**

Run:

```bash
BLENDER_TEST_BLEND=assets/blender/factory-campus-graybox.blend \
BLENDER_TEST_GLB=public/models/factory-campus-graybox.glb \
node --test --test-name-pattern='architectural materials export five embedded PBR families' \
tools/blender/create_factory_campus_graybox.test.js
```

Expected: FAIL because the representative building materials currently contain no image textures.

### Task 2: Deterministic Architectural Texture Families

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: existing `material()` results and deterministic generated-image utilities.
- Produces: `configure_architectural_pbr_materials(mats)`, one shared data-map set per family, material-specific Base Color images, and glTF occlusion nodes.

- [ ] **Step 1: Add family-aware image generation**

Extend generated images with a `pattern` argument (`coated-metal`, `warehouse-panel`, `limestone`, `concrete`, `galvanized`) and an `occlusion` channel. Use periodic fields so the textures tile; keep Roughness, Normal, and Occlusion in Non-Color space and tag each image with `pbrChannel` and `pbrFamily`.

- [ ] **Step 2: Add glTF-compatible occlusion nodes**

Create or reuse a node group named `glTF Material Output` with a float input named `Occlusion`. Connect the red channel of the family occlusion texture to this socket while connecting Base Color, Roughness, and Normal to the Principled shader.

- [ ] **Step 3: Configure the five material families**

Use these family assignments:

```python
ARCHITECTURAL_PBR_FAMILIES = {
    "industrial-coated-metal": ["factory_wall", "factory_panel_light", "factory_panel_mid", "process_wall", "process_panel_light", "process_panel_mid", "utility_wall", "utility_panel_light", "utility_panel_mid", "laboratory_wall", "laboratory_panel_light", "laboratory_panel_mid"],
    "warehouse-sandwich-panel": ["warehouse_wall", "warehouse_panel_light", "warehouse_panel_mid"],
    "administration-limestone": ["admin_wall", "admin_stone_light", "admin_stone_dark"],
    "architectural-concrete": ["plinth", "curb", "sidewalk"],
    "galvanized-roof": ["roof", "roof_rib", "gutter", "corner_flashing"],
}
```

Generate material-specific Base Color variants from each material's current diffuse color while sharing the family Normal, Roughness, and Occlusion maps. Store `architecturalPbrFamily` on every assigned material.

- [ ] **Step 4: Add dimension-based architectural UV tiling**

Implement `configure_architectural_uv_tiling()` and run it after `expand_campus_plan()`. Use approximately 1.2 m repeats for painted wall panels, 1.6 m for limestone/concrete, and 1.8 m for roof metal; mutate each shared mesh only once.

- [ ] **Step 5: Run a small Blender material smoke test**

Create one material for each family in a temporary empty scene, export a small GLB, and inspect its JSON. Expected: all five materials contain embedded Base Color, metallic-roughness, Normal, and Occlusion textures before the full campus generation starts.

### Task 3: Formal Asset Export and Realism QA

**Files:**
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`
- Modify: `README.md`

**Interfaces:**
- Consumes: green generator and five-family PBR contract.
- Produces: editable formal BLEND, deployable formal GLB, documented material policy.

- [ ] **Step 1: Generate formal assets**

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python tools/blender/create_factory_campus_graybox.py -- \
  --blend-output assets/blender/factory-campus-graybox.blend \
  --glb-output public/models/factory-campus-graybox.glb
```

- [ ] **Step 2: Run complete verification**

```bash
BLENDER_TEST_BLEND=assets/blender/factory-campus-graybox.blend \
BLENDER_TEST_GLB=public/models/factory-campus-graybox.glb \
node --test --test-concurrency=1 tools/blender/create_factory_campus_graybox.test.js
npm test
npm run build
git diff --check
```

Expected: all Blender and Web tests pass, build exits zero, and GLB remains below 35 MiB.

- [ ] **Step 3: Perform Web visual QA**

Refresh port 5180 and inspect day, evening, campus-focus, and one exploded-floor view. Accept only if wall/roof families remain visually distinct, normals do not sparkle or stretch, painted panels do not read as bare metal, limestone does not look glossy, pale roofs retain highlight detail, and no texture requests fail.

- [ ] **Step 4: Document the architectural material policy**

Add the five families, dielectric/metallic rules, embedded-image requirement, shared-map strategy, and 35 MiB budget to `README.md`.
