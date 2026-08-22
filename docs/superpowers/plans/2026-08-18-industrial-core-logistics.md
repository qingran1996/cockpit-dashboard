# Industrial Core and Logistics Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a recognizable process-equipment core, a coherent warehouse logistics flow, and visually distinct warehouse/laboratory/utility facades without changing the approved campus footprint or Web interaction contract.

**Architecture:** Keep `tools/blender/create_factory_campus_graybox.py` as the deterministic source of truth. Add GLB-safe mesh-only equipment and facade helpers parented under stable named roots, extend the generated-model contracts, then regenerate the tracked `.blend` and `.glb` assets. Preserve building roots, floor hierarchy, gate traffic animation, sports courts, and the collision-free landscape.

**Tech Stack:** Blender 5.2 Python API, GLB/glTF, Three.js/Vite, Node.js test runner.

## Global Constraints

- Do not enlarge the campus ground or change the approved camera.
- All new objects must use stable names and existing or explicitly added PBR materials.
- New equipment must remain outside buildings, sports surfaces, parking, entry plaza, major roads, and tree trunks.
- Preserve every existing `BLDG__*`, `FLOOR__*`, gate, vehicle, walker, and sports node contract.
- Keep Web model loading at `/models/factory-campus-graybox.glb`.

---

### Task 1: Generated Model Contracts

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tests/generatedModelContract.test.js`

**Interfaces:**
- Consumes: generated Blender scene and exported GLB.
- Produces: contract checks for `SITE__process-core`, `PROCESS__tank-01`, `PROCESS__cooling-cell-01`, `PROCESS__scrubber-stack`, `PROCESS__substation-transformer-01`, `PROCESS__wastewater-basin`, `LOGISTICS__front-warehouse-apron`, `LOGISTICS__dock-platform-01`, `LOGISTICS__weighbridge`, `VEHICLE__forklift-01`, `LAB__curtain-wall`, and `UTILITY__louver-bank-01`.

- [ ] **Step 1: Add failing Blender-scene assertions**

Extend the generated inspection result with equipment counts and parent/material metadata. Assert at least three tanks, two cooling cells, two transformers, three loading docks, one weighbridge, one forklift, and the three differentiated facade modules.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --test-name-pattern="industrial process core and warehouse logistics" tools/blender/create_factory_campus_graybox.test.js
```

Expected: FAIL because the named nodes do not exist.

- [ ] **Step 3: Add GLB boundary assertions**

Inspect the exported GLB JSON and assert the stable equipment and facade node names survive export.

- [ ] **Step 4: Commit the contract**

```bash
git add tools/blender/create_factory_campus_graybox.test.js tests/generatedModelContract.test.js
git commit -m "test: define industrial core and logistics contract"
```

### Task 2: Process Equipment Core

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: `box`, `cylinder`, `empty`, existing `mats`, and `campus`.
- Produces: `create_process_equipment_core(mats, campus)` with root `SITE__process-core` and stable `PROCESS__*` nodes.

- [ ] **Step 1: Add process-equipment materials**

Add coated tank steel, cooling equipment, transformer, water, and hazard-marking materials to the existing material dictionary.

- [ ] **Step 2: Implement the process core**

Create an equipment pad in the open rear-right service zone, three vertical storage tanks with rings and top rails, two cooling cells, one scrubber stack, a fenced two-transformer substation, and one wastewater basin. Parent all pieces to `SITE__process-core` and assign `layerRole` metadata.

- [ ] **Step 3: Connect the process core**

Add a short pipe-rack header and supports linking the equipment pad to the existing pipe network without crossing a major road at ground level.

- [ ] **Step 4: Run the focused Blender contract**

Run the Task 1 focused test. Expected: process-equipment assertions pass while logistics/facade assertions still fail.

- [ ] **Step 5: Commit the process core**

```bash
git add tools/blender/create_factory_campus_graybox.py
git commit -m "feat: add industrial process equipment core"
```

