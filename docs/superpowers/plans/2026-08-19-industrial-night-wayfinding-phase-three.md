# Industrial Night Wayfinding Phase Three Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the approved factory campus a coherent evening identity through functional building lights and readable wayfinding without changing layout, massing, or interactions.

**Architecture:** The Blender generator will add a small lighting-and-wayfinding kit to every building root and encode each fixture's purpose in GLB extras. The Web lighting controller will resolve warm entry, cool task, amber wayfinding, and lobby fixture profiles from those extras so day and evening modes produce controlled, function-specific emissive behavior.

**Tech Stack:** Blender 5.2 Python (`bpy`), glTF/GLB extras, Three.js materials, Node test runner, Vite.

## Global Constraints

- Preserve all approved building positions, footprints, heights, roads, gates, courts, parking, traffic, landscape, and camera framing.
- Preserve `BLDG__*`, `FLOOR__*`, route, vehicle, gate, floor explosion, interior focus, and campus-focus contracts.
- Keep the official GLB at or below 20 MiB (20,971,520 bytes).
- Use embedded materials and simple fixture geometry only; add no external texture or runtime request.
- Keep day mode restrained and make evening mode legible without turning the campus into a neon scene.
- Continue in `/private/tmp/Cockpit-blender-graybox` on `codex/main-based-20260817`; do not commit, merge, or push during this phase.

---

### Task 1: Define fixture roles and Web lighting behavior

**Files:**
- Modify: `tests/campusLightingMode.test.js`
- Modify: `src/scene/campusLightingMode.js`

**Interfaces:**
- Consumes: `deriveCampusLightingState(mode)` and object `userData.lightRole` imported from GLB extras.
- Produces: `resolveFixtureLighting(object, state) -> { color, intensity } | null` and role-specific state intensities.

- [ ] Write failing tests using real Three.js meshes for `entry-warm`, `task-cool`, `wayfinding-amber`, and `lobby-warm` roles.
- [ ] Verify the tests fail because the role resolver and role-specific intensities do not exist.
- [ ] Implement the resolver and make `applyCampusLightingMode` clone and update all role-bearing fixture materials.
- [ ] Verify day fixtures stay subdued while evening entry/task/lobby fixtures become visibly stronger with distinct colors.

### Task 2: Add building lighting and wayfinding geometry

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: building id, dimensions, kind, `mats`, and the existing `BLDG__<id>` root.
- Produces: `create_building_lighting_and_wayfinding(...)` with `LIGHT__<id>__*` and `WAYFINDING__<id>__*` objects carrying `lightRole` and `layerRole` extras.

- [ ] Write a failing Blender integration test requiring two entry fixtures and one wayfinding panel for every building, plus cool task lighting at production and warehouse loading faces.
- [ ] Verify the test fails against the current official Blender asset.
- [ ] Add warm, cool, and amber emissive materials with restrained source emission.
- [ ] Create shielded wall sconces, door washes, function-colored identity panels, and selected dock/task luminaires under each building root.
- [ ] Generate a temporary candidate and verify all new geometry, parents, roles, and material emission parameters.

### Task 3: Visual QA and official asset promotion

**Files:**
- Update: `assets/blender/factory-campus-graybox.blend`
- Update: `public/models/factory-campus-graybox.glb`

- [ ] Run all Blender contract tests against the temporary candidate and confirm the GLB budget.
- [ ] Render a dusk overview and close industrial-building views to check hierarchy, glare, clipping, and sign legibility.
- [ ] Promote the verified candidate to the official editable Blender and Web GLB assets.
- [ ] Check day and evening Web modes, management-building explosion, and console logs in the local app.

### Task 4: Documentation and final verification

**Files:**
- Modify: `README.md`

- [ ] Document the role-based lighting and wayfinding system, including GLB extras and day/evening behavior.
- [ ] Run `npm test`, `npm run build`, the complete Blender contract suite against official assets, `git diff --check`, and GLB size verification.
- [ ] Confirm the existing Vite server remains available on port 5180 and no Blender process remains.
