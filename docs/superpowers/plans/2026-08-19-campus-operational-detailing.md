# Campus Operational Detailing Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Increase the factory campus's operational realism with maintainable roof systems, exterior safety services, active warehouse loading details, and animated workers/vehicles while preserving the approved site layout and Web interactions.

**Architecture:** Extend the procedural Blender generator with one self-contained operational-detail layer attached to existing building and site roots. Export semantic node names and motion metadata through GLB extras, then reuse the Web asset preparation and animation paths so the additions remain inspectable and efficient.

**Tech Stack:** Blender Python (`bpy`), GLB/glTF extras, Three.js, Node test runner, Vite.

---

### Task 1: Lock the new model contract

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`

**Step 1: Write failing integration tests**

Add real generated-scene assertions for named roof maintenance, fire/electrical service, pallet, forklift, and loading-worker nodes. Assert parent building/zone relationships, non-zero dimensions, semantic roles, and valid movement metadata.

**Step 2: Run the focused tests and confirm RED**

Run the Blender test suite against the current official asset and confirm the new tests fail specifically because the operational nodes do not exist.

### Task 2: Build maintainable roofs and exterior services

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Step 1: Add reusable detail builders**

Create compact helpers for rooftop HVAC units, ducts, maintenance walkways/guardrails, access ladders, fire cabinets, electrical panels, service lights, and pipe penetrations.

**Step 2: Apply them to key industrial buildings**

Populate the main production hall, central processing hall, east process hall, warehouse pair, and far-east utility building. Keep all details parented to the matching `BLDG__*` root so floor explosion/focus behavior remains intact.

**Step 3: Run focused contract tests and confirm GREEN**

Generate a temporary `.blend` and `.glb`; verify semantic nodes, parentage, dimensions, and the 20 MiB budget.

### Task 3: Add warehouse loading activity

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Modify: `src/scene/factoryCampusAsset.js`
- Modify: `src/scene/vehicleAnimation.js`
- Modify: `tests/factoryCampusAsset.test.js`
- Modify: `tests/vehicleAnimation.test.js`

**Step 1: Write failing Web animation tests**

Assert that a GLB forklift carrying `yard-shuttle` metadata is collected as an animated vehicle and travels nose-first along its declared local axis while honoring reduced-motion and traffic pause states.

**Step 2: Implement the movement contract**

Generalize simple vehicle animation to support `motionAxis` and ping-pong yard travel without altering the existing gate shuttle or campus routes.

**Step 3: Model loading scenes**

Add forklift roots, pallet stacks, dock safety equipment, and loading crew nodes at both principal warehouses. Keep routes fully inside loading aprons and away from campus roads.

### Task 4: Verify, export, and document

**Files:**
- Modify: `README.md`
- Update: `assets/blender/factory-campus-graybox.blend`
- Update: `public/models/factory-campus-graybox.glb`

**Step 1: Run temporary-asset validation**

Run Blender model tests, project unit tests, production build, GLB size checks, and scene collision checks.

**Step 2: Perform visual QA**

Inspect overview and close operational views in Blender/Web, including campus-only mode and active traffic. Correct obvious clipping, sideways motion, scale, or material issues.

**Step 3: Export official assets and update documentation**

Replace the official `.blend`/`.glb` only after temporary validation passes. Document the operational-detail layer and animation semantics in the README.

**Constraints:**

- Preserve every approved building position, footprint, access road, sports court, parking area, and gate.
- Preserve `BLDG__*` identifiers, floor explosion, floor interior focus, campus focus mode, gate traffic, and route traffic.
- Keep the exported GLB at or below 20 MiB.
- Do not place detail meshes on drivable road surfaces or through existing buildings/trees.
- Do not commit, merge, or push during implementation; the shared worktree already contains user-approved uncommitted work.