### Task 3: Warehouse Logistics Flow

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: front-warehouse dimensions/location, existing road and vehicle materials.
- Produces: `create_logistics_yard(mats, campus)` with `SITE__logistics-yard`, `LOGISTICS__*`, `PROP__pallet-stack-*`, and `VEHICLE__forklift-01` nodes.

- [ ] **Step 1: Create the loading apron and dock sequence**

Place one apron parallel to the front warehouse, three dock platforms with rubber bumpers and sectional-door frames, truck staging lines, wheel guides, and a pedestrian safety strip.

- [ ] **Step 2: Add weighbridge and yard props**

Add a recessed weighbridge, control pedestal, pallet stacks, two safety bollard pairs, and one low-poly forklift with recognizable mast and forks.

- [ ] **Step 3: Validate traffic clearance**

Extend the existing collision/layout metrics so logistics meshes do not overlap building shells, sports courts, entry plaza, or major-road traffic lanes.

- [ ] **Step 4: Run the focused Blender contract**

Expected: process and logistics assertions pass while facade assertions still fail.

- [ ] **Step 5: Commit the logistics yard**

```bash
git add tools/blender/create_factory_campus_graybox.py tools/blender/create_factory_campus_graybox.test.js
git commit -m "feat: add warehouse loading and logistics yard"
```

### Task 4: Building-Type Differentiation

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: each building's existing `BLDG__*` root and dimensions.
- Produces: `create_specialized_building_facade(building_id, width, depth, height, mats, root)`.

- [ ] **Step 1: Differentiate the raw-material warehouse**

Add deep loading-door reveals, numbered door headers, a continuous protective plinth, high-level ventilation panels, and a warehouse identity band.

- [ ] **Step 2: Differentiate the laboratory**

Add `LAB__curtain-wall`, vertical fins, a recessed entry frame, rooftop exhaust stacks, and a contrasting parapet band.

- [ ] **Step 3: Differentiate the utility annex**

Add three large louver banks, external cable trays, a service canopy, hazard signage, and a darker equipment plinth.

- [ ] **Step 4: Run the focused contract and full generator tests**

Run:

```bash
node --test --test-name-pattern="industrial process core and warehouse logistics" tools/blender/create_factory_campus_graybox.test.js
node --test tools/blender/create_factory_campus_graybox.test.js
```

Expected: all assertions pass.

- [ ] **Step 5: Commit the facade differentiation**

```bash
git add tools/blender/create_factory_campus_graybox.py tools/blender/create_factory_campus_graybox.test.js
git commit -m "feat: differentiate industrial building facades"
```

### Task 5: Assets and Web Verification

**Files:**
- Regenerate: `assets/blender/factory-campus-graybox.blend`
- Regenerate: `public/models/factory-campus-graybox.glb`
- Verify: `src/scene/factoryCampusAsset.js`

**Interfaces:**
- Consumes: the deterministic generator and updated tests.
- Produces: editable Blender source and Web-ready GLB at the existing URL.

- [ ] **Step 1: Generate the tracked assets**

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python tools/blender/create_factory_campus_graybox.py -- \
  --blend-output assets/blender/factory-campus-graybox.blend \
  --glb-output public/models/factory-campus-graybox.glb
```

- [ ] **Step 2: Verify exported contracts and build**

```bash
node --test tests/generatedModelContract.test.js
npm run build
git diff --check
```

- [ ] **Step 3: Inspect Blender and Web**

Open the generated `.blend`, inspect the fixed oblique camera and process/logistics zones, then load `http://localhost:5180/` and wait for the GLB to replace the procedural fallback.

- [ ] **Step 4: Verify collisions and performance**

Confirm hard equipment/tree/building/road collisions are zero, and compare final object count, triangle count, material count, GLB size, and Web render against the pre-change baseline.

- [ ] **Step 5: Commit generated assets when requested**

```bash
git add assets/blender/factory-campus-graybox.blend public/models/factory-campus-graybox.glb
git commit -m "feat: ship industrial core and logistics GLB"
```
