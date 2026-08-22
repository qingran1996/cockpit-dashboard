# Building Material Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an operator-facing material laboratory that lets a selected campus building preview and tune the five embedded Blender PBR material families without changing other buildings.

**Architecture:** A pure Three.js controller indexes the existing GLB material families, records original mesh assignments, and applies isolated material/texture clones by building and construction scope. React owns the visible configuration and presents the laboratory in place of the existing building section panel; the scene hook bridges UI commands to the loaded GLB and reapplies queued edits after asynchronous model replacement.

**Tech Stack:** React 18, Three.js r165, Vite, Node test runner, server-rendered component contract tests.

## Global Constraints

- Preserve the approved campus geometry, Blender source, GLB file, building selection, floor explosion, focus, lighting and traffic behavior.
- Use only the five PBR families already embedded in the GLB; do not add runtime texture requests or increase the GLB size.
- Clone every edited material and texture so a change to one building never mutates another building or a template.
- Keep pale facade colors safe by limiting tint, roughness, normal, AO, texture scale and local reflection to bounded UI ranges.
- The panel must fit the existing 1920×1080 scene, support keyboard focus and reduced motion, and never open as a modal.
- Do not commit, merge or push without an explicit user request.

### Design Direction

- Subject: an industrial EMS operator comparing physical facade samples on the live campus model.
- Palette: inspection navy `#031927`, instrument cyan `#19d7ff`, sample white `#eaf1ed`, galvanized blue `#8ca6af`, limestone sand `#d7c6a7`, approval amber `#ffc56e`.
- Type: existing Chinese UI stack for labels, DIN Alternate/Arial Narrow for material codes and numeric readings.
- Layout: selected building panel → “材质实验室” → same-position sample board with scope rail, material coupons and two-column engineering controls.
- Signature: each material card is a clipped physical coupon with a CSS texture pattern and a single inspection-light sweep when selected.

---

### Task 1: Isolated Three.js Material Controller

**Files:**
- Create: `src/scene/campusMaterialLab.js`
- Create: `tests/campusMaterialLab.test.js`

**Interfaces:**
- Consumes: loaded campus `THREE.Object3D` carrying `buildingId`, material names and `architecturalPbrFamily` metadata.
- Produces: `CAMPUS_MATERIAL_FAMILIES`, `CAMPUS_MATERIAL_SCOPES`, `createBuildingMaterialSettings(building)`, and `createCampusMaterialController(root)` with `apply(buildingId, scope, settings)`, `reset(buildingId, scope)`, and `dispose()`.

- [x] **Step 1: Write the failing controller tests**

Create real Three.js meshes for two buildings and five source-family materials. Assert that applying a warehouse facade to building A changes only A, uses cloned textures, preserves the original for reset, sanitizes values, and rejects a family that is invalid for the selected construction scope.

- [x] **Step 2: Run the focused controller test and verify RED**

Run: `node --test tests/campusMaterialLab.test.js`

Expected: FAIL because `src/scene/campusMaterialLab.js` does not exist.

- [x] **Step 3: Implement the bounded material controller**

Index family templates before edits, classify facade/roof/plinth meshes from original PBR metadata, clone all texture channels, apply tint/roughness/normal/AO/repeat/reflection, dispose superseded clones, and restore exact original material references on reset.

- [x] **Step 4: Run the focused controller test and verify GREEN**

Run: `node --test tests/campusMaterialLab.test.js`

Expected: all controller tests pass with no warnings.

### Task 2: Operator Material Sample Board

**Files:**
- Create: `src/components/BuildingMaterialLab.js`
- Create: `tests/buildingMaterialLab.test.js`
- Modify: `src/components/BuildingFloorPanel.js`
- Modify: `src/styles/index.css`

**Interfaces:**
- Consumes: selected building, active scope, bounded settings, material family schema, and change/reset/back callbacks.
- Produces: an accessible nonmodal panel and a “材质实验室” entry action in the building section panel.

- [x] **Step 1: Write the failing component contracts**

Render the real components and assert the building name, three construction scopes, valid material coupons, Base Color/Normal/Roughness/AO channel legend, color/range controls, reset/back actions, and the floor-panel entry button.

- [x] **Step 2: Run the focused component tests and verify RED**

Run: `node --test tests/buildingMaterialLab.test.js tests/buildingFloorPanel.test.js`

Expected: FAIL because the material laboratory and entry action do not exist.

- [x] **Step 3: Implement the sample-board component and styling**

Use the approved inspection-navy/cyan shell, material-specific clipped coupon patterns, amber selected state, compact two-column controls, visible focus, and reduced-motion-safe inspection sweep. Do not introduce a second overlay beside the floor panel.

- [x] **Step 4: Run the focused component tests and verify GREEN**

Run: `node --test tests/buildingMaterialLab.test.js tests/buildingFloorPanel.test.js`

Expected: all component contracts pass.

### Task 3: Scene Integration and Acceptance

**Files:**
- Modify: `src/hooks/useIndustrialScene.js`
- Modify: `src/components/IndustrialScene.jsx`
- Modify: `README.md`
- Test: `tests/campusMaterialLab.test.js`
- Test: `tests/buildingMaterialLab.test.js`

**Interfaces:**
- Consumes: controller and sample-board interfaces from Tasks 1–2.
- Produces: live material edits on the selected loaded GLB building, reset behavior, Escape/back navigation, and documented operator workflow.

- [x] **Step 1: Integrate queued scene commands**

Expose stable `applyBuildingMaterial` and `resetBuildingMaterial` callbacks from the hook, create the controller after `park.ready`, replay current edits after GLB replacement, and dispose clones during scene teardown.

- [x] **Step 2: Integrate selected-building state**

Store settings per building and scope in `IndustrialScene`, open the laboratory from `BuildingFloorPanel`, apply family defaults when a coupon changes, reset only the active scope, and make Escape/back return to the floor panel without clearing the building selection.

- [x] **Step 3: Document the workflow**

Document the five families, three editable scopes, embedded texture channels, isolated preview behavior, bounded parameters, and restore action in `README.md`.

- [x] **Step 4: Run full automated verification**

Run: `node --test tests/*.test.js`

Expected: all tests pass.

Run: `node node_modules/vite/bin/vite.js build`

Expected: Vite production build succeeds.

Run: `git diff --check`

Expected: no whitespace errors.

- [x] **Step 5: Browser acceptance**

Open the running homepage, select two different buildings, switch facade materials and controls on only one building, verify the other remains unchanged, reset the edited scope, check the three scope tabs, confirm the panel does not obscure scene controls, and verify Escape/back navigation.
