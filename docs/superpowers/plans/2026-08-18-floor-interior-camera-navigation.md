# Floor Interior Camera Navigation Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users click any exploded floor in the building panel and smoothly move the 3D camera into an inspection view centered on that floor's interior scene.

**Architecture:** Add a small pure camera-pose helper, expose a `focusFloor` command from the Three.js hook, and wire accessible floor buttons plus focused-floor state through `IndustrialScene`. The camera tween follows the moving floor while the explosion animation settles, then releases OrbitControls for normal inspection.

**Tech Stack:** React 19, Three.js, OrbitControls, Node test runner, Vite

---

### Task 1: Define the floor inspection camera pose

**Files:**
- Create: `src/scene/floorCamera.js`
- Create: `tests/floorCamera.test.js`

- [x] Write a failing test for a centered, close-range interior inspection pose.
- [x] Run the focused test and confirm the module/behavior is missing.
- [x] Implement clamped camera distance and target height.
- [x] Run the focused test and confirm it passes.

### Task 2: Make floor rows accessible navigation controls

**Files:**
- Modify: `src/components/BuildingFloorPanel.js`
- Modify: `src/components/IndustrialScene.jsx`
- Modify: `src/styles/index.css`
- Modify: `tests/buildingFloorPanel.test.js`

- [x] Update the panel test to require named floor buttons and active-floor state.
- [x] Run the focused test and confirm it fails.
- [x] Add floor selection props, status copy, and focused visual treatment.
- [x] Wire selection, close, and reset state in the scene component.
- [x] Run the focused test and confirm it passes.

### Task 3: Animate the camera into the selected floor

**Files:**
- Modify: `src/hooks/useIndustrialScene.js`

- [x] Add a stable `focusFloor(buildingId, floorId)` hook command.
- [x] Resolve the live floor world position and track it while the floor explodes.
- [x] Tween camera position and OrbitControls target, respecting reduced motion.
- [x] Cancel floor focus on manual interaction and reset.
- [x] Run all web tests and production build.
- [x] Verify building selection, floor switching, reset, and console state in the running browser.
