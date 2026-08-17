# Expanded Campus Traffic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the factory campus, separate every building mass, add a complete perimeter traffic system with parking and an operable gate route, and correct the Web opening view.

**Architecture:** Keep Blender as the authoritative source for static campus geometry and GLB hierarchy. Export named traffic nodes and motion metadata in the GLB, then let Three.js animate only the designated gate vehicle. Centralize the Web camera preset in `sceneMath.js` so its direction and distance are directly testable.

**Tech Stack:** Blender 5.2 Python API, glTF/GLB, Three.js, React, Node test runner, Vite.

## Global Constraints

- Preserve every `BLDG__*` and `FLOOR__*` node name and its metadata.
- Preserve the existing semi-realistic industrial material direction.
- Do not use `img2threejs`.
- Keep the running development service on port 5180.

---

### Task 1: Expanded campus layout and traffic geometry

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Modify: `src/scene/buildingRegistry.js`

**Interfaces:**
- Produces: named GLB nodes `ROAD__perimeter-*`, `PARKING__surface`, `GATE__barrier-*`, and `VEHICLE__gate-shuttle__root`.
- Preserves: `BLDG__<buildingId>` and `FLOOR__<buildingId>__<floorId>`.

- [ ] Write a Blender integration test requiring a site at least 54 × 38 units, four perimeter road sides, a parking surface with at least ten marked bays, an open vehicle gate, and pairwise building clearance.
- [ ] Run `node --test tools/blender/create_factory_campus_graybox.test.js` and confirm the new assertions fail against the current 44 × 30 site.
- [ ] Move building roots to a wider road-separated grid, enlarge the site, create the four-sided road loop, expand parking, and add gate/vehicle details.
- [ ] Update the fallback registry positions and sizes to match the new GLB coordinate system.
- [ ] Re-run the Blender test and confirm it passes.

### Task 2: Gate vehicle Web animation

**Files:**
- Modify: `tests/factoryCampusAsset.test.js`
- Modify: `tests/sceneAssetIntegration.test.js`
- Modify: `src/scene/factoryCampusAsset.js`
- Modify: `src/scene/sceneFactory.js`
- Modify: `src/hooks/useIndustrialScene.js`

**Interfaces:**
- Consumes: GLB object extras `motionPath`, `motionDistance`, and `motionSpeed`.
- Produces: `animatedObjects` from `prepareFactoryCampusModel(root)` and `kind: 'vehicle'` animation records in the render loop.

- [ ] Add failing tests proving motion-tagged GLB nodes are returned and installed in the live animation registry.
- [ ] Implement motion-node discovery without changing building interaction selection.
- [ ] Animate the gate vehicle along its exported route, including smooth loop easing and heading reversal.
- [ ] Run the focused asset and scene integration tests.

### Task 3: Correct and widen the opening view

**Files:**
- Modify: `tests/sceneMath.test.js`
- Modify: `src/scene/sceneMath.js`
- Modify: `src/hooks/useIndustrialScene.js`

**Interfaces:**
- Produces: `initialCameraView = { position, target, fov }`.

- [ ] Add a failing test requiring a front-left Web view (`x < 0`, `z < 0`) with a camera distance above 48 units and compatible orbit limits.
- [ ] Export the camera preset and consume it for initial/reset camera state.
- [ ] Increase orbit distance limits for the expanded campus.
- [ ] Run the focused math test.

### Task 4: Regenerate and verify deliverables

**Files:**
- Regenerate: `assets/blender/factory-campus-graybox.blend`
- Regenerate: `public/models/factory-campus-graybox.glb`
- Create: `output/playwright/factory-campus-expanded-traffic.png`

**Interfaces:**
- Produces: editable Blender source and browser-ready GLB with identical node contracts.

- [ ] Run the Blender generator against the tracked `.blend` and `.glb` paths.
- [ ] Run `npm test`, the Blender generator tests, `npm run build`, and `git diff --check`.
- [ ] Reload port 5180, inspect the opening direction/scale, verify gate motion and building selection, then save the final screenshot.
