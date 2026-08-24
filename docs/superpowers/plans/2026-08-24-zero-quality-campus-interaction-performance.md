# Zero-Quality-Loss Campus Interaction Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce campus drag and hover main-thread work without changing model geometry, materials, textures, lighting, shadows, resolution, or post-processing quality.

**Architecture:** Replace recursive raycasting across thousands of detailed building meshes with a small world-space bounding-box pick index for the 12 interactive buildings. Route hover picking through a requestAnimationFrame scheduler that coalesces pointer events and suspends picking while OrbitControls is actively moving; clicks remain synchronous and accurate against the building proxy index. Keep all changes isolated to interaction code and cover the new behavior with Node tests using real Three.js objects.

**Tech Stack:** React 18, Three.js 0.165, Node built-in test runner, Vite 5.

## Global Constraints

- Do not change the GLB, Blender source, geometry, materials, textures, lighting, shadow settings, DPR, renderer configuration, or post-processing effects.
- Preserve building hover highlighting, tooltip behavior, click selection, floor explosion, and campus tour behavior.
- Do not touch unrelated existing worktree changes.

---

### Task 1: Building proxy pick index

**Files:**
- Create: `src/scene/buildingPickIndex.js`
- Create: `tests/buildingPickIndex.test.js`

**Interfaces:**
- Consumes: Three.js `Box3`, `Raycaster`, and interactive building `Object3D` instances with `userData.buildingId`.
- Produces: `createBuildingPickIndex(buildings)` returning `{ refresh(), pick(raycaster) }`, where `pick` returns the nearest building or `null`.

- [ ] **Step 1: Write failing tests for nearest-building picking and refresh behavior**
- [ ] **Step 2: Run `node --test tests/buildingPickIndex.test.js` and verify the missing-module failure**
- [ ] **Step 3: Implement the minimal world-space bounding-box index**
- [ ] **Step 4: Run `node --test tests/buildingPickIndex.test.js` and verify it passes**

### Task 2: Pointer-pick scheduling

**Files:**
- Create: `src/scene/pointerPickScheduler.js`
- Create: `tests/pointerPickScheduler.test.js`

**Interfaces:**
- Consumes: injected `requestFrame`, `cancelFrame`, `pick(event)`, and `publish(result, event)` functions.
- Produces: `createPointerPickScheduler(options)` returning `{ move(event), setInteracting(active), leave(), dispose() }`.

- [ ] **Step 1: Write failing tests proving moves coalesce to one pick per frame and picks pause during camera interaction**
- [ ] **Step 2: Run `node --test tests/pointerPickScheduler.test.js` and verify the missing-module failure**
- [ ] **Step 3: Implement the minimal scheduler with latest-event replay after interaction ends**
- [ ] **Step 4: Run `node --test tests/pointerPickScheduler.test.js` and verify it passes**

### Task 3: Industrial scene integration

**Files:**
- Modify: `src/hooks/useIndustrialScene.js`

**Interfaces:**
- Consumes: `createBuildingPickIndex` and `createPointerPickScheduler`.
- Produces: unchanged `useIndustrialScene` public API and unchanged rendered quality.

- [ ] **Step 1: Integrate proxy picking for hover and click, refreshing the index after the GLB is ready**
- [ ] **Step 2: Wire OrbitControls `start`/`end` events to suspend and resume scheduled hover picking**
- [ ] **Step 3: Clean up scheduler and named control listeners on unmount**
- [ ] **Step 4: Run the focused tests, the complete test suite, and `npm run build`**
- [ ] **Step 5: Inspect the final diff and confirm no visual-quality configuration changed**
