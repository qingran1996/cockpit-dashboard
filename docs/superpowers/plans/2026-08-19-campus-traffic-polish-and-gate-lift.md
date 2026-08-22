# Campus Traffic Polish and Gate Lift Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make campus vehicles turn progressively and make the inbound boom barrier lift upward, stop the shuttle for recognition, and close only after the shuttle clears.

**Architecture:** Blender remains the source of truth for the barrier's positive upward open angle. The existing shared gate traffic sampler continues to synchronize the shuttle and barrier. Route position remains on the audited collision-free polyline; a look-ahead/look-behind tangent blends heading across corners without moving the vehicle off the road centerline.

**Tech Stack:** Blender 5.2 Python API, glTF extras, Three.js 0.165, Node.js `node:test`, Vite 5.

## Global Constraints

- Do not use `img2threejs`.
- Keep the approved building, road, parking, sports, tree, and route geometry unchanged.
- Keep route vehicle positions on their current collision-audited polylines.
- Preserve the existing recognition, waiting, crossing, and clear-to-close gate timing.
- Do not add npm dependencies.
- Regenerate both the official `.blend` and `.glb` after changing Blender metadata.
- Keep Blender GUI closed; generation and model checks run in background mode.

---

### Task 1: Correct the boom barrier lift direction at the source

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tests/factoryCampusAsset.test.js`
- Modify: `tests/gateAnimation.test.js`

**Interfaces:**
- Consumes: `GATE__barrier-inbound` glTF extras and `updateGateAnimations(animatedItems, seconds, reducedMotion)`.
- Produces: `closedAngle=0` and `openAngle=1.22` around Three.js local Z, which moves the arm's local positive X tip into positive world Y.

- [ ] **Step 1: Write failing behavior and model-contract tests**

Change the gate animation fixture to `openAngle: 1.22`, update at full-open time, transform the arm-tip vector, and assert it is above the hinge:

```js
const tip = new THREE.Vector3(1.21, 0, 0).applyEuler(barrier.rotation)
assert.ok(tip.y > 1, `barrier tip must lift upward, received y=${tip.y}`)
```

Change the Blender contract expectation and asset fixture expectation to positive `1.22`.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
node --test tests/gateAnimation.test.js tests/factoryCampusAsset.test.js
BLENDER_TEST_BLEND=assets/blender/factory-campus-graybox.blend BLENDER_TEST_GLB=public/models/factory-campus-graybox.glb node --test --test-concurrency=1 --test-name-pattern='floors contain' tools/blender/create_factory_campus_graybox.test.js
```

Expected: Web behavior fails because the fixture still rotates downward, and the official Blender source/model contract reports `openAngle=-1.22`.

- [ ] **Step 3: Correct Blender metadata**

Set:

```python
inbound_barrier["openAngle"] = 1.22
```

Do not invert `barrierOpen`; it remains the normalized `0..1` lift amount.

- [ ] **Step 4: Run focused Web tests and verify GREEN**

Run: `node --test tests/gateAnimation.test.js tests/factoryCampusAsset.test.js`

Expected: PASS; the arm tip has positive Y at full open and returns to horizontal after clearance.

---

### Task 2: Blend route heading through corners without leaving the road

**Files:**
- Modify: `src/scene/campusRouteAnimation.js`
- Modify: `src/scene/vehicleAnimation.js`
- Modify: `tests/campusRouteAnimation.test.js`
- Modify: `tests/vehicleAnimation.test.js`

**Interfaces:**
- Consumes: `samplePolyline(points, progress)` and normalized route progress.
- Produces: `samplePolylineHeading(points, progress, lookDistance=1.2)` returning a normalized Three.js tangent based on physical-distance samples before and after the current point.

- [ ] **Step 1: Write the failing corner-heading test**

For `[(0,0,0), (4,0,0), (4,0,4)]`, assert the heading at the corner has positive X and positive Z components near `0.71`, while positions before, at, and after the corner stay on the original polyline.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/campusRouteAnimation.test.js`

Expected: FAIL because `samplePolylineHeading` does not exist.

- [ ] **Step 3: Implement distance-window heading sampling**

Build one polyline metrics helper, sample positions at `distance-lookDistance` and `distance+lookDistance`, subtract them, and fall back to the segment tangent at route endpoints. Do not change the position returned by `samplePolyline`.

- [ ] **Step 4: Use the blended heading for route vehicles**

In `updateVehicleAnimations`, retain `sample.position`, obtain the blended tangent at `cycle.progress`, negate it on a ping-pong return, and continue aligning the vehicle's local `-X` nose with:

```js
item.object.rotation.y = Math.atan2(tangent.z, -tangent.x)
```

- [ ] **Step 5: Run route and vehicle tests and verify GREEN**

Run: `node --test tests/campusRouteAnimation.test.js tests/vehicleAnimation.test.js`

Expected: PASS for distance sampling, blended corner heading, nose-first travel, return direction, and paused reset.

---

### Task 3: Regenerate official assets and verify the integrated scene

**Files:**
- Regenerate: `assets/blender/factory-campus-graybox.blend`
- Regenerate: `public/models/factory-campus-graybox.glb`
- Modify: `README.md`

**Interfaces:**
- Consumes: the corrected Blender generator and Web animation modules.
- Produces: official Blender/GLB assets with an upward-lifting inbound barrier and documented traffic behavior.

- [ ] **Step 1: Regenerate official assets in Blender background mode**

Run:

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --python tools/blender/create_factory_campus_graybox.py -- --blend-output assets/blender/factory-campus-graybox.blend --glb-output public/models/factory-campus-graybox.glb
```

- [ ] **Step 2: Verify the generated model contract**

Run the Blender contract suite serially against the official assets. Expected: 11 tests pass, including positive `openAngle=1.22`, routes, buildings, interiors, access roads, and collision checks.

- [ ] **Step 3: Document the behavior**

In `README.md`, state that the inbound boom lifts upward after recognition, the shuttle waits for clearance, and operational route vehicles blend heading through corners while remaining on audited road polylines.

- [ ] **Step 4: Run final verification**

Run:

```bash
npm test
npm run build
```

Use the running `http://localhost:5180/` page to confirm the traffic control is live, the barrier opens upward, route vehicles do not snap sideways at corners, and the browser console has no warnings or errors.
