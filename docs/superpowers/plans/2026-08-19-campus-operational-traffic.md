# Campus Operational Traffic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animate credible internal logistics, maintenance, and fire-patrol vehicles over the new building access roads while preserving the current gate demo, layout, floor interaction, and Web performance.

**Architecture:** Blender remains the source of truth for route geometry: it exports named route roots, ordered waypoint empties, and vehicle-to-route metadata inside the GLB. The Web client parses those nodes into immutable route records, samples piecewise-linear paths with destination dwell times, and updates only registered route vehicles. Existing gate-shuttle, gate-barrier, person, floor, lighting, and focus-mode systems remain independent.

**Tech Stack:** Blender 5.2 Python API, glTF/GLB extras, Three.js 0.165, React 18, Node.js `node:test`, Vite 5.

## Global Constraints

- Preserve the approved building, road, parking, sports-court, pipe-rack, tree, and camera layout.
- Do not use the `img2threejs` skill.
- Do not add npm dependencies; use existing Three.js vector and quaternion APIs.
- Keep all 12 `BLDG__*` node names and current floor metadata unchanged.
- Keep `VEHICLE__gate-shuttle__root` and `GATE__barrier-inbound` on the existing `gate-lane` / `gate-barrier` cycle.
- Route vehicles must stop at their initial route position when traffic demo is disabled or reduced motion is requested.
- New vehicle routes must not intersect building shells, sports surfaces, tree trunks, parking canopy posts, or pipe-rack columns.
- Regenerate both `assets/blender/factory-campus-graybox.blend` and `public/models/factory-campus-graybox.glb` from the procedural generator.
- Keep Blender GUI closed; generation, audit, and rendering run in background mode.

---

### Task 1: Export three operational route graphs from Blender

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`

**Interfaces:**
- Consumes: `create_vehicle(...)`, `SITE__building-access-network`, `ROAD__segment-*`, and final world coordinates after `expand_campus_plan(campus)`.
- Produces: route roots named `ROUTE__<routeId>`, ordered waypoint empties named `WAYPOINT__<routeId>__NN`, and vehicle roots with `motionPath="campus-route"` plus `linkedRoute`, `motionSpeed`, and `motionPhase` extras.

- [ ] **Step 1: Add a failing Blender contract test**

Append a test that opens the generated `.blend` and asserts this exact model contract:

```js
const expected = {
  'warehouse-delivery': { vehicle: 'VEHICLE__delivery-truck__root', waypointCount: 7, loopMode: 'ping-pong' },
  'maintenance-service': { vehicle: 'VEHICLE__maintenance-van__root', waypointCount: 6, loopMode: 'ping-pong' },
  'fire-patrol': { vehicle: 'VEHICLE__fire-patrol__root', waypointCount: 9, loopMode: 'loop' },
}

for (const [routeId, record] of Object.entries(expected)) {
  assert.equal(routes[routeId].root, `ROUTE__${routeId}`)
  assert.equal(routes[routeId].loopMode, record.loopMode)
  assert.equal(routes[routeId].waypoints.length, record.waypointCount)
  assert.deepEqual(routes[routeId].waypoints.map((point) => point.order),
    Array.from({ length: record.waypointCount }, (_, index) => index + 1))
  assert.equal(routes[routeId].vehicle, record.vehicle)
  assert.equal(routes[routeId].motionPath, 'campus-route')
}
assert.deepEqual(collisions, [])
```

- [ ] **Step 2: Run the focused test against the current official model**

Run:

```bash
BLENDER_TEST_BLEND=assets/blender/factory-campus-graybox.blend \
BLENDER_TEST_GLB=public/models/factory-campus-graybox.glb \
node --test --test-name-pattern='operational vehicle routes' tools/blender/create_factory_campus_graybox.test.js
```

Expected: FAIL because `ROUTE__warehouse-delivery` does not exist.

- [ ] **Step 3: Add route and waypoint helpers**

Add these functions near `create_building_access_network`:

```python
def create_vehicle_route(route_id, points, loop_mode, dwell_fraction, parent):
    route = empty(f"ROUTE__{route_id}", parent=parent)
    route["routeId"] = route_id
    route["layerRole"] = "vehicle-route"
    route["loopMode"] = loop_mode
    route["dwellFraction"] = dwell_fraction
    for order, point in enumerate(points, start=1):
        waypoint = empty(f"WAYPOINT__{route_id}__{order:02d}", (*point, 0.0), route)
        waypoint["routeId"] = route_id
        waypoint["waypointOrder"] = order
        waypoint["layerRole"] = "vehicle-waypoint"
    return route


