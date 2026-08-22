# Campus Building Access Network Implementation Plan

> **For Codex:** Execute this plan with the executing-plans workflow and verify each checkpoint before continuing.

**Goal:** Connect every campus building to the internal road grid with a legible last-mile vehicle or service route, then add a restrained layer of road-safety and fire-service detail.

**Architecture:** Keep the seven existing internal road segments and all building locations unchanged. Generate a new `SITE__building-access-network` after plan expansion so its dimensions and coordinates are authored directly in final world space. Each building receives a named asphalt spur and reinforced concrete threshold/apron, with metadata linking both parts to its `buildingId` and target road. High-use junctions receive crosswalks, markings, curbs, and hydrants without changing Web interaction contracts.

**Tech Stack:** Blender 5.2 Python API, procedural mesh generation, Node.js `node:test`, GLB export.

---

### Task 1: Lock the access-network contract with a failing test

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`

1. Inspect the generated `.blend` and collect all `ACCESS__<building-id>__spur` and `ACCESS__<building-id>__apron` nodes.
2. Assert one pair exists for every registered building and carries `buildingId`, `targetRoad`, and `layerRole` metadata.
3. Assert each spur touches its apron and its declared road in XY, while no spur intersects an unrelated building shell.
4. Assert the infrastructure layer includes hydrants, priority crosswalks, junction markings, and an access-network root.
5. Run the focused test against the current official asset and confirm it fails because the access nodes do not yet exist.

### Task 2: Generate the building access network

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`

1. Add declarative access specifications for all 12 buildings, choosing a target road and attachment side from the audited geometry.
2. Add helpers that calculate the gap between a building shell and its target road in final world coordinates.
3. Create asphalt spurs that stop at the building edge, concrete thresholds/aprons, side curbs where length permits, and restrained center/edge markings.
4. Add priority pedestrian crossings at administration, laboratory, gatehouse, and warehouse routes.
5. Add six fire hydrants and safety bollards along major industrial access points.
6. Call the access generator after `expand_campus_plan` so road widths are not distorted by site scaling.

### Task 3: Regenerate and visually review

**Files:**
- Update: `assets/blender/factory-campus-graybox.blend`
- Update: `public/models/factory-campus-graybox.glb`

1. Generate a temporary Blender/GLB fixture and run the focused contract test.
2. Render top and oblique previews from the fixture.
3. Inspect for building, sports-court, tree, parking, and pipe-rack collisions; adjust route anchors where necessary.
4. Regenerate the official `.blend` and `.glb` only after the fixture passes.

### Task 4: Verify the project

**Files:**
- Verify only

1. Run the complete Blender model suite against the official model.
2. Run the full project test suite.
3. Run the production Web build.
4. Confirm the running Web service on port 5180 serves the updated branch.
