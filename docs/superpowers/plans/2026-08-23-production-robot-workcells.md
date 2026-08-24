# Production Robot Workcells Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add recognizable process piping and animated industrial robot workcells to the existing factory campus without restoring the rejected water, power, steam, or gas network overlays.

**Architecture:** Blender remains the source of truth for visible equipment, stable node names, hierarchy, and metadata. The Web loader discovers robot workcell roots from GLB metadata and a focused Three.js updater animates their joints while respecting reduced-motion preferences; existing floor-explosion and interior-camera behavior exposes the production-cell details.

**Tech Stack:** Blender Python, glTF/GLB, Three.js, React, Node test runner.

## Global Constraints

- Keep the existing campus layout and current building positions unchanged.
- Do not add water-grid, power-grid, steam-grid, gas-grid, glowing utility routes, or energy-flow overlays.
- Keep architectural wall materials biased toward light/white PBR finishes.
- Preserve existing vehicle, person, gate, floor-explosion, camera, and material controls.
- Keep the generated GLB below the existing 32 MiB automated budget and the user-approved 40 MiB ceiling.

---

### Task 1: Generated robot workcell contract

**Files:**
- Modify: `tests/generatedModelContract.test.js`
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Consumes: existing `BLDG__main-production-hall` and `FLOOR__*__L01` hierarchy.
- Produces: `ROBOT_CELL__*` roots with `motionPath=robot-work-cycle`, child joints identified by `robotJointRole`, and process-pipe equipment marked `layerRole=local-process-pipe`.

- [ ] **Step 1: Write the failing GLB contract test**

Require two production workcells, one warehouse palletizing cell, articulated joint roles, safety fencing, conveyors, and local process piping while asserting the rejected utility-network roots remain absent.

- [ ] **Step 2: Run the focused contract test and verify it fails because robot nodes are missing**

Run: `node --test --test-name-pattern="robot workcells" tests/generatedModelContract.test.js`

- [ ] **Step 3: Implement deterministic Blender workcell helpers**

Create GLB-safe mesh primitives for robot base, turntable, shoulder, elbow, wrist, gripper, conveyor, payload, safety fence, warning beacon, and localized production pipes. Parent robot pieces by joint so Web rotations articulate the entire arm.

- [ ] **Step 4: Regenerate the Blend and GLB assets**

Run: `/Applications/Blender.app/Contents/MacOS/Blender --background --python tools/blender/create_factory_campus_graybox.py -- --blend-output assets/blender/factory-campus-graybox.blend --glb-output public/models/factory-campus-graybox.glb`

- [ ] **Step 5: Re-run the focused GLB contract test and verify it passes**

Run: `node --test --test-name-pattern="robot workcells" tests/generatedModelContract.test.js`

### Task 2: Web robot discovery and motion

**Files:**
- Create: `src/scene/robotArmAnimation.js`
- Create: `tests/robotArmAnimation.test.js`
- Modify: `src/scene/factoryCampusAsset.js`
- Modify: `tests/factoryCampusAsset.test.js`
- Modify: `src/hooks/useIndustrialScene.js`

**Interfaces:**
- Consumes: GLB roots with `motionPath=robot-work-cycle` and descendants tagged with `robotJointRole`.
- Produces: animated entries with `kind=robot-arm`; `updateRobotArmAnimations(animatedItems, seconds, reducedMotion)` updates the base, shoulder, elbow, wrist, gripper, and payload.

- [ ] **Step 1: Write failing animation and loader tests**

Test a hand-built Three.js robot hierarchy for a visible pick/place cycle, opposite gripper motion, payload lift, and complete reset under reduced motion. Test loader discovery of joint-tagged descendants.

- [ ] **Step 2: Run tests and verify missing updater/registry behavior causes failure**

Run: `node --test tests/robotArmAnimation.test.js tests/factoryCampusAsset.test.js`

- [ ] **Step 3: Implement the minimal robot updater and GLB discovery**

Use smooth periodic phases with stored base rotations and positions. Skip robot roots in the generic vehicle branch.

- [ ] **Step 4: Integrate the updater into the render loop**

Call `updateRobotArmAnimations` after vehicle/person/gate updates so the animation is visible in both campus and floor-inspection views.

- [ ] **Step 5: Re-run focused tests and verify they pass**

Run: `node --test tests/robotArmAnimation.test.js tests/factoryCampusAsset.test.js`

### Task 3: System verification and documentation

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: regenerated model and integrated Web animation.
- Produces: documented Blender/Web responsibility split and reproducible export command.

- [ ] **Step 1: Document the robot workcells and process-equipment viewing path**

Describe main production L01, central process L01/L02, and warehouse palletizing areas; clarify that the visible pipes are local industrial process equipment rather than resource-network visualization.

- [ ] **Step 2: Run the complete automated test suite**

Run: `npm test`

- [ ] **Step 3: Run the production build**

Run: `npm run build`

- [ ] **Step 4: Inspect the generated GLB budget and robot node metadata**

Run the GLB contract test and confirm the model remains within both size limits.

- [ ] **Step 5: Review the final diff without touching unrelated Unity or deleted user files**

Run: `git status --short` and `git diff --stat`.
