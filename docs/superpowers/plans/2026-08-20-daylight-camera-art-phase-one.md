# Daylight and Camera Art Phase One Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Web daytime campus read as a bright industrial architectural visualization, reveal rear and side elevations, and present the enlarged site from a closer front-left hero view.

**Architecture:** Keep Blender geometry, PBR textures, floor hierarchy, roads, vegetation, and interactions unchanged. Correct the Web lighting rig at its source by moving the shadowless directional fill opposite the key light, use a bright neutral daytime sky/fog and lifted hemisphere ground bounce, then update the immutable opening camera preset and reset behavior through the existing `initialCameraView` consumer.

**Tech Stack:** Three.js lighting and tone mapping, React scene hook, Node test runner, in-app browser visual QA.

## Global Constraints

- Do not modify Blender geometry, building transforms, PBR textures, roads, vegetation, traffic, or floor interaction.
- Preserve the approved front-left viewing direction (`x < 0`, `z < 0`).
- Preserve evening-mode lighting and operational fixture behavior.
- Keep pale PBR roofs below clipping and keep physical shadows enabled.
- Do not commit or push without explicit user instruction.

---

### Task 1: Opposed Daylight Fill and Bright Environment

**Files:**
- Modify: `tests/campusLightingMode.test.js`
- Modify: `tests/sceneAssetIntegration.test.js`
- Modify: `src/scene/campusLightingMode.js`
- Modify: `src/scene/sceneFactory.js`

**Interfaces:**
- Consumes: `deriveCampusLightingState(mode)`, `applyCampusLightingMode({ scene, renderer }, mode)`, and `createIndustrialScene()`.
- Produces: a bright day state plus a shadowless `CampusShadowFill` whose horizontal direction opposes `CampusKey`.

- [ ] **Step 1: Write failing daylight and rig tests**

Require the day sky and fog to use `0x7299a8`, fog density at most `.006`, lifted hemisphere colors, a distinct cool fill color, and an opposing key/fill position dot product below zero.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
node --test tests/campusLightingMode.test.js tests/sceneAssetIntegration.test.js
```

Expected: FAIL because the current sky is navy, the hemisphere ground bounce is dark green, and the fill duplicates the key position.

- [ ] **Step 3: Implement the minimal lighting correction**

Set the day environment to a bright blue-gray sky, lower fog density, retain restrained exposure, add `fillColor`, and position `CampusShadowFill` on the opposite side of the campus while leaving `castShadow=false`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the same focused test command and require zero failures.

### Task 2: Closer Front-Left Opening Camera

**Files:**
- Modify: `tests/sceneMath.test.js`
- Modify: `src/scene/sceneMath.js`

**Interfaces:**
- Consumes: `initialCameraView`, `cameraLimits`, and the existing reset interpolation in `useIndustrialScene`.
- Produces: a 76–84 unit front-left camera distance and a lower vertical-to-horizontal viewing ratio.

- [ ] **Step 1: Write the failing camera composition contract**

Require the opening camera distance to be between 76 and 84 units, retain negative X/Z, and keep `(cameraY - targetY) / horizontalDistance <= .40`.

- [ ] **Step 2: Run the camera test and verify RED**

Run:

```bash
node --test tests/sceneMath.test.js
```

Expected: FAIL because the current camera distance is about 94 units.

- [ ] **Step 3: Implement the opening view**

Use `position: [-47, 29, -58]`, `target: [0, 1.4, -3.2]`, keep `fov: 38`, and align the initial fog/exposure defaults with the corrected day state.

- [ ] **Step 4: Run the camera test and verify GREEN**

Run the same camera test and require zero failures.

### Task 3: Full Verification and Visual QA

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: final Web scene.
- Produces: verified day/evening/reset/focus behavior and documented phase result.

- [ ] **Step 1: Run full automated verification**

```bash
npm test
npm run build
git diff --check
```

- [ ] **Step 2: Inspect the real Web page**

Refresh `http://localhost:5180/`, inspect default day, campus-only focus, a rear/side orbit, evening mode, and reset view. Accept only if rear walls retain visible material color, the sky reads as daytime, pale roofs do not clip, and evening remains darker than day.

- [ ] **Step 3: Document the stage**

Record the opposite-side fill, bright daytime environment, reduced fog, and closer opening camera in `README.md`.
