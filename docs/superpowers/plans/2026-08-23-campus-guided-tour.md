# Campus Guided Tour Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a controlled Web-only guided camera tour across the factory entrance, administration, production, processing, utilities, warehouse, and overview viewpoints.

**Architecture:** Store the authored inspection stops in a pure scene module and keep live tour state inside `useIndustrialScene`, next to the existing OrbitControls and camera transitions. Expose a small command API to `IndustrialScene`, which renders one compact dispatch-style controller; Blender, GLB, materials, and energy panels remain untouched.

**Tech Stack:** React 18, Three.js r165, OrbitControls, Node test runner, Vite.

## Global Constraints

- Tour only the middle Web 3D factory campus.
- Do not modify Blender, GLB, FBX, Unity, building geometry, or energy-panel content.
- Start, pause/resume, previous, next, and exit must all be keyboard accessible.
- Manual camera drag pauses autoplay instead of fighting the operator.
- Exiting restores the current default overview.
- Respect reduced-motion by completing camera transitions immediately.

---

### Task 1: Authored inspection route

**Files:**
- Create: `src/scene/campusTour.js`
- Test: `tests/campusTour.test.js`

**Interfaces:**
- Produces: `CAMPUS_TOUR_STOPS`, `normalizeCampusTourIndex(index)`, and `resolveCampusTourStop(index)`.
- Consumes: fixed factory-campus world coordinates.

- [x] **Step 1: Write failing route tests**

Require seven ordered, uniquely identified stops with finite camera and target triples, safe camera height, and circular index normalization.

- [x] **Step 2: Run the test and verify RED**

Run: `/Users/qzh/.nvm/versions/node/v22.23.1/bin/node --test tests/campusTour.test.js`

Expected: FAIL because `campusTour.js` does not exist.

- [x] **Step 3: Implement the route**

Author `gate`, `administration`, `production`, `processing`, `utilities`, `warehouse`, and `overview` stops. Keep every position outside its target building envelope and set transition/hold durations explicitly.

- [x] **Step 4: Run the focused test and verify GREEN**

Run: `/Users/qzh/.nvm/versions/node/v22.23.1/bin/node --test tests/campusTour.test.js`

Expected: PASS.

### Task 2: Camera tour controller

**Files:**
- Modify: `src/hooks/useIndustrialScene.js`
- Test: `tests/campusTour.test.js`

**Interfaces:**
- Consumes: `resolveCampusTourStop(index)` from Task 1.
- Produces: `tourState`, `startTour()`, `toggleTour()`, `previousTourStop()`, `nextTourStop()`, and `stopTour()` from `useIndustrialScene`.

- [x] **Step 1: Add state-machine behavior tests**

Test the pure index wrap and stop metadata that the controller consumes, including first/last wraparound.

- [x] **Step 2: Integrate live camera transitions**

Use the existing animation loop to lerp camera position and OrbitControls target with cubic easing. Advance after each stop hold, throttle React progress updates, pause on OrbitControls `start`, and restore overview on exit.

- [x] **Step 3: Run tour and existing scene tests**

Run: `/Users/qzh/.nvm/versions/node/v22.23.1/bin/node --test tests/campusTour.test.js tests/sceneMath.test.js tests/campusViewDefaults.test.js`

Expected: PASS.

### Task 3: Dispatch-style tour controls

**Files:**
- Create: `src/components/CampusTourControl.js`
- Modify: `src/components/IndustrialScene.jsx`
- Modify: `src/styles/index.css`
- Modify: `src/styles/energy-detail.css`
- Test: `tests/campusTourControl.test.js`

**Interfaces:**
- Consumes: the hook command API from Task 2 and `CAMPUS_TOUR_STOPS` labels.
- Produces: an accessible `厂区自动漫游` control with station progress and command buttons.

- [x] **Step 1: Write the failing component test**

Render inactive and active states. Require start, pause/resume, previous, next, exit, current station label, station count, and ARIA state.

- [x] **Step 2: Run the component test and verify RED**

Run: `/Users/qzh/.nvm/versions/node/v22.23.1/bin/node --test tests/campusTourControl.test.js`

Expected: FAIL because the component does not exist.

- [x] **Step 3: Implement and style the controller**

Use the existing cyan instrument palette, a single amber moving route marker, DIN utility typography, visible focus outlines, and a compact dock that does not overlap sunlight, traffic, or reset controls.

- [x] **Step 4: Verify the complete feature**

Run all tests, production build, `git diff --check`, and browser checks for start, pause, next, exit, button collisions, console errors, and both normal/detail layouts.

Expected: all checks pass and no model asset changes are introduced by this stage.