def configure_route_vehicle(vehicle, route_id, speed, phase):
    vehicle["motionPath"] = "campus-route"
    vehicle["linkedRoute"] = route_id
    vehicle["motionSpeed"] = speed
    vehicle["motionPhase"] = phase
    return vehicle
```

All points are final Blender XY ground coordinates because this layer is created after `expand_campus_plan`.

- [ ] **Step 4: Create the three routes and vehicles**

Create a `SITE__operational-traffic` root under `FactoryCampusGraybox` with these route intents:

```python
routes = {
    "warehouse-delivery": {
        "loopMode": "ping-pong",
        "dwellFraction": 0.14,
        "points": [(28.8, 20.7), (28.8, 9.0), (8.0, 9.0), (-4.2, 9.0), (-4.2, 10.8), (-4.2, 11.6), (-4.2, 12.1)],
    },
    "maintenance-service": {
        "loopMode": "ping-pong",
        "dwellFraction": 0.10,
        "points": [(28.8, 7.1), (20.0, 9.0), (20.0, 7.8), (20.0, 6.4), (20.0, 5.2), (20.0, 4.5)],
    },
    "fire-patrol": {
        "loopMode": "loop",
        "dwellFraction": 0.0,
        "points": [(27.0, 18.5), (27.0, -18.5), (12.0, -20.0), (-25.0, -20.0), (-27.0, -8.0), (-27.0, 18.0), (-8.0, 20.0), (18.0, 20.0), (27.0, 18.5)],
    },
}
```

Before accepting these coordinates, calculate each segment against current final-world AABBs. Shift a point along its owning road centerline if the segment enters any forbidden AABB; do not move buildings or roads to accommodate a route.

Create:

```python
delivery_start = (*routes["warehouse-delivery"]["points"][0], .08)
delivery = create_vehicle("VEHICLE__delivery-truck", delivery_start, mats, traffic, length=2.35, width=.78, height=.84, color="bus")
configure_route_vehicle(delivery, "warehouse-delivery", .022, .02)

maintenance_start = (*routes["maintenance-service"]["points"][0], .08)
maintenance = create_vehicle("VEHICLE__maintenance-van", maintenance_start, mats, traffic, length=1.55, width=.68, height=.65, color="vehicle_blue")
configure_route_vehicle(maintenance, "maintenance-service", .030, .31)

fire_start = (*routes["fire-patrol"]["points"][0], .08)
fire_patrol = create_vehicle("VEHICLE__fire-patrol", fire_start, mats, traffic, length=1.75, width=.72, height=.68, color="fire_red")
configure_route_vehicle(fire_patrol, "fire-patrol", .018, .58)
```

Add a low-profile amber lightbar to the maintenance van and a red/blue lightbar plus white side stripe to the fire-patrol vehicle. Keep all accessories parented beneath the corresponding vehicle root:

```python
box("VEHICLE__maintenance-van__lightbar-base", (.48, .16, .05), (0, 0, .71), mats["facade_frame"], maintenance, .012)
box("VEHICLE__maintenance-van__lightbar-amber", (.38, .12, .07), (0, 0, .77), mats["safety_yellow"], maintenance, .018)

