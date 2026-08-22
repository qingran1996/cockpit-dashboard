# Four-Sided Building Envelopes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the remaining blank rear and right-side building shells with complete four-sided industrial envelopes while preserving the approved campus layout and Web interactions.

**Architecture:** Extend the existing Blender generator's reusable wall-cladding and constructed-envelope functions so every `BLDG__*` root receives front, rear, left, and right facade layers. Keep use-specific facade equipment separate, add restrained service details to secondary elevations, and slightly darken the base wall palette so distant faces retain relief under the existing Web lighting.

**Tech Stack:** Blender Python (`bpy`), glTF 2.0/GLB, Node.js test runner, Three.js/Vite Web viewer.

## Global Constraints

- Do not change any building position, footprint, height, floor hierarchy, road, route, or interaction node.
- Preserve all existing `BLDG__*`, `FLOOR__*`, traffic, gate, and campus-focus contracts.
- Keep the exported GLB at or below 20 MiB (`20,971,520` bytes).
- Continue in the existing linked worktree on `codex/main-based-20260817`.
- Do not commit or push automatically because accumulated user-approved work is still uncommitted in overlapping files.

---

### Task 1: Four-sided cladding contract

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Test: `tools/blender/create_factory_campus_graybox.test.js`

**Interfaces:**
- Consumes: generated Blender scene at `BLENDER_TEST_BLEND`.
- Produces: a contract requiring front, rear, left, and right wall panels, joints, skirts, battens, and corner trims for every building.

- [ ] **Step 1: Write the failing Blender integration test**

Add `every building exports a complete four-sided constructed envelope`. For each literal building ID, collect `CLADDING__<id>__<face>-panel-*`, `<face>-shadow-joint-*`, `wall-skirt-<face>`, `pressed-batten-<face>-*`, and all four corner trims. Assert every face has at least two panels, every multi-panel face has joints, and all roots remain parented to their original `BLDG__<id>`.

- [ ] **Step 2: Run the test against the current official asset and verify RED**

Run:

```bash
BLENDER_TEST_BLEND=assets/blender/factory-campus-graybox.blend \
BLENDER_TEST_GLB=public/models/factory-campus-graybox.glb \
node --test --test-concurrency=1 --test-name-pattern='complete four-sided constructed envelope' tools/blender/create_factory_campus_graybox.test.js
```

Expected: FAIL because rear panels and right-side panels do not exist.

---

### Task 2: Complete secondary elevations

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py:990-1200`
- Test: `tools/blender/create_factory_campus_graybox.test.js`

**Interfaces:**
- Consumes: `create_wall_cladding(building_id, width, depth, height, mats, root)` and `create_constructed_envelope(...)`.
- Produces: four-face cladding nodes under each existing building root, plus restrained rear service doors, side louvers, gutters, and downpipes.

- [ ] **Step 1: Generalize cladding generation to all four faces**

Use a face table with literal names `front`, `rear`, `left`, and `right`. Generate panels and shadow joints with outward offsets, two pressed battens per face, one plinth skirt per face, and four corner trims. Reuse the existing materials and naming conventions; do not duplicate the wall shell.

- [ ] **Step 2: Add restrained service details to secondary elevations**

Add one rear service-door assembly to industrial/office buildings, one right-side louver bank to factory/utility buildings, rear and side gutters, and downpipes distributed across front/rear faces. Keep loading-dock-specific details owned by `create_specialized_building_facade`.

- [ ] **Step 3: Reduce the flat-white appearance without changing Web lighting**

Lower `MAT__wall`, `MAT__wall-panel-light`, and `MAT__admin-stone` base values slightly and increase light/mid panel separation. Preserve roughness and metallic values unless a render proves highlights are still clipping.

- [ ] **Step 4: Generate temporary `.blend` and `.glb` assets**

Run Blender in background with outputs in a fresh `/tmp/factory-four-sided.*` directory.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run the Task 1 command against the temporary assets. Expected: PASS.

---

### Task 3: Visual and integration verification

**Files:**
- Modify: `README.md`
- Replace: `assets/blender/factory-campus-graybox.blend`
- Replace: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Consumes: verified Blender generator.
- Produces: official editable Blender source, Web GLB, documentation, and QA evidence.

- [ ] **Step 1: Render front-left and rear-right temporary QA views**

Confirm panel rhythm, corners, doors, louvers, and drainage read from both sides and do not intersect roads or adjacent buildings.

- [ ] **Step 2: Regenerate official assets**

Export to `assets/blender/factory-campus-graybox.blend` and `public/models/factory-campus-graybox.glb`.

- [ ] **Step 3: Run full verification**

Run the complete Blender contract suite, `npm test`, `npm run build`, `git diff --check`, and the 20 MiB GLB size check.

- [ ] **Step 4: Verify the Web viewer**

Load `http://localhost:5180/`, inspect the normal and campus-focus states, rotate to a rear/right view, and confirm no console warnings or errors.

- [ ] **Step 5: Update documentation**

Document the complete four-sided facade system and secondary-elevation service details in `README.md`.
