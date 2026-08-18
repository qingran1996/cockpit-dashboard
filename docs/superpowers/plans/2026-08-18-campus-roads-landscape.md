# Campus Roads and Landscape Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sparse internal roads and evenly spaced perimeter greenery with a believable industrial-campus public realm containing constructed road edges, pedestrian routes, drainage infrastructure, and layered planting.

**Architecture:** Keep the approved road centerlines and building layout unchanged. Add GLB-safe road-detail meshes under `SITE__ground-and-roads` and layered vegetation under `SITE__landscape`, using shared materials and low-poly repeated forms so vehicle paths, building picking, and Web performance remain stable.

**Tech Stack:** Blender 5.2 Python API, Node.js test runner, glTF/GLB, Vite/Three.js

## Global Constraints

- Preserve all building positions, road centerlines, parking layout, gate motion path, and initial camera.
- Keep plants outside vehicle lanes and below the building-picking sightline in internal courtyards.
- Use mesh geometry and shared materials only; do not add external texture dependencies.
- Keep the running Web preview on port 5180.
- Retain the existing building explosion, floor navigation, person animation, and vehicle animation behaviors.

---

### Task 1: Lock the internal-site construction contract

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`

**Interfaces:**
- Consumes: the generated `.blend` scene from `create_factory_campus_graybox.py`
- Produces: assertions for road curbs, drainage, crosswalks, directional markings, pedestrian paths, wheel stops, rain gardens, internal trees, shrubs, shared landscape materials, and an unobstructed gate corridor

- [x] **Step 1: Extend the wide-campus composition test with named road and landscape objects**
- [x] **Step 2: Assert repeated object counts, dimensions, parent groups, material roughness, and gate clearance**
- [x] **Step 3: Run `node --test --test-name-pattern="wide front-left" tools/blender/create_factory_campus_graybox.test.js`**
- [x] **Step 4: Confirm the test fails because the internal-site construction nodes are missing**
- [x] **Step 5: Confirm the gate-clearance assertion fails on the four blocking front-row trees before fixing them**

### Task 2: Build constructed internal roads

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: `create_roads_and_site(mats, campus)` and the existing `box` helper
- Produces: `ROAD_DETAIL__*`, `PEDESTRIAN__*`, and `PARKING__wheel-stop-*` meshes parented to `SITE__ground-and-roads`

- [x] **Step 1: Add shared safety-yellow, tactile-paving, and bioswale-edge materials**
- [x] **Step 2: Add segmented concrete curbs along internal roads without changing lane centerlines**
- [x] **Step 3: Add two internal zebra crossings, stop lines, and directional arrow geometry**
- [x] **Step 4: Add pedestrian connectors, drainage channels, and repeated parking wheel stops**

### Task 3: Build layered internal planting

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: `create_landscape(mats, campus)` and shared low-poly mesh helpers
- Produces: `LANDSCAPE__rain-garden-*`, `LANDSCAPE__inner-tree-*`, `LANDSCAPE__shrub-*`, and `LANDSCAPE__tree-grate-*` meshes parented to `SITE__landscape`

- [x] **Step 1: Add three long rain-garden beds beside internal roads**
- [x] **Step 2: Add low ornamental grass groups and deep-green shrub masses within the beds**
- [x] **Step 3: Add twelve varied internal shade trees with concrete tree grates**
- [x] **Step 4: Keep the gate vehicle and sightline corridor clear while retaining trees as entrance framing**
- [x] **Step 5: Re-run the focused composition test and confirm the new contract passes**

### Task 4: Regenerate and verify assets

**Files:**
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Consumes: the updated Blender generator
- Produces: editable `.blend`, Web `.glb`, and browser verification evidence

- [x] **Step 1: Regenerate the tracked Blender and GLB assets**
- [x] **Step 2: Run the complete Blender suite with the existing 300-second per-process budget**
- [x] **Step 3: Run `npm test`, `npm run build`, and `git diff --check`**
- [x] **Step 4: Reload port 5180 and inspect roads, planting density, building visibility, floor navigation, vehicle motion, and runtime logs**
- [x] **Step 5: Restore the preview to the campus overview**
