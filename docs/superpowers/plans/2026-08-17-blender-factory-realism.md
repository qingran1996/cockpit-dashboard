# Factory Campus Realism Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the approved factory-campus layout while upgrading the Blender scene and exported GLB from a graybox look to a lightweight semi-realistic industrial visualization.

**Architecture:** Keep every building root, world-space coordinate, camera transform, and site dimension unchanged. Extend the procedural Blender generator with export-safe PBR material parameters and low-cost construction details that survive GLB export; verify the scene by inspecting the generated `.blend` and imported `.glb`, then render a fixed-camera preview.

**Tech Stack:** Blender 5.2 Python API, Eevee, glTF/GLB, Node.js built-in test runner.

## Global Constraints

- Do not use the `img2threejs` skill.
- Preserve the current building layout, site dimensions, and front-left camera composition.
- Keep all generated scene roots positively scaled to avoid the saved-Eevee blank-render regression.
- Prefer PBR values and lightweight geometry that export reliably to GLB; do not depend on unbaked Blender-only procedural textures.
- Do not commit or push without an explicit user request.

---

### Task 1: Define the semi-realistic scene contract

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Test: `tools/blender/create_factory_campus_graybox.test.js`

**Interfaces:**
- Consumes: generated Blender scene and GLB from `create_factory_campus_graybox.py`.
- Produces: assertions for PBR materials, façade/roof/drainage/curb details, and the unchanged layout contract.

- [ ] **Step 1: Write the failing test**

Add a test that generates and inspects the scene, then asserts literal material thresholds and required detail nodes: `DETAIL__roof-rib-01`, `DETAIL__wall-plinth-01`, `DETAIL__gutter-01`, `DETAIL__downpipe-01`, and `DETAIL__curb-01`.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test --test-name-pattern="semi-realistic" tools/blender/create_factory_campus_graybox.test.js`

Expected: FAIL because the named details and updated material properties do not exist yet.

- [ ] **Step 3: Keep the existing layout regression test unchanged**

The test must continue asserting the 44:30 site proportion, dominant main hall, fixed front-left camera, positive root scale, administration/east-zone separation, rear depth, bright world, and forest backdrop.

### Task 2: Implement export-safe PBR materials and industrial construction details

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Test: `tools/blender/create_factory_campus_graybox.test.js`

**Interfaces:**
- Consumes: `BUILDINGS`, existing `material`, `box`, and `cylinder` helpers.
- Produces: `create_industrial_finish_details(mats, campus)` and materials readable from Blender and retained in GLB.

- [ ] **Step 1: Extend the material helper**

Add optional `transmission`, `ior`, and `coat_weight` parameters and set the Blender 5.2 Principled BSDF sockets only when present.

- [ ] **Step 2: Tune the material palette**

Use off-white painted wall panels, galvanized roof metal, dark reflective glazing, rough asphalt/concrete, painted steel pipe racks, and varied vegetation values. Keep colors restrained and physically plausible.

- [ ] **Step 3: Add lightweight industrial details**

Create roof seams/ribs on the major halls, concrete wall plinth bands, gutters/downpipes, selected façade panel joints, curbs, drain covers, and pipe identification bands. Parent every object under the existing campus root and use deterministic names.

- [ ] **Step 4: Improve Eevee presentation without moving the camera**

Retain camera location `(-39, 44, 36)` and lens `58`; adjust sun/fill/world values and shadow/render settings only.

- [ ] **Step 5: Run the focused test to verify it passes**

Run: `node --test --test-name-pattern="semi-realistic" tools/blender/create_factory_campus_graybox.test.js`

Expected: PASS.

### Task 3: Generate, render, inspect, and integrate assets

**Files:**
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`
- Create: `output/playwright/blender-factory-realistic.png`

**Interfaces:**
- Consumes: the updated procedural generator.
- Produces: editable Blender source, web-ready GLB, and a fixed-camera review image.

- [ ] **Step 1: Generate production assets**

Run Blender in background mode with explicit `--blend-output` and `--glb-output` paths.

- [ ] **Step 2: Render the fixed-camera preview**

Open the generated `.blend` in background mode, render one Eevee still to `output/playwright/blender-factory-realistic.png`, and verify the process exits successfully.

- [ ] **Step 3: Inspect the preview image**

Confirm the approved layout is unchanged, roofs/walls/roads separate clearly, glass and metal read differently, details do not create visual noise, and the scene retains aerial depth.

- [ ] **Step 4: Run full verification**

Run:

```bash
node --test tools/blender/create_factory_campus_graybox.test.js
npm test
npm run build
```

Expected: all commands exit `0` with no test failures.

- [ ] **Step 5: Reload the final `.blend` in Blender**

Use Computer Use to open `assets/blender/factory-campus-graybox.blend`, switch to camera view if necessary, and visually confirm the app shows the same generated scene.

## Self-Review

- Spec coverage: layout preservation is protected by the existing spatial test; realism is covered by the new material/detail contract; GLB and Blender outputs are both regenerated and checked.
- Placeholder scan: no deferred implementation items remain.
- Interface consistency: test names match the deterministic scene node names; output paths match the existing integration contract.
