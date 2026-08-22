# Campus Camera Shimmer Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove camera-motion shimmer from pale factory walls and roofs, stop unsolicited camera rotation, and open the campus in evening mode.

**Architecture:** Keep one physical cladding-joint system in Blender and remove the older overlapping facade-joint pass. Reduce high-frequency architectural PBR height content at its generator, preserve pale colors, and expose a small Web motion/default-mode policy that can be tested without mounting WebGL.

**Tech Stack:** Blender Python, glTF/GLB, Three.js OrbitControls, React, Node test runner.

## Global Constraints

- Preserve the current campus layout, building interactions, floor explosion, routes, and traffic animation.
- Keep pale building envelopes; do not reintroduce black walls.
- Keep `public/models/factory-campus-graybox.glb` below 40 MiB.
- Do not commit, push, merge, or delete the worktree without an explicit user request.

---

### Task 1: Stable Web Camera and Evening Default

**Files:**
- Create: `src/scene/campusViewDefaults.js`
- Create: `tests/campusViewDefaults.test.js`
- Modify: `src/components/IndustrialScene.jsx`
- Modify: `src/hooks/useIndustrialScene.js`

**Interfaces:**
- Produces: `DEFAULT_CAMPUS_LIGHTING_MODE` and `deriveCampusOrbitPolicy({ reducedMotion })`.
- Consumes: React lighting state and Three.js `OrbitControls` configuration.

- [x] **Step 1: Write failing tests for evening default and disabled automatic orbit**
- [x] **Step 2: Run the focused test and verify RED**
- [x] **Step 3: Add the defaults module and apply it to the component and hook**
- [x] **Step 4: Run the focused test and verify GREEN**

### Task 2: Non-Overlapping Facade Construction

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Modify: `tests/generatedModelContract.test.js`

**Interfaces:**
- Produces: one `CLADDING__...shadow-joint` system per facade bay with no legacy `DETAIL__facade-joint` meshes.
- Consumes: existing building cladding generation and GLB export.

- [x] **Step 1: Add a failing Blender audit that rejects legacy duplicate joints**
- [x] **Step 2: Run the focused Blender audit and verify RED**
- [x] **Step 3: Remove only the overlapping legacy joint pass**
- [x] **Step 4: Regenerate temporary assets and verify GREEN**

### Task 3: Low-Alias Architectural PBR

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Produces: bounded `architecturalPbrNormalStrength` metadata and lower-frequency wall/roof height fields.
- Consumes: the existing five architectural PBR families.

- [x] **Step 1: Add a failing audit for bounded wall and roof normal strength**
- [x] **Step 2: Run the focused audit and verify RED**
- [x] **Step 3: Reduce normal strength and high-frequency height components while preserving base-color luminance**
- [x] **Step 4: Regenerate temporary assets and verify GREEN**

### Task 4: Formal Export and Acceptance

**Files:**
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`
- Modify: `README.md`

**Interfaces:**
- Produces: updated formal Blend and GLB assets.
- Consumes: Tasks 1–3.

- [x] **Step 1: Generate formal Blend and GLB assets**
- [x] **Step 2: Run all Node and Blender regressions**
- [x] **Step 3: Run the production build and verify the 40 MiB budget**
- [x] **Step 4: Repeat front, rear, side, overhead, low-angle, and close-wall browser inspection**
- [x] **Step 5: Document the shimmer correction and evening default**