box("VEHICLE__fire-patrol__lightbar-base", (.56, .17, .05), (0, 0, .75), mats["facade_frame"], fire_patrol, .012)
box("VEHICLE__fire-patrol__lightbar-red", (.23, .13, .07), (-.14, 0, .81), mats["fire_red"], fire_patrol, .014)
box("VEHICLE__fire-patrol__lightbar-blue", (.23, .13, .07), (.14, 0, .81), mats["accent"], fire_patrol, .014)
for side in (-1, 1):
    box(f"VEHICLE__fire-patrol__side-stripe-{side:+d}", (1.18, .025, .10), (0, side * .366, .42), mats["white"], fire_patrol, .004)
```

- [ ] **Step 5: Run the focused Blender test**

Generate a temporary fixture and run the focused route test. Expected: PASS with 3 routes, 22 ordered waypoints, 3 linked vehicles, and zero forbidden collisions.

- [ ] **Step 6: Commit the model-source contract**

```bash
git add tools/blender/create_factory_campus_graybox.py tools/blender/create_factory_campus_graybox.test.js
git commit -m "feat: define campus operational vehicle routes"
```

---

### Task 2: Parse GLB routes into an immutable Web registry

**Files:**
- Create: `src/scene/campusRouteRegistry.js`
- Create: `tests/campusRouteRegistry.test.js`
- Modify: `src/scene/factoryCampusAsset.js`
- Modify: `tests/factoryCampusAsset.test.js`

**Interfaces:**
- Consumes: Three.js GLB scene containing `ROUTE__*`, `WAYPOINT__*`, and route-vehicle extras from Task 1.
- Produces: `collectCampusRoutes(root): Map<string, CampusRoute>` where each route is `{ id, loopMode, dwellFraction, points: THREE.Vector3[] }`; `prepareFactoryCampusModel` attaches matching routes to `kind: 'route-vehicle'` animation records.

- [ ] **Step 1: Write the route-registry failing test**

Build a Three.js fixture with one transformed route root and deliberately shuffled waypoint children:

```js
const route = new THREE.Group()
route.name = 'ROUTE__warehouse-delivery'
route.position.set(10, 0, -4)
route.userData = { routeId: 'warehouse-delivery', loopMode: 'ping-pong', dwellFraction: .14 }

for (const [order, position] of [[3, [4, 0, 2]], [1, [0, 0, 0]], [2, [2, 0, 0]]]) {
  const point = new THREE.Group()
  point.name = `WAYPOINT__warehouse-delivery__${String(order).padStart(2, '0')}`
  point.position.set(...position)
  point.userData = { routeId: 'warehouse-delivery', waypointOrder: order }
  route.add(point)
}
root.add(route)

const routes = collectCampusRoutes(root)
assert.deepEqual(routes.get('warehouse-delivery').points.map((point) => point.toArray()), [
  [10, 0, -4], [12, 0, -4], [14, 0, -2],
])
```

Also assert duplicate orders, fewer than two points, missing `routeId`, and a vehicle referencing an unknown route throw descriptive errors.

- [ ] **Step 2: Run the route-registry test**

Run: `node --test tests/campusRouteRegistry.test.js`

Expected: FAIL because `collectCampusRoutes` is not exported.

- [ ] **Step 3: Implement route collection**

Implement:

```js
import * as THREE from 'three'

