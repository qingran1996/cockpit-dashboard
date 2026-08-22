# Campus Scale, Gate Response, and Facade Tactility Plan

> Execution note: implement incrementally with red/green tests and regenerate the Blender/GLB assets once all generator changes are ready.

**Goal:** Make the gate react as a vehicle reaches the recognition zone, double the campus footprint without inflating buildings, and give every wall a crisper constructed-metal finish.

**Architecture:** Keep the Blender file authoritative for geometry. Introduce one plan-scale constant (`sqrt(2)`) for all campus anchor coordinates and major horizontal site extents while preserving local object sizes and vertical dimensions. Mirror scaled building anchors in the Web registry, and synchronize the Web camera envelope. Keep gate behavior in the existing shared traffic sampler so vehicle and barrier remain deterministic.

**Tech Stack:** Blender Python (`bpy`), Three.js/React/Vite, Node test runner.

---

### Task 1: Make gate recognition physically lead the barrier

**Files:**
- Modify: `tests/gateTrafficCycle.test.js`
- Modify: `src/scene/gateTrafficCycle.js`

1. Add a failing assertion that at the recognition-zone portion of the approach the vehicle is still approaching while `barrierOpen > 0`.
2. Run the focused gate tests and confirm the new assertion fails.
3. Move the barrier-opening window forward, retain a short stop/recognition hold, and keep the vehicle from crossing until the barrier is fully raised.
4. Run gate, vehicle, and barrier animation tests.

### Task 2: Define the doubled-area campus contract

**Files:**
- Modify: `tests/buildingRegistry.test.js`
- Modify: `tests/sceneMath.test.js`
- Modify: `src/scene/buildingRegistry.js`
- Modify: `src/scene/sceneMath.js`

1. Add failing tests for an exported plan footprint of at least `58 * 42 * 1.98`, wider building separation, and a farther opening camera within orbit limits.
2. Run focused registry/camera tests and confirm failure.
3. Scale only registry plan coordinates by `sqrt(2)`; preserve building width, depth, height.
4. Publish plan dimensions and move the opening camera/target/fog envelope to frame the larger campus.
5. Run focused tests.

### Task 3: Expand Blender site and strengthen wall construction

**Files:**
- Modify: `tests/generatedModelContract.test.js` (new)
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tools/blender/create_factory_campus_graybox.py`

1. Add a fast failing GLB contract test for facade shadow joints/pressed battens and the darker joint material.
2. Extend Blender integration assertions for doubled ground area, unchanged representative building footprint, scaled anchors, and facade joint counts/material contrast.
3. Introduce `PLAN_SCALE = sqrt(2)` and plan-coordinate helpers in the generator.
4. Scale building anchors, ground/perimeter/roads, gate/parking/court, pipe routes, landscaping, furnishings, environment, and editor camera horizontally; keep local assets and vertical dimensions unchanged.
5. Add recessed vertical shadow joints and horizontal pressed-metal battens to front and camera-visible side walls. Increase wall-panel color/roughness contrast while remaining opaque and industrial.
6. Regenerate `assets/blender/factory-campus-graybox.blend` and `public/models/factory-campus-graybox.glb`.
7. Run the fast GLB contract and full shared Blender fixture suite.

### Task 4: Verify Web integration and visual framing

**Files:**
- Modify if required: Web scene files identified by tests/visual QA.

1. Run all Node tests and the production build.
2. Inspect the running Web page at desktop viewport: initial framing, gate approach/lift/cross/close sequence, wall readability, and campus perimeter.
3. Correct only verified regressions.
4. Re-run tests/build and report generated asset sizes and exact verification results.
