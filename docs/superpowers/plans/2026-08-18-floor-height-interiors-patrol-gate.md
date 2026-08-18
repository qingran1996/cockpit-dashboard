# Floor Height, Interior Activity, Patrol, and Gate Animation Plan

**Goal:** Preserve the current campus layout while making exploded floors feel taller, interiors read by function, outdoor patrols feel alive, and the entry barrier respond to the moving gate vehicle.

**Architecture:** Keep Blender as the source of geometry and semantic animation metadata. Export floor props, walkers, barrier pivots, and motion settings in the GLB; let small pure Three.js animation modules apply runtime motion. Preserve existing building node names and floor interaction contracts.

**Tech Stack:** Blender Python, glTF/GLB, Three.js, React, Node test runner.

---

### Task 1: Lock the new visual and animation contracts

- Update Blender generator tests to require taller floor volumes, office lounge furniture, industrial work tables, site patrol walkers, and animated gate metadata.
- Update Web tests to require the larger exploded-floor gap, axis-aware person paths, patrol parsing, and gate animation parsing.
- Add a focused gate-animation test for vehicle-synchronized opening and closing.

### Task 2: Improve exploded floors and interiors in Blender

- Increase the readable height of each translucent floor section without changing the campus footprint.
- Add sofas, coffee tables, chairs, storage, worktables, carts, and functional equipment according to building use.
- Keep circulation aisles open and props low-poly enough for the Web scene.

### Task 3: Add patrol people and an animatable gate

- Add several low-poly patrol walkers on safe pedestrian routes with axis, distance, speed, and phase metadata.
- Replace static barrier beams with hinge-root objects and child arms so rotation occurs around the physical post.
- Link barrier timing metadata to the gate shuttle motion cycle.

### Task 4: Integrate runtime motion in the Web scene

- Parse floor walkers, site patrols, vehicles, and gate barriers into explicit animation kinds.
- Extend person animation to support both X- and Z-axis patrol routes.
- Add smooth gate-open windows around both shuttle crossings and invoke the updater in the render loop.
- Update the exploded-floor UI label to match the new spacing.

### Task 5: Regenerate and verify

- Regenerate the editable `.blend` and exported `.glb` assets.
- Run focused tests, the full Blender contract suite, the full Web suite, and a production build.
- Inspect the running scene in the browser for floor proportions, interior readability, unobstructed patrol paths, and gate/vehicle timing.
