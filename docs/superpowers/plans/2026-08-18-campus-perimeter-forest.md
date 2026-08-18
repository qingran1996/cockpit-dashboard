# Campus Perimeter Forest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all perimeter planting read as a complete industrial-campus landscape from the Web overview and orbit views without blocking the gate or changing the approved building layout.

**Architecture:** Keep the existing four-sided near tree row as the controlled campus edge. Replace the one-sided drifting background forest with a symmetric U-shaped rear-and-side forest over a continuous terrain apron, using linked Blender mesh instances for repeated trees. Pull the Web overview camera back into the unobstructed center of the dashboard while preserving floor inspection poses.

**Tech Stack:** Blender 5.2 Python API, glTF/GLB, Three.js, Node.js test runner, Vite

## Global Constraints

- Preserve every building position, road centerline, parking bay, vehicle motion path, and floor hierarchy.
- Keep the front boulevard and gate vehicle/sightline corridor open.
- Use deterministic geometry and shared materials with no external texture dependencies.
- Keep the running Web preview on port 5180.
- Keep the initial camera distance below the OrbitControls maximum distance.

---

### Task 1: Lock the perimeter landscape contract

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tests/sceneMath.test.js`

**Interfaces:**
- Consumes: generated Blender objects under `ENV__background` and `initialCameraView`
- Produces: regression assertions for a symmetric U-shaped forest, terrain apron, gate clearance, linked tree meshes, and dashboard-safe overview distance

- [x] **Step 1: Extend the wide-campus Blender inspection result with forest tree bounds, rear/side counts, unique mesh counts, and apron dimensions**
- [x] **Step 2: Assert forest X bounds stay within `[-37, 37]`, both side bands contain trees, the rear band remains dense, and forest crowns share a small set of meshes**
- [x] **Step 3: Assert `ENV__landscape-apron` extends beyond the 58×42 campus and the gate-blocking tree list remains empty**
- [x] **Step 4: Extend the Web camera test to require an overview distance of at least 63 units while remaining below `cameraLimits.maxDistance`**
- [x] **Step 5: Run the focused Blender and Web tests and confirm both fail for the missing landscape contract and tight overview camera**

### Task 2: Build the U-shaped industrial forest and terrain apron

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: `create_environment(mats, campus)`, Blender object-copy APIs, and existing forest materials
- Produces: `ENV__landscape-apron`, symmetric rear forest rows, tapered west/east forest bands, and linked tree prototype instances

- [x] **Step 1: Add a low terrain apron outside the campus ground and retain a darker rear forest-floor strip**
- [x] **Step 2: Center every rear forest row from a fixed width and its spacing instead of using a fixed count with a drifting start point**
- [x] **Step 3: Add two staggered side rows on each side, ending before the front boulevard so the entrance remains open**
- [x] **Step 4: Create three trunk/crown variants and duplicate them with linked mesh data, deterministic scale, rotation, height, and two restrained foliage tones**
- [x] **Step 5: Re-run the focused Blender test and confirm the U-shaped landscape contract passes**

### Task 3: Reframe, regenerate, and visually verify

**Files:**
- Modify: `src/scene/sceneMath.js`
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Consumes: `initialCameraView`, Blender generator, port 5180 preview
- Produces: a wider opening view with complete perimeter planting and synchronized editable/Web assets

- [x] **Step 1: Move the overview camera approximately 10–12% farther from the target and preserve the front-left direction**
- [x] **Step 2: Run the focused Web camera test and confirm it passes**
- [x] **Step 3: Regenerate the tracked `.blend` and `.glb` assets**
- [x] **Step 4: Run the complete Blender suite, `npm test`, `npm run build`, and `git diff --check`**
- [x] **Step 5: Inspect overview, both side rotations, gate clearance, floor explosion/interior view, and runtime logs on port 5180**
- [x] **Step 6: Restore the preview to the campus overview**