export function collectCampusRoutes(root) {
  root.updateMatrixWorld(true)
  const routes = new Map()
  root.traverse((object) => {
    if (!object.name.startsWith('ROUTE__')) return
    const id = String(object.userData.routeId || object.name.slice('ROUTE__'.length))
    const waypoints = object.children
      .filter((child) => child.name.startsWith(`WAYPOINT__${id}__`))
      .map((child) => ({ order: Number(child.userData.waypointOrder), point: child.getWorldPosition(new THREE.Vector3()) }))
      .sort((left, right) => left.order - right.order)
    if (!id || waypoints.length < 2) throw new Error(`invalid campus route: ${id || object.name}`)
    if (new Set(waypoints.map(({ order }) => order)).size !== waypoints.length) throw new Error(`duplicate waypoint order: ${id}`)
    routes.set(id, Object.freeze({
      id,
      loopMode: object.userData.loopMode === 'loop' ? 'loop' : 'ping-pong',
      dwellFraction: Math.max(0, Math.min(.3, Number(object.userData.dwellFraction) || 0)),
      points: Object.freeze(waypoints.map(({ point }) => point.clone())),
    }))
  })
  return routes
}
```

- [ ] **Step 4: Attach route records during asset preparation**

At the start of `prepareFactoryCampusModel`, call `collectCampusRoutes(root)`. Before the legacy generic-vehicle branch, add:

```js
if (object.userData.motionPath === 'campus-route') {
  const routeId = String(object.userData.linkedRoute || '')
  const route = routes.get(routeId)
  if (!route) throw new Error(`missing campus route for vehicle: ${object.name} -> ${routeId}`)
  animatedObjects.push({
    kind: 'route-vehicle',
    object,
    motionPath: 'campus-route',
    route,
    speed: Number(object.userData.motionSpeed) || 0,
    phase: Number(object.userData.motionPhase) || 0,
    basePosition: object.position.clone(),
    baseRotationY: object.rotation.y,
  })
  return
}
```

Return `routes` with the existing `{ root, interactiveObjects, animatedObjects }` data so debugging and tests can inspect the registry.

- [ ] **Step 5: Run focused tests**

Run:

```bash
node --test tests/campusRouteRegistry.test.js tests/factoryCampusAsset.test.js
```

Expected: PASS. Existing four legacy animated records remain unchanged; the fixture adds route records only when it contains route vehicles.

- [ ] **Step 6: Commit the GLB route parser**

```bash
git add src/scene/campusRouteRegistry.js src/scene/factoryCampusAsset.js tests/campusRouteRegistry.test.js tests/factoryCampusAsset.test.js
git commit -m "feat: parse operational routes from campus glb"
```

---

### Task 3: Sample routes with constant segment speed and destination dwell

**Files:**
- Create: `src/scene/campusRouteAnimation.js`
- Create: `tests/campusRouteAnimation.test.js`

**Interfaces:**
- Consumes: `CampusRoute` from Task 2 and elapsed seconds.
- Produces: `sampleRouteCycle(seconds, speed, phase, loopMode, dwellFraction)` and `samplePolyline(points, progress)` returning deterministic animation state without mutating Three.js objects.

- [ ] **Step 1: Write failing sampler tests**

Cover all these values:

```js
assert.deepEqual(sampleRouteCycle(0, .1, 0, 'ping-pong', .1), { progress: 0, returning: false, waiting: false })
assert.equal(sampleRouteCycle(4.5, .1, 0, 'ping-pong', .1).waiting, true)
assert.equal(sampleRouteCycle(7.5, .1, 0, 'ping-pong', .1).returning, true)
assert.equal(sampleRouteCycle(5, .1, 0, 'loop', 0).progress, .5)

const sample = samplePolyline([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(10, 0, 0),
  new THREE.Vector3(10, 0, 5),
], 2 / 3)
assert.deepEqual(sample.position.toArray(), [10, 0, 0])
assert.deepEqual(sample.tangent.toArray(), [1, 0, 0])
```

The last assertion proves progress is measured by total route distance, not waypoint index.

- [ ] **Step 2: Run the sampler test**

Run: `node --test tests/campusRouteAnimation.test.js`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement cycle sampling**

Use a 45% outbound window, destination dwell, 45% return window, and remaining start dwell for ping-pong routes:

```js
const mod1 = (value) => ((value % 1) + 1) % 1
const smoothstep = (value) => {
  const x = Math.max(0, Math.min(1, value))
  return x * x * (3 - 2 * x)
}

