# Representative Building Facade Refinement Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Improve the perceived realism of the approved factory-campus model by adding construction depth and distinctive facade modules to the main production hall, administration building, and gatehouse while preserving the site layout, floor hierarchy, explosion interaction, and vehicle animation.

**Architecture:** Keep the existing procedural Blender generator as the source of truth. Add GLB-safe mesh-only facade helpers whose objects remain parented to each `BLDG__*` root, so the Web scene continues to classify them as building exteriors. Verify the exported `.blend` and `.glb` through named-node and dimensional contracts before visual browser QA.

**Tech Stack:** Blender 5.2 Python API, Node.js test runner, glTF/GLB, Vite/Three.js browser viewer.

---

### Task 1: Lock the facade-detail contract

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`

- [x] Add a focused generator test for representative-building construction details.
- [x] Assert named portal frames, loading dock, sectional-door frame, administration window reveal/frame, administration entrance step, gatehouse window reveal, canopy bracket, and bollard.
- [x] Inspect mesh dimensions and material properties to prove the details have physical depth.
- [x] Run the focused test and confirm it fails because the new nodes do not exist yet.

### Task 2: Implement reusable facade modules

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`

- [x] Add facade-frame, secondary-wall, and loading-dock materials.
- [x] Add small reusable helpers for framed openings and projecting construction members.
- [x] Add main production hall portal frames, sectional-door surrounds, loading platform, bumpers, and wall bands.
- [x] Add administration window reveals, mullion frames, entrance steps, and canopy supports.
- [x] Add gatehouse service-window reveal, canopy brackets, entrance plinth, and protective bollards.
- [x] Parent every new mesh to its corresponding building root and preserve all existing `BLDG__*` and `FLOOR__*` metadata.

### Task 3: Regenerate editable and Web assets

**Files:**
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`

- [x] Run the Blender generator against the tracked asset paths.
- [x] Confirm the `.blend` remains editable and the `.glb` exports successfully.
- [x] Re-run the focused facade-detail test and confirm it passes.

### Task 4: Regression and visual verification

**Files:**
- Verify: `tools/blender/create_factory_campus_graybox.test.js`
- Verify: `src/scene/buildingRegistry.js`
- Verify: `public/models/factory-campus-graybox.glb`

- [x] Run the complete Blender generator test suite serially.
- [x] Reload the running Web app on port 5180 and inspect the initial view.
- [x] Confirm building selection, all-floor explosion, reset, and vehicle animation still work.
- [x] Capture a browser screenshot and evaluate wall depth, facade hierarchy, silhouette, and visual noise at the normal dashboard camera distance.

### Task 5: Replace uniform white shells with constructed wall systems

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`

- [x] Add a failing contract test covering front panels, visible-side panels, wall skirts, corner flashing, material variation, and building-root ownership for all twelve buildings.
- [x] Darken the uniform base shell and add alternating low-gloss insulated-panel modules.
- [x] Add concrete wall skirts, graphite datum bands, and metal corner flashing to the front and camera-visible side of every building.
- [x] Regenerate the editable Blender file and Web GLB.
- [x] Pass the complete Blender, frontend, build, browser-console, and floor-explosion verification suite.
