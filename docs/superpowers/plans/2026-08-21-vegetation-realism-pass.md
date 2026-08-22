# Campus Vegetation Realism Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing factory-campus trees from repeated rounded masses to a readable near/mid/far vegetation system while preserving the approved campus layout and Web interactions.

**Architecture:** Keep all existing tree transforms and clearance corridors. Extend the Blender generator with six reusable canopy profiles, layered foliage PBR tones, explicit vegetation tier/species metadata, and visible branch structure on near trees; use a focused updater to apply the same changes to the approved `.blend` without rebuilding unrelated buildings. Export one self-contained GLB and verify its model contract, size, collisions, and Web delivery.

**Tech Stack:** Blender 5.2 Python API, bmesh, glTF/GLB standard PBR, Node.js test runner, Three.js/Vite asset loading.

## Global Constraints

- Do not use the `img2threejs` skill.
- Preserve all approved building, road, sports, parking, gate, camera, floor, and traffic transforms.
- Keep gate, building-access, parking, road, and sports-court clearance contracts green.
- Reuse canopy meshes by species/tier and keep `public/models/factory-campus-graybox.glb` below 35 MiB.
- Embed standard PBR images in the GLB; do not introduce external runtime texture requests.
- Do not commit, push, merge, or remove the worktree without explicit user instruction.

---

### Task 1: Vegetation Quality Contract

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`

**Interfaces:**
- Consumes: generated `.blend` vegetation objects and materials.
- Produces: an audit contract for `vegetationSpecies`, `vegetationTier`, reusable canopy meshes, branch detail, PBR channels, and material palette diversity.

- [ ] **Step 1: Write a failing Blender audit test**

Add a test that loads the generated fixture and asserts: at least six `vegetationSpecies` values; all crowns carry `vegetationTier` in `near`, `mid`, or `far`; near trees contain branch-detail objects; near crowns use at least three foliage material slots; reusable crown meshes stay at or below twelve; every foliage material contains embedded `base-color`, `normal`, and `roughness` channels.

- [ ] **Step 2: Run the focused test and verify RED**

Run the Node test by name and confirm failure occurs because current crowns lack the new species/tier/branch and layered-material contract.

### Task 2: Six-Profile Reusable Tree System

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Create: `tools/blender/update_factory_vegetation_realism.py`

**Interfaces:**
- Produces: `CANOPY_PROFILES`, `clustered_crown(..., species=..., tier=...)`, vegetation metadata, shared PBR material families, and a deterministic updater CLI accepting `--generator`, `--blend-output`, and `--glb-output`.

- [ ] **Step 1: Add six silhouette profiles**

Define broadleaf, spreading, columnar, ornamental, woodland, and conifer canopy profiles. Construct them from multiple low-subdivision asymmetric lobes or stacked conifer forms so silhouette complexity rises without multiplying unique meshes per tree.

- [ ] **Step 2: Add layered materials and branch structure**

Give near/mid crown prototypes deep, mid, and sunlit foliage slots and deterministically assign lobe faces to those slots. Add low-sided branch meshes inside near crowns, using the shared bark material, and tag them `vegetationDetail=branch-structure`.

- [ ] **Step 3: Assign species and tiers without changing placement**

Perimeter and inner landscaping use near/mid profiles; background forest uses mid/far profiles. Preserve all existing object locations, collision clearances, scale variation, and forest bands while adding `vegetationSpecies` and `vegetationTier` metadata.

- [ ] **Step 4: Implement the incremental updater**

Load the current approved `.blend`, refresh vegetation PBR nodes, build the reusable profile meshes through generator helpers, reassign existing crown meshes by deterministic object-name mapping, add near-tree branch detail, save the editable Blender file, and export the Web GLB.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run the vegetation audit against the updated production `.blend`/GLB via `BLENDER_TEST_BLEND` and `BLENDER_TEST_GLB`, then run the existing vegetation, forest-transition, collision, and GLB-budget contracts.

### Task 3: Export and Web Verification

**Files:**
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`
- Modify: `README.md`

**Interfaces:**
- Consumes: approved Blender asset and vegetation updater.
- Produces: editable `.blend`, deployable GLB, documentation, and verified Web presentation.

- [ ] **Step 1: Apply the updater to production assets**

Run Blender in background mode with `update_factory_vegetation_realism.py`, targeting the tracked `.blend` and `public/models/factory-campus-graybox.glb`.

- [ ] **Step 2: Run complete verification**

Run all Node tests and `npm run build`; verify the GLB is below 35 MiB and contains no external image URIs.

- [ ] **Step 3: Verify the running Web asset**

Confirm port 5180 serves the homepage and GLB with HTTP 200. Inspect the daytime campus view for varied silhouettes, visible crown depth, natural forest transition, unobstructed gate/sports areas, and no missing textures or black foliage.

- [ ] **Step 4: Document the pass**

Update `README.md` with the six-profile near/mid/far vegetation system, embedded PBR foliage channels, branch detail policy, reusable-mesh strategy, and the fact that GLB export preserves the approved layout.