export function sampleRouteCycle(seconds, speed = 1, phase = 0, loopMode = 'ping-pong', dwellFraction = .1) {
  const cycle = mod1(seconds * speed + phase)
  if (loopMode === 'loop') return { progress: cycle, returning: false, waiting: false }
  const dwell = Math.max(0, Math.min(.3, dwellFraction))
  const travel = (1 - dwell * 2) / 2
  if (cycle < travel) return { progress: smoothstep(cycle / travel), returning: false, waiting: false }
  if (cycle < travel + dwell) return { progress: 1, returning: false, waiting: true }
  if (cycle < travel * 2 + dwell) {
    return { progress: 1 - smoothstep((cycle - travel - dwell) / travel), returning: true, waiting: false }
  }
  return { progress: 0, returning: true, waiting: true }
}
```

- [ ] **Step 4: Implement distance-based polyline sampling**

Calculate segment lengths once per call, clamp progress to `[0, 1]`, locate the target cumulative distance, and return cloned `position` and normalized `tangent`. For a zero-length segment, advance to the next non-zero segment. Throw `route requires at least two points` for invalid input:

```js
import * as THREE from 'three'

export function samplePolyline(points, progress) {
  if (!Array.isArray(points) || points.length < 2) throw new Error('route requires at least two points')
  const segments = []
  let totalLength = 0
  for (let index = 0; index < points.length - 1; index += 1) {
    const delta = points[index + 1].clone().sub(points[index])
    const length = delta.length()
    segments.push({ start: points[index], end: points[index + 1], delta, length })
    totalLength += length
  }
  if (totalLength <= Number.EPSILON) {
    return { position: points[0].clone(), tangent: new THREE.Vector3(0, 0, 1) }
  }
  const target = THREE.MathUtils.clamp(progress, 0, 1) * totalLength
  let traversed = 0
  for (const segment of segments) {
    if (segment.length <= Number.EPSILON) continue
    if (target <= traversed + segment.length) {
      const localProgress = (target - traversed) / segment.length
      return {
        position: segment.start.clone().lerp(segment.end, THREE.MathUtils.clamp(localProgress, 0, 1)),
        tangent: segment.delta.clone().divideScalar(segment.length),
      }
    }
    traversed += segment.length
  }
  const last = segments.findLast((segment) => segment.length > Number.EPSILON)
  return { position: points.at(-1).clone(), tangent: last.delta.clone().divideScalar(last.length) }
}
```

- [ ] **Step 5: Run the sampler tests**

Run: `node --test tests/campusRouteAnimation.test.js`

Expected: PASS for loop, outbound, dwell, return, negative time, unequal segment lengths, and duplicate adjacent waypoint coverage.

- [ ] **Step 6: Commit the pure route sampler**

```bash
git add src/scene/campusRouteAnimation.js tests/campusRouteAnimation.test.js
git commit -m "feat: sample campus vehicle routes"
```

---

### Task 4: Animate operational vehicles without regressing the gate shuttle

**Files:**
- Modify: `src/scene/vehicleAnimation.js`
- Modify: `tests/vehicleAnimation.test.js`

**Interfaces:**
- Consumes: `kind: 'route-vehicle'` records from Task 2 and samplers from Task 3.
- Produces: `updateVehicleAnimations(animatedItems, seconds, reducedMotion, trafficEnabled = true)` supporting both existing `kind: 'vehicle'` gate shuttles and new route vehicles.

- [ ] **Step 1: Write a failing route-vehicle animation test**

Create a vehicle with a right-angle route and assert position plus heading:

```js
const object = new THREE.Group()
const item = {
  kind: 'route-vehicle',
  object,
  route: {
    loopMode: 'loop', dwellFraction: 0,
    points: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(4, 0, 0), new THREE.Vector3(4, 0, 4)],
  },
  speed: .1,
  phase: 0,
  basePosition: new THREE.Vector3(0, 0, 0),
  baseRotationY: 0,
}

