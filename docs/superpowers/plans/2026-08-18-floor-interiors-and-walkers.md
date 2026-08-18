# Floor Interiors and Walking Staff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate exploded building floors with use-specific industrial interior props and low-poly staff who walk along short floor-local routes in the Web scene.

**Architecture:** Blender remains the source of truth for floor ownership, interior geometry, person meshes, and motion metadata. Every interior group is nested beneath its existing `FLOOR__*` node so floor visibility and explosion transforms apply automatically. The Web asset adapter classifies `floor-walk` metadata and a focused animation module performs local-axis ping-pong motion, heading reversal, body bob, and leg swing.

**Tech Stack:** Blender 5.2 Python API, glTF/GLB extras, Three.js, Node.js test runner, Vite.

## Global Constraints

- Preserve the current twelve-building site layout, facade meshes, `BLDG__*` roots, and `FLOOR__*` hierarchy.
- Keep interiors low-poly and visible only with their owning floor.
- Use one walker on each occupied non-roof floor; roof equipment floors receive props but no routine pedestrian.
- Respect reduced-motion mode by returning every walker to its base pose.
- Keep the 5180 development service running.

---

### Task 1: Define the Web walking-person contract

**Files:**
- Create: `tests/personAnimation.test.js`
- Modify: `tests/factoryCampusAsset.test.js`
- Create: `src/scene/personAnimation.js`
- Modify: `src/scene/factoryCampusAsset.js`
- Modify: `src/hooks/useIndustrialScene.js`

**Interfaces:**
- Consumes: GLB root objects with `userData.motionPath === 'floor-walk'`, numeric `motionDistance`, `motionSpeed`, and `motionPhase`.
- Produces: `updatePersonAnimations(animatedItems, seconds, reducedMotion)` and prepared animation items with `kind: 'person'`, `baseX`, `baseY`, `baseRotationY`, `distance`, `speed`, `phase`, `leftLeg`, and `rightLeg`.

- [x] **Step 1: Write failing asset-adapter and motion tests**

Add a real Three.js walker group to the campus fixture and assert that preparation returns a person animation item. Assert literal local positions and headings at quarter-cycle, return-cycle, and reduced-motion states.

- [x] **Step 2: Run the focused tests and verify red**

Run: `node --test tests/factoryCampusAsset.test.js tests/personAnimation.test.js`

Expected: FAIL because `personAnimation.js` and person classification do not exist.

- [x] **Step 3: Implement person classification and animation**

Classify `floor-walk` separately from vehicle paths, cache the base pose and named leg meshes, and call `updatePersonAnimations` once per render frame after floor animation updates.

- [x] **Step 4: Run the focused tests and verify green**

Run: `node --test tests/factoryCampusAsset.test.js tests/personAnimation.test.js`

Expected: PASS.

### Task 2: Generate use-specific floor interiors and staff

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: `BUILDING_FLOORS`, floor dimensions, usage text, and existing floor roots.
- Produces: `INTERIOR__<building>__<floor>` groups, typed `PROP__*` meshes, and `WALKER__<building>__<floor>__01` roots with GLB extras.

- [x] **Step 1: Write a failing generated-scene contract test**

Generate and inspect a real `.blend`. Require an interior group and at least two prop meshes for every floor, one walker for every non-`RF` floor, no walkers on `RF`, correct floor ancestry, and safety-workwear materials.

- [x] **Step 2: Run the focused Blender test and verify red**

Run: `node --test --test-name-pattern="floor interiors and walking staff" tools/blender/create_factory_campus_graybox.test.js`

Expected: FAIL because no `INTERIOR__*`, `PROP__*`, or `WALKER__*` objects exist.

- [x] **Step 3: Implement compact prop families and low-poly staff**

Generate equipment skids and control desks for production floors, racks and pallets for storage floors, desks and meeting tables for administration, benches for laboratories, HVAC units for roof floors, and checkpoint furniture for the gatehouse. Build each walker from a body, head, hardhat, reflective vest, arms, and independently named legs.

- [x] **Step 4: Run the focused Blender test and verify green**

Run the same focused test and expect PASS.

### Task 3: Regenerate assets and verify the complete experience

**Files:**
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Consumes: updated Blender generator and Web animation adapter.
- Produces: editable `.blend`, browser `.glb`, and a verified exploded-floor experience on port 5180.

- [x] **Step 1: Regenerate tracked assets**

Run Blender with the tracked blend and GLB output paths and require exit code 0.

- [x] **Step 2: Run complete automated verification**

Run the complete Blender suite serially, `npm test`, and `npm run build`.

- [x] **Step 3: Perform browser visual and interaction QA**

Reload port 5180, explode the main production hall and administration building, confirm interiors remain attached to floors, observe a walker changing position, verify reset/reduced visual clutter, and check the browser error log.
