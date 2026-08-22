# Campus Close Range Storytelling Phase Five Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the factory campus at medium and close viewing distances with believable sports mesh, layered planting, street furniture, and operational activity while preserving the approved plan and Web interactions.

**Architecture:** Extend the deterministic Blender generator with reusable low-poly detail builders. Existing sports fence panels remain as transparent backing for reliable GLB rendering, while constructed wire members provide visual porosity; a separate `SITE__operational-story` root owns street furniture and activity props so they can be audited independently without changing buildings, routes, or the phase-four surface-art hierarchy.

**Tech Stack:** Blender Python (`bpy`), embedded Principled BSDF materials, Node.js model-contract tests, glTF/GLB, React/Three.js.

## Global Constraints

- Do not use `img2threejs`.
- Preserve all approved building transforms, roads, sports-court transforms, gate motion, floor explosion, focus mode, and vehicle routes.
- Keep the existing sports gates usable and visibly open.
- Use embedded materials and low-poly procedural geometry only; do not add runtime texture requests.
- Keep `public/models/factory-campus-graybox.glb` at or below 20 MiB.
- New props must not overlap building shells, sports playing surfaces, primary vehicle routes, or the gate travel lane.
- Run only one Blender process at a time.

---

### Task 1: Close-Range Storytelling Contract

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`

**Interfaces:**
- Consumes: the generated `.blend` fixture and existing court/building/route objects.
- Produces: a real-scene contract for porous sports fencing, vegetation layers, street furniture, gate equipment, and loading activity.

- [ ] **Step 1: Write the failing Blender inspection test**

Add `campus close-range storytelling exports porous sports mesh and operational props`. Inspect the generated `.blend` and assert that both court fence panels use a transparent material, at least 48 constructed sports-wire objects exist under the two court roots, both gates remain interactive, `SITE__operational-story` exists, at least four benches, four litter bins, three wayfinding pylons, eight safety cones, twelve understory plants, and three additional operational walkers exist, and every new mesh exposes a `layerRole`.

- [ ] **Step 2: Add clearance assertions**

Calculate real world bounds for new operational-story meshes against building shells and court surfaces. Assert zero collisions, assert gate equipment stays outside a `1.3` metre half-width vehicle corridor around `x=28.8`, and assert all ground-mounted props touch the site within a `0.20` metre tolerance.

- [ ] **Step 3: Run the focused contract and verify red**

Run: `BLENDER_TEST_BLEND=assets/blender/factory-campus-graybox.blend BLENDER_TEST_GLB=public/models/factory-campus-graybox.glb node --test --test-concurrency=1 --test-name-pattern="campus close-range storytelling" tools/blender/create_factory_campus_graybox.test.js`

Expected: FAIL because the new parent group, wire families, and operational props do not yet exist.

### Task 2: Blender Sports, Planting, and Operations Pass

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Test: `tools/blender/create_factory_campus_graybox.test.js`

**Interfaces:**
- Consumes: `box`, `cylinder`, `create_site_patrol_walker`, `mats`, approved court roots, and final post-expansion world transforms.
- Produces: `create_sports_wire_panel(...)`, `create_street_bench(...)`, and `create_campus_operational_story(mats, campus)` plus `SPORTS_DETAIL__*`, `STREET_FURNITURE__*`, `VEGETATION_DETAIL__*`, and `OPERATION_DETAIL__*` object families.

- [ ] **Step 1: Construct porous sports fencing**

Change `MAT__sports-fence` to a dark-green transparent backing material with alpha no greater than `0.18`. For every basketball and tennis fence run, create deterministic vertical and horizontal wire members with a shared dark metal material; add the same wire language to both pedestrian gate leaves without changing their pivots or animation metadata.

- [ ] **Step 2: Build reusable street furniture**

Implement a low-poly bench with timber slats and metal legs, a paired litter/recycling bin, and a directional pylon with a dark frame and amber identity bars. Place four bench/bin clusters and three pylons beside approved pedestrian areas, outside road and building bounds.

- [ ] **Step 3: Add layered planting**

Create twelve deterministic understory clusters using linked low-poly crown meshes and two planting materials. Position them at selected landscape edges and administration/sports pedestrian zones while preserving the gate sightline and all existing tree-clearance contracts.

- [ ] **Step 4: Add operational narrative**

Add an entry intercom/camera mast outside the gate lane, eight safety cones split between the gate edge and warehouse aprons, loading cages and hand trucks at both warehouses, and three low-poly walkers with `site-patrol` motion metadata on pedestrian-only paths.

- [ ] **Step 5: Run the focused contract and verify green**

Run the focused contract against a newly generated Blender asset. Expected: PASS with zero protected-area collisions.

- [ ] **Step 6: Run all Blender contracts**

Run: `node --test --test-concurrency=1 tools/blender/create_factory_campus_graybox.test.js`

Expected: all contracts pass from one generated fixture.

### Task 3: Export, Documentation, and Visual QA

**Files:**
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`
- Modify: `README.md`

**Interfaces:**
- Consumes: the passing deterministic generator.
- Produces: editable phase-five Blender source, production GLB, documentation, and verified Web appearance.

- [ ] **Step 1: Generate production assets**

Run the generator once in Blender background mode, writing the official `.blend` and `.glb` outputs.

- [ ] **Step 2: Document phase five**

Add a README paragraph covering porous sports fencing, street furniture, layered understory planting, gate equipment, and operational props, and explain that their geometry is authored in Blender and exported in the GLB.

- [ ] **Step 3: Run delivery verification**

Run `npm test`, `npm run build`, all Blender contracts against the official assets, the 20 MiB file-size assertion, `git diff --check`, and a Blender-process check.

- [ ] **Step 4: Perform Web visual QA**

Inspect daylight campus-focus and closer sports/entry views at `http://localhost:5180/`. Verify fences read as porous rather than opaque walls, props are visible without cluttering roads, planting adds depth without hiding the gate, and no new mesh visibly floats or intersects buildings, courts, or vehicles.

- [ ] **Step 5: Recommend phase six**

Identify the largest remaining visual gap after phase five and propose one bounded next-stage objective without implementing it.