updateVehicleAnimations([item], 5, false, true)
assert.deepEqual(object.position.toArray().map((value) => Math.round(value * 100) / 100), [4, 0, 0])
assert.equal(Math.round(object.rotation.y * 100) / 100, 1.57)
```

Also assert `reducedMotion=true` and `trafficEnabled=false` restore the first route point and `baseRotationY`.

- [ ] **Step 2: Run the focused test**

Run: `node --test tests/vehicleAnimation.test.js`

Expected: FAIL because `route-vehicle` is ignored.

- [ ] **Step 3: Implement route-vehicle updates**

Before the existing legacy `kind !== 'vehicle'` guard, handle route vehicles:

```js
if (item.kind === 'route-vehicle') {
  if (reducedMotion || !trafficEnabled || !item.speed) {
    item.object.position.copy(item.route.points[0])
    item.object.rotation.y = item.baseRotationY ?? 0
    return
  }
  const cycle = sampleRouteCycle(seconds, item.speed, item.phase, item.route.loopMode, item.route.dwellFraction)
  const sample = samplePolyline(item.route.points, cycle.progress)
  item.object.position.copy(sample.position)
  if (!cycle.waiting && sample.tangent.lengthSq() > 0) {
    const tangent = cycle.returning ? sample.tangent.clone().negate() : sample.tangent
    item.object.rotation.y = Math.atan2(tangent.x, tangent.z)
  }
  return
}
```

Keep the current `sampleGateTrafficCycle` branch byte-for-byte equivalent for `kind: 'vehicle'`.

- [ ] **Step 4: Run vehicle and gate regression tests**

Run:

```bash
node --test tests/vehicleAnimation.test.js tests/gateAnimation.test.js tests/gateTrafficCycle.test.js
```

Expected: PASS. The gate shuttle still pauses at recognition and reverses only on its return journey.

- [ ] **Step 5: Commit route animation integration**

```bash
git add src/scene/vehicleAnimation.js tests/vehicleAnimation.test.js
git commit -m "feat: animate vehicles across campus routes"
```

---

### Task 5: Add an accessible traffic-demo control

**Files:**
- Create: `src/components/TrafficDemoToggle.js`
- Create: `tests/trafficDemoToggle.test.js`
- Modify: `src/components/IndustrialScene.jsx`
- Modify: `src/hooks/useIndustrialScene.js`
- Modify: `src/styles/index.css`

**Interfaces:**
- Consumes: `trafficEnabled: boolean` from `IndustrialScene`.
- Produces: an accessible toggle and a `trafficEnabled` argument passed to `updateVehicleAnimations` without recreating the WebGL scene.

- [ ] **Step 1: Write the toggle rendering test**

Follow the existing server-rendered component-test pattern:

```js
const enabled = renderToStaticMarkup(createElement(TrafficDemoToggle, { active: true, onToggle() {} }))
assert.match(enabled, /aria-pressed="true"/)
assert.match(enabled, /暂停交通演示/)
assert.match(enabled, /TRAFFIC LIVE/)

