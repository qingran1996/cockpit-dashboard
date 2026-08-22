# Building Road Clearance and Parking Canopy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove building footprints from internal roads and enlarge the parking canopy without enlarging the parking lot into adjacent circulation.

**Architecture:** Keep the approved road network and overall campus composition. Move only the two confirmed conflicting building roots, then enlarge the parking roof within the existing parking surface and redistribute its solar panels and posts to cover both parking rows.

**Tech Stack:** Blender 5.2 Python generator, Node.js test runner, glTF/GLB export, Vite.

## Global Constraints

- Preserve the expanded campus, building hierarchy, sports-court relocation, and Web floor explosion behavior.
- Building wall shells must have no two-dimensional AABB overlap with `ROAD__segment-*` meshes.
- The enlarged canopy must stay within `PARKING__surface` and cover both parking rows.

---

### Task 1: Protect internal roads from building footprints

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: generated `*__wall-shell` and `ROAD__segment-*` Blender objects.
- Produces: an empty `buildingRoadCollisions` inspection result.

- [ ] **Step 1: Write a failing generated-scene collision assertion**
- [ ] **Step 2: Run it and confirm the existing laboratory/main-hall overlaps fail**
- [ ] **Step 3: Move only `main-production-hall` and `laboratory` enough to provide road clearance**
- [ ] **Step 4: Regenerate and confirm the collision assertion passes**

### Task 2: Expand the parking canopy over both rows

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: `PARKING__surface` footprint.
- Produces: enlarged `PARKING__canopy-roof`, two post rows, and four solar-panel rows.

- [ ] **Step 1: Add failing assertions for roof size, containment, post count, and panel count**
- [ ] **Step 2: Enlarge the roof inside the current parking surface**
- [ ] **Step 3: Redistribute posts and panels across both parking rows**
- [ ] **Step 4: Regenerate the official `.blend` and `.glb` assets**

### Task 3: Verify visual and Web output

**Files:**
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Consumes: updated Blender generator output.
- Produces: browser-ready campus GLB with clear internal roads and enlarged parking shelter.

- [ ] **Step 1: Render oblique and top-down previews**
- [ ] **Step 2: Run generated-model contract tests and the full project test suite**
- [ ] **Step 3: Run the Vite production build and verify the 5180 GLB response**
