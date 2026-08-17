# Blender Factory Campus Graybox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an editable Blender graybox of the supplied factory-campus reference, export it as GLB, and load it into the existing Three.js dashboard without losing building selection or the procedural fallback.

**Architecture:** A deterministic Blender Python script owns the source scene and writes both the `.blend` authoring file and the web-ready `.glb`. A focused Three.js asset adapter loads the GLB, validates named building nodes, assigns interaction metadata, and replaces the existing procedural scene only after a successful load; load or validation failure leaves the current scene visible.

**Tech Stack:** Blender 5.2 LTS Python API, glTF 2.0/GLB, Three.js 0.165 `GLTFLoader`, React 18, Vite 5, Node test runner.

## Global Constraints

- Work only in the isolated `codex/main-based-20260817` worktree.
- Treat `bgtp.jpg` as a single-view visual reference, not CAD/BIM dimensional evidence.
- Keep every selectable building as a separate named GLB node with a stable `buildingId` custom property.
- Keep the existing procedural scene visible until the GLB has loaded and passed node validation.
- Do not add downloaded models or textures; the proof is geometry and flat PBR materials only.
- Ship the Blender generator script, editable `.blend`, exported `.glb`, tests, and a browser screenshot.

---

### Task 1: Define the campus asset contract

**Files:**
- Modify: `src/scene/buildingRegistry.js`
- Create: `src/scene/factoryCampusAsset.js`
- Create: `tests/factoryCampusAsset.test.js`

**Interfaces:**
- Produces: `FACTORY_CAMPUS_MODEL_URL: string`
- Produces: `prepareFactoryCampusModel(root: THREE.Object3D): { root, interactiveObjects }`
- Produces: `loadFactoryCampusModel(loader?): Promise<{ root, interactiveObjects }>`
- Consumes: registry records with `id`, `nodeName`, and dashboard detail fields.

- [ ] **Step 1: Write the failing node-contract tests**

Create synthetic Three.js groups named `BLDG__main-production-hall` and the other registry `nodeName` values. Assert the adapter returns one unique interactive root per registry record, writes `userData.buildingId`, enables shadows, and rejects a scene missing a required building.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/factoryCampusAsset.test.js`

Expected: FAIL because `factoryCampusAsset.js` does not exist.

- [ ] **Step 3: Implement the minimal adapter and reference-derived registry**

Replace the generic tanks/chimneys registry with the twelve visible campus masses. Implement validation by literal node name; do not infer selection order from traversal order.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/factoryCampusAsset.test.js`

Expected: PASS.

### Task 2: Add asynchronous GLB replacement with fallback

**Files:**
- Modify: `src/scene/sceneFactory.js`
- Modify: `tests/buildingRegistry.test.js`
- Create: `tests/sceneAssetIntegration.test.js`

**Interfaces:**
- `createIndustrialScene({ loadCampus } = {})` returns the existing `{ root, interactiveObjects, animated, dispose }` plus `ready: Promise<{ source: 'glb' | 'fallback', error?: Error }>`.
- `interactiveObjects` is mutated in place after successful load so existing raycasting keeps the same array reference.

- [ ] **Step 1: Write failing replacement and fallback tests**

Use real Three.js groups and injected resolved/rejected loader promises. Assert success removes the procedural content, installs GLB interactives, and reports `source: 'glb'`; rejection preserves the fallback and reports `source: 'fallback'`.

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test tests/sceneAssetIntegration.test.js`

Expected: FAIL because `createIndustrialScene` does not expose the asynchronous asset contract.

- [ ] **Step 3: Implement minimal scene replacement**

Group the existing procedural content as a disposable fallback, retain shared lights, and replace only after `prepareFactoryCampusModel` succeeds. Guard the promise against late resolution after disposal.

- [ ] **Step 4: Run integration and full tests**

Run: `node --test tests/sceneAssetIntegration.test.js && npm test`

Expected: all tests PASS.

### Task 3: Generate the Blender graybox and GLB

**Files:**
- Create: `tools/blender/create_factory_campus_graybox.py`
- Create: `assets/blender/factory-campus-graybox.blend`
- Create: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- CLI: `blender --background --python tools/blender/create_factory_campus_graybox.py -- --blend-output <path> --glb-output <path>`
- GLB root: `FactoryCampusGraybox`
- Selectable nodes: exact registry `nodeName` values with exported custom property `buildingId`.

- [ ] **Step 1: Author the deterministic generator**

Build the ground, orthogonal roads, twelve building masses, shallow roofs, roof vents/skylights, pipe racks, administration facade, basketball court, parking canopy, fence, and low-poly tree rows from primitives and collection instances. Use flat gray/white/blue/red PBR materials.

- [ ] **Step 2: Run Blender in background mode**

Run: `/Applications/Blender.app/Contents/MacOS/Blender --background --python tools/blender/create_factory_campus_graybox.py -- --blend-output assets/blender/factory-campus-graybox.blend --glb-output public/models/factory-campus-graybox.glb`

Expected: exit 0 with both assets written.

- [ ] **Step 3: Validate the exported asset**

Run Blender headlessly against the GLB and print the imported node names/custom properties. Assert all registry nodes exist, the scene has nonzero meshes, and bounds fit the dashboard camera envelope.

### Task 4: Browser visual verification

**Files:**
- Create: `output/playwright/blender-graybox-dashboard.png`
- Create: `docs/BLENDER_GRAYBOX.md`

**Interfaces:**
- Dashboard loads `/models/factory-campus-graybox.glb` under Vite.
- Hover/click IDs continue to resolve through `buildingById`.

- [ ] **Step 1: Document regeneration**

Add the exact Blender command, source/output locations, single-view limitations, and GLB node contract to `docs/BLENDER_GRAYBOX.md`.

- [ ] **Step 2: Run verification**

Run: `npm test && npm run build`.

Expected: all tests pass and Vite exits 0.

- [ ] **Step 3: Capture and inspect the real dashboard**

Run the Vite app, capture the center scene at 1920 × 1080, and verify the browser loaded the GLB rather than the procedural fallback. Check the reference-oblique silhouette, administration/court relationship, building separation, material readability, and click mapping.

- [ ] **Step 4: Report remaining approximation**

State which hidden elevations, exact dimensions, pipe connectivity, vegetation density, and facade details remain inferred from the single image.
