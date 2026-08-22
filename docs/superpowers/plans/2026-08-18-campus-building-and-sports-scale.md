# Campus Building and Sports Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase building presence across the doubled campus, turn the administration building into a grand visual landmark, enlarge the basketball court, and add a full tennis court beside it.

**Architecture:** Keep the Blender generator authoritative. Update the shared building dimensions in both Blender records and the Web registry, then generate architectural detail from those dimensions so floor interaction remains intact. Build both sports courts as named Blender hierarchies under the existing site root so they export to GLB without new runtime code.

**Tech Stack:** Blender 5.2 Python (`bpy`), Three.js GLB runtime, Node test runner, Vite.

## Global Constraints

- Preserve the doubled campus footprint and existing building anchor layout.
- Preserve all current floor IDs, explosion behavior, gate traffic, landscaping, and Web interactions.
- Do not use `img2threejs`.
- Keep the generated GLB below 16 MiB.
- Do not commit or push unless the user explicitly requests it.

---

### Task 1: Increase Building Massing Contracts

**Files:**
- Modify: `tests/buildingRegistry.test.js`
- Modify: `src/scene/buildingRegistry.js`
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: existing `buildingRegistry` records and Blender `BUILDINGS` tuples.
- Produces: larger but position-compatible `size` metadata and generated building shells.

- [ ] **Step 1: Write failing registry assertions**

Assert literal target dimensions: main production hall `[16.8, 3.8, 7.0]`, administration `[8.4, 6.2, 5.4]`, and every non-gatehouse building footprint larger than its prior baseline.

- [ ] **Step 2: Run the focused registry test and verify the old dimensions fail**

Run: `node --test tests/buildingRegistry.test.js`

- [ ] **Step 3: Update Web and Blender dimension records**

Use matching values in registry order `[width, height, depth]` and Blender order `(width, depth, height)`; do not change building anchor coordinates.

- [ ] **Step 4: Run the registry tests**

Run: `node --test tests/buildingRegistry.test.js tests/floorCamera.test.js`

### Task 2: Rebuild the Administration Building as the Landmark

**Files:**
- Modify: `tests/generatedModelContract.test.js`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: `create_administration_facade(width, depth, height, mats, root)`.
- Produces: `ADMIN__grand-atrium`, `ADMIN__portico-column-*`, `ADMIN__grand-canopy`, `ADMIN__crown-band`, and layered stone/bronze materials.

- [ ] **Step 1: Add failing GLB assertions for the landmark facade nodes**

Require one grand atrium, at least four portico columns, a projecting canopy, broad entrance steps, a crown band, and bronze trim material.

- [ ] **Step 2: Run the fast GLB contract and verify those nodes are missing**

Run: `node --test tests/generatedModelContract.test.js`

- [ ] **Step 3: Implement the dimension-driven landmark facade**

Create a centered near-full-height glazed atrium, symmetrical stone wings, four tall front columns, three broad entry steps, a deep canopy, crown band, and warm metallic trim. Parent every object to `BLDG__administration` so floor explosion behavior remains coherent.

- [ ] **Step 4: Extend Blender integration assertions**

Assert the administration shell is at least `8.3 × 5.3 × 6.1`, the canopy projects at least `1.2`, four columns exist, and atrium glazing occupies at least 60% of facade height.

### Task 3: Expand Basketball and Add Tennis Court

**Files:**
- Modify: `tests/generatedModelContract.test.js`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: `create_roads_and_site(mats, campus)`.
- Produces: `SITE__basketball-court` with an `8.8 × 5.2` surface and `SITE__tennis-court` with an `8.4 × 4.4` surface, center net, posts, markings, and perimeter fence.

- [ ] **Step 1: Add failing GLB assertions for tennis and enlarged basketball contracts**

Require `TENNIS__surface`, `TENNIS__net`, two net posts, fence runs, and the existing basketball hoop nodes.

- [ ] **Step 2: Verify the old GLB fails the tennis contract**

Run: `node --test tests/generatedModelContract.test.js`

- [ ] **Step 3: Build the courts and keep clear circulation**

Place basketball at base anchor `(2.5, 15.5)` and tennis at `(-6.2, 15.5)` before plan scaling. Use local geometry dimensions so the campus plan transform moves their roots without stretching sports equipment.

- [ ] **Step 4: Assert court dimensions and separation in Blender integration tests**

Require basketball `8.8 × 5.2`, tennis `8.4 × 4.4`, court-to-court gap at least `2.0`, and no overlap with the enlarged administration or front warehouse bounds.

### Task 4: Regenerate and Verify

**Files:**
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Consumes: the completed Blender generator.
- Produces: editable `.blend` and Web-ready `.glb` assets.

- [ ] **Step 1: Run Blender once to regenerate both assets**

Run the generator with the repository asset paths.

- [ ] **Step 2: Run fast Web and GLB tests**

Run: `npm test`

- [ ] **Step 3: Run the full shared Blender fixture suite**

Run: `node --test tools/blender/create_factory_campus_graybox.test.js`

- [ ] **Step 4: Build and visually inspect the running page**

Run: `npm run build`, reload `http://localhost:5180/`, and inspect initial composition plus a closer administration/sports view. Confirm no console errors.

- [ ] **Step 5: Verify asset budget and diff cleanliness**

Run: `stat` for both assets and `git diff --check`. Report uncommitted status explicitly.