const paused = renderToStaticMarkup(createElement(TrafficDemoToggle, { active: false, onToggle() {} }))
assert.match(paused, /aria-pressed="false"/)
assert.match(paused, /启动交通演示/)
assert.match(paused, /TRAFFIC PAUSED/)
```

- [ ] **Step 2: Run the toggle test**

Run: `node --test tests/trafficDemoToggle.test.js`

Expected: FAIL because `TrafficDemoToggle` is missing.

- [ ] **Step 3: Implement the standalone toggle**

Export `TrafficDemoToggle({ active, onToggle })` using the same `createElement` style as `CampusFocusToggle`. Use class `traffic-demo-toggle`, `type="button"`, `aria-pressed={active}`, and dynamic labels from Step 1. Include a small three-dot route icon with `aria-hidden="true"`.

- [ ] **Step 4: Thread traffic state into the animation loop**

In `IndustrialScene`:

```js
const [trafficEnabled, setTrafficEnabled] = useState(true)
```

Render the toggle beside the existing day/evening control. Pass `trafficEnabled` to `useIndustrialScene`.

In `useIndustrialScene`, mirror the existing lighting ref pattern:

```js
const trafficEnabledRef = useRef(trafficEnabled)
useEffect(() => { trafficEnabledRef.current = trafficEnabled }, [trafficEnabled])
```

Then call:

```js
updateVehicleAnimations(park.animated, seconds, reducedMotion, trafficEnabledRef.current)
```

Do not include `trafficEnabled` in the scene-creation effect dependency list; toggling traffic must not dispose and reload the GLB.

- [ ] **Step 5: Add dashboard-consistent styling**

Place the control above the lighting toggle at the lower-right scene edge. Use these exact declarations so it remains visually related to the existing lighting control:

```css
.traffic-demo-toggle {
  position: absolute; z-index: 9; right: 99px; bottom: 132px;
  display: flex; align-items: center; gap: 7px; min-width: 112px; padding: 6px 8px;
  border: 1px solid rgba(25, 215, 255, .24); background: rgba(3, 25, 39, .84);
  color: #d7fbff; font: inherit; cursor: pointer;
  box-shadow: inset 0 0 12px rgba(25, 215, 255, .05);
}
.traffic-demo-toggle small { display: block; color: #5e91a2; font-size: 8px; letter-spacing: .8px; }
.traffic-demo-toggle strong { display: block; font-size: 9px; font-weight: 600; letter-spacing: .5px; }
.traffic-demo-toggle__status { width: 5px; height: 5px; border-radius: 50%; background: #19d7ff; box-shadow: 0 0 8px rgba(25, 215, 255, .8); }
.traffic-demo-toggle[aria-pressed="false"] .traffic-demo-toggle__status { background: #d79b23; box-shadow: 0 0 6px rgba(215, 155, 35, .55); }
.traffic-demo-toggle:focus-visible { outline: 1px solid #8eefff; outline-offset: 2px; }
@media (max-width: 1360px) {
  .traffic-demo-toggle { right: 82px; bottom: 128px; transform: scale(.92); transform-origin: right bottom; }
}
```

- [ ] **Step 6: Run component and animation tests**

Run:

```bash
node --test tests/trafficDemoToggle.test.js tests/vehicleAnimation.test.js tests/campusFocusToggle.test.js
```

Expected: PASS.

- [ ] **Step 7: Commit the traffic control**

```bash
git add src/components/TrafficDemoToggle.js src/components/IndustrialScene.jsx src/hooks/useIndustrialScene.js src/styles/index.css tests/trafficDemoToggle.test.js
git commit -m "feat: add campus traffic demo control"
```

---

### Task 6: Regenerate assets and perform geometry, motion, and Web QA

**Files:**
- Update: `assets/blender/factory-campus-graybox.blend`
- Update: `public/models/factory-campus-graybox.glb`
- Modify: `tests/generatedModelContract.test.js`
- Modify: `README.md`

**Interfaces:**
- Consumes: Blender route model from Task 1 and Web parsers/animation from Tasks 2–5.
- Produces: final editable model, final Web GLB, generated-model regression coverage, and operator documentation.

- [ ] **Step 1: Regenerate a temporary fixture**

Run Blender in background mode with temporary `.blend` and `.glb` outputs. Expected: exit 0 and `GRAYBOX_EXPORT ... buildings=12`.

- [ ] **Step 2: Audit route geometry in Blender**

For every consecutive waypoint pair, construct a narrow 2D swept AABB using the linked vehicle width plus `.18` clearance. Assert no swept AABB intersects:

- any unrelated `*__wall-shell`;
- `COURT__surface` or `TENNIS__surface`;
- any object with `trunk` in its lowercase name;
- `PARKING__post-*`;
- `PIPE__column-*` or `PIPE__bridge-gantry-*` below vehicle roof height.

Expected: collision list `[]` for all three routes.

- [ ] **Step 3: Render top and oblique previews**

Render the temporary fixture. Confirm:

- delivery truck uses the gate/inner-road hierarchy and stops at the front warehouse apron;
- maintenance van reaches the main production hall access road;
- fire-patrol vehicle remains on the perimeter loop;
- no vehicle starts inside another object;
- added lightbars remain legible without becoming oversized dashboard markers.

- [ ] **Step 4: Regenerate official assets**

Run:

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python tools/blender/create_factory_campus_graybox.py -- \
  --blend-output assets/blender/factory-campus-graybox.blend \
  --glb-output public/models/factory-campus-graybox.glb
```

Expected: both official files updated and Blender exits.

- [ ] **Step 5: Extend the generated GLB contract test**

Assert the official GLB JSON contains all three `ROUTE__*` roots, all 22 ordered `WAYPOINT__*` nodes, all three vehicle roots, and these extras on every route vehicle:

```js
assert.equal(vehicle.extras.motionPath, 'campus-route')
assert.equal(vehicle.extras.linkedRoute, routeId)
assert.ok(vehicle.extras.motionSpeed > 0)
```

- [ ] **Step 6: Run complete verification**

Run:

```bash
BLENDER_TEST_BLEND=assets/blender/factory-campus-graybox.blend \
BLENDER_TEST_GLB=public/models/factory-campus-graybox.glb \
node --test tools/blender/create_factory_campus_graybox.test.js
npm test
npm run build
curl -s http://localhost:5180/
```

Expected: all Blender tests pass, all project tests pass, Vite build exits 0, and port 5180 serves the current branch.

- [ ] **Step 7: Update README operation notes**

Document:

- Blender owns route nodes and waypoints;
- Web owns route sampling and motion;
- `交通演示` pauses only route vehicles, while reduced motion pauses all nonessential motion;
- gate shuttle remains a separate synchronized demo;
- exact regeneration and verification commands from Step 6.

- [ ] **Step 8: Commit generated assets and documentation**

```bash
git add assets/blender/factory-campus-graybox.blend public/models/factory-campus-graybox.glb tests/generatedModelContract.test.js README.md
git commit -m "feat: deliver animated campus traffic operations"
```

---

## Acceptance Checklist

- [ ] Three visually distinct vehicles follow three named Blender-authored routes.
- [ ] Warehouse and maintenance vehicles dwell at their destination aprons before returning.
- [ ] Fire patrol loops continuously without reversing at route closure.
- [ ] Existing gate shuttle and barrier timing remains unchanged.
- [ ] Traffic toggle pauses and restores route vehicles without reloading WebGL.
- [ ] Reduced-motion users see all route vehicles parked at deterministic start positions.
- [ ] No route crosses a building, sports court, tree trunk, parking-canopy post, or pipe-rack column.
- [ ] Floor explosion, floor focus, campus-only view, lighting mode, and camera reset still work.
- [ ] Editable `.blend` and Web `.glb` contain the same route/vehicle contract.

## Follow-on Milestones

1. **Fire emergency interaction:** click a hydrant or alarm button to pause normal traffic, dispatch the fire-patrol vehicle to a selected building access apron, flash its lightbar, and show the response route.
2. **Night infrastructure pass:** add Blender-authored streetlights, loading-dock lamps, gate lighting, controlled emissive materials, and evening-only light pools tied to the existing lighting mode.
3. **Operations telemetry:** expose selected vehicle state, route name, destination, dwell state, and gate phase in a compact dashboard card without changing the 3D route engine.
