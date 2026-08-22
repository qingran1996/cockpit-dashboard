# Ground Road Landscape Art Phase Four Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the approved factory-campus ground plane, roads, parking areas, and planted edges read as a coherent semi-realistic industrial site in Blender and the exported Web GLB.

**Architecture:** Extend the deterministic Blender generator with one focused site-surface detailing pass that layers thin, low-poly construction and wear geometry over existing road and landscape meshes. Keep the approved building transforms, road centerlines, vehicle paths, sports courts, and Web interaction contracts unchanged; validate the result by inspecting the generated `.blend`, then export the same scene to the production `.blend` and `.glb` assets.

**Tech Stack:** Blender Python (`bpy`), embedded Principled BSDF materials, Node.js test runner, glTF/GLB, React/Three.js asset loader.

## Global Constraints

- Do not use `img2threejs`.
- Preserve all approved building locations, campus layout, vehicle routes, gate motion, floor explosion, and focus-mode behavior.
- Use procedural low-poly geometry and embedded materials only; do not add external texture files.
- Keep `public/models/factory-campus-graybox.glb` at or below 20 MiB.
- Keep road wear subtle and directional; it must not read as random floating decals.
- Keep every new landscape and hardscape detail outside building shells, sports surfaces, primary road travel lanes, and the gate clearance corridor.
- Run only one Blender process at a time.

---

### Task 1: Site-Surface Contract

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`

**Interfaces:**
- Consumes: generated Blender fixture from `getGeneratedFixture()`.
- Produces: a real-scene contract covering asphalt hierarchy, road wear, manholes, paving joints, parking identity, landscape edging, and collision clearance.

- [ ] **Step 1: Write the failing test**

Add a Blender inspection test named `ground roads and landscape export layered semi-realistic site art` that reads actual objects and materials from the generated `.blend`. Assert at least 12 asphalt patch/wear meshes, at least 6 paving-joint meshes, at least 4 utility covers, at least 10 parking bay identifiers, at least 8 planted-edge or mulch meshes, required material roughness values, correct parent groups, a nonzero material palette variation, and zero overlap with building shells, sports surfaces, and the gate travel corridor.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-concurrency=1 --test-name-pattern="ground roads and landscape" tools/blender/create_factory_campus_graybox.test.js`

Expected: FAIL because the named detailing objects and materials do not yet exist.

- [ ] **Step 3: Confirm the failure catches the intended production break**

The test must fail if the site-detail creation call is removed, if asphalt variation is collapsed back to the base asphalt material, if parking identifiers are absent, or if new landscape objects intrude into protected hardscape.

### Task 2: Blender Ground, Road, and Landscape Art Pass

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Test: `tools/blender/create_factory_campus_graybox.test.js`

**Interfaces:**
- Consumes: existing `mats`, `campus`, `SITE__ground-and-roads`, `SITE__landscape`, and approved site transforms after `expand_campus_plan()`.
- Produces: `create_ground_road_landscape_art(mats, campus)` and exported object families `SURFACE_ART__*`, `PAVING_DETAIL__*`, `PARKING_DETAIL__*`, and `LANDSCAPE_ART__*`.

- [ ] **Step 1: Add embedded materials**

Add matte embedded materials for warm asphalt repair, cool traffic wear, dark utility iron, paving joints, warm aggregate, and planting mulch. Keep asphalt-family roughness between `0.82` and `0.96`, utility metal roughness at least `0.58`, and mulch roughness at least `0.90`.

- [ ] **Step 2: Add subtle road construction and wear**

Create thin repair panels, expansion seams, paired tire-wear strips, and utility covers on representative perimeter and internal-road runs. Use deterministic positions, restrained contrast, bevels no greater than `0.02`, and `layerRole` metadata describing `asphalt-repair`, `traffic-wear`, or `utility-cover`.

- [ ] **Step 3: Add pedestrian paving and drainage continuity**

Create repeated narrow paving joints across the entry plaza and key walkways, add aggregate shoulders or curb-transition blocks at selected pedestrian connections, and preserve tactile strips and existing drains.

- [ ] **Step 4: Add parking and loading-ground identity**

Add ten readable bay identifier plaques, charging/safety markings for selected spaces, and restrained loading-zone wear without moving the parking canopy, wheel stops, parked vehicles, or loading equipment.

- [ ] **Step 5: Add landscape edge depth and variation**

Add mulch/aggregate planting beds and low edge bands around selected internal landscape islands. Vary planting material assignments deterministically while keeping all new meshes clear of road travel lanes, buildings, courts, parking hardscape, and the gate corridor.

- [ ] **Step 6: Run the focused test to verify it passes**

Run: `node --test --test-concurrency=1 --test-name-pattern="ground roads and landscape" tools/blender/create_factory_campus_graybox.test.js`

Expected: PASS.

- [ ] **Step 7: Run the complete Blender contract suite**

Run: `node --test --test-concurrency=1 tools/blender/create_factory_campus_graybox.test.js`

Expected: all Blender model contracts pass with a single generated fixture.

### Task 3: Production Export, Documentation, and Web Verification

**Files:**
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`
- Modify: `README.md`

**Interfaces:**
- Consumes: deterministic generator and passing Blender contract.
- Produces: editable production Blender scene, Web GLB, documented phase-four art direction, and verified Web rendering.

- [ ] **Step 1: Export production assets**

Run Blender in background with `tools/blender/create_factory_campus_graybox.py`, writing to `assets/blender/factory-campus-graybox.blend` and `public/models/factory-campus-graybox.glb`.

- [ ] **Step 2: Document phase four**

Add a concise README section explaining that road wear, paving joints, utility covers, parking identity, and landscape-edge depth are authored in Blender and preserved in the exported GLB, while Web continues to own lighting and interaction.

- [ ] **Step 3: Run repository verification**

Run: `npm test`

Run: `npm run build`

Run: `node --test --test-concurrency=1 tools/blender/create_factory_campus_graybox.test.js`

Run: `test $(stat -f%z public/models/factory-campus-graybox.glb) -le 20971520`

Run: `git diff --check`

Expected: all commands succeed, with the GLB within budget.

- [ ] **Step 4: Perform Web visual QA**

Open `http://localhost:5180/` in the in-app browser. Verify a daylight overview and a closer entry/parking view: road variation must remain subtle, parking and paving must read at useful camera distances, landscape bands must not cover the gate, and no new object may visibly float or intersect a building, court, vehicle route, or road lane.

- [ ] **Step 5: Review the next-stage opportunity**

Evaluate the completed scene as a whole and propose one bounded fifth-stage optimization focused on the highest remaining visual gap, without implementing it in this phase.
