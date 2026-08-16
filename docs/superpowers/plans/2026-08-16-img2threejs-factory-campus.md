# Img2ThreeJS Factory Campus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dashboard's existing generic holographic industrial park with a procedural Three.js campus recognizable from `bgtp.jpg`, while preserving orbit, hover, selection, reset, reduced-motion, and WebGL fallback behavior.

**Architecture:** Keep `IndustrialScene.jsx` and `useIndustrialScene.js` as the renderer/interaction boundary. Replace the existing building registry and procedural building templates with a factory-campus registry plus focused scene builders for buildings, roads, pipe racks, amenities, and landscaping. The img2threejs assessment/spec/state remain quality evidence; runtime code stays plain JavaScript to match the existing project.

**Tech Stack:** React 18, Three.js 0.165, Vite 5, Node test runner, img2threejs 1.4.4.

## Global Constraints

- Work only on `codex/img2threejs-factory-rebuild`; do not modify `main`.
- Preserve the user's existing uncommitted changes in `src/components/DashboardHeader.jsx` and `src/styles/index.css`.
- Do not import GLB, FBX, or external model packs.
- Treat the single-view reconstruction as approximate; do not claim CAD/BIM accuracy.
- Keep at least nine independently selectable building groups.
- Keep the existing renderer, OrbitControls, raycaster, reset behavior, reduced-motion handling, and disposal path.
- Use deterministic distributions for repeated trees, vents, windows, fence posts, and road markings.

---

### Task 1: Lock the campus data contract

**Files:**
- Create: `src/scene/factoryCampusRegistry.js`
- Modify: `tests/buildingRegistry.test.js`

**Interfaces:**
- Produces: `factoryCampusRegistry: Array<CampusBuildingRecord>`
- Produces: `factoryCampusById: Map<string, CampusBuildingRecord>`
- Record fields: `id`, `name`, `type`, `status`, `metricLabel`, `metricValue`, `temperature`, `position`, `size`, `levels`, `roofType`, `accent`.

- [ ] **Step 1: Write the failing registry test**

Assert at least nine unique buildings, all required fields, known roof types, positive dimensions, and presence of the main production hall, administration building, central processing hall, right warehouse, and utility building.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/buildingRegistry.test.js`

Expected: FAIL because `factoryCampusRegistry.js` does not exist.

- [ ] **Step 3: Implement the reference-derived registry**

Add normalized positions on a 34 × 25 ground footprint. Use records for the long production hall, central processing hall, rear high-bay hall, two auxiliary halls, right warehouse, right utility building, front warehouse, and administration building.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `node --test tests/buildingRegistry.test.js`

- [ ] **Step 5: Commit**

`git add src/scene/factoryCampusRegistry.js tests/buildingRegistry.test.js && git commit -m "test: define factory campus registry contract"`

### Task 2: Build deterministic campus geometry helpers

**Files:**
- Create: `src/scene/factoryCampusFactory.js`
- Create: `tests/factoryCampusFactory.test.js`

**Interfaces:**
- Produces: `createFactoryCampusBuilding(record, materials): THREE.Group`
- Produces: `createFactoryCampusMaterials(): Record<string, THREE.Material>`
- Produces: `createFactoryCampusSystems(animated): THREE.Group`
- Each building group sets `userData.buildingId` on the root and descendant meshes.

- [ ] **Step 1: Write failing geometry tests**

Test exported pure helpers `roofVentLayout(size, spacing)`, `facadeBayLayout(length, spacing)`, and `campusSeededValue(index)` for deterministic, bounded distributions. Test that every known registry roof type has a builder.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/factoryCampusFactory.test.js`

Expected: FAIL because the module and helpers do not exist.

- [ ] **Step 3: Implement building masses**

Use beveled-looking layered cuboids for wall shells, shallow roof slabs, cyan edge trim, recessed blue doors, window strips, roof vents, and skylights. Build the administration facade as repeated piers and glazing bays. Use named groups and meshes for click/explode readiness.

- [ ] **Step 4: Implement campus systems**

Add the ground plate, lawns, orthogonal roads, curbs, lane dashes, zebra stripes, basketball court, parking canopies, perimeter fence, pipe-rack columns/beams/tube runs, streetlights, deterministic low-poly trees, and flower bands. Use `InstancedMesh` for dense repeated systems where interaction is not needed.

- [ ] **Step 5: Run geometry tests and verify GREEN**

Run: `node --test tests/factoryCampusFactory.test.js`

- [ ] **Step 6: Commit**

`git add src/scene/factoryCampusFactory.js tests/factoryCampusFactory.test.js && git commit -m "feat: add procedural factory campus geometry"`

### Task 3: Integrate the reconstructed campus

**Files:**
- Modify: `src/scene/sceneFactory.js`
- Modify: `src/components/IndustrialScene.jsx`
- Modify: `src/hooks/useIndustrialScene.js`
- Modify: `tests/buildingRegistry.test.js`

**Interfaces:**
- `createIndustrialScene()` continues returning `{ root, interactiveObjects, animated, dispose }`.
- `IndustrialScene` reads `factoryCampusRegistry` and `factoryCampusById`.
- Animation kinds remain explicit; new supported kinds may include `energyPulse` and `beacon`.

- [ ] **Step 1: Write the failing integration assertion**

Update the registry test to assert the exported interactive count equals the campus registry length and old tank/chimney model types are absent.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`

- [ ] **Step 3: Replace scene assembly**

Wire `factoryCampusFactory.js` into `sceneFactory.js`; remove old generic base/building construction from the runtime path while retaining disposal. Update labels and lookup imports without changing component interaction behavior.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test`

- [ ] **Step 5: Build**

Run: `npm run build`

- [ ] **Step 6: Commit**

`git add src/scene/sceneFactory.js src/components/IndustrialScene.jsx src/hooks/useIndustrialScene.js tests/buildingRegistry.test.js && git commit -m "feat: replace center scene with factory campus"`

### Task 4: Complete img2threejs material and structure gates

**Files:**
- Modify: `.img2threejs/factory-campus-sculpt-spec.json`
- Create: `.img2threejs/material-evidence/*.json`
- Create: `.img2threejs/parts.json`

**Interfaces:**
- The spec names every macro building, meso building assembly, repeated system, material, review target, and inference.
- `parts.json` maps every specified interactive building/system to a named runtime Object3D.

- [ ] **Step 1: Extract PBR evidence**

Run material analysis on wall, roof, asphalt, vegetation, pipe-rack, glazing, and court crops. Record low-confidence results as limitations rather than exact inverse-rendering claims.

- [ ] **Step 2: Refine the sculpt spec**

Replace the root placeholder with the actual campus hierarchy, topology classes, transforms, attachments, material recipes, repetition systems, lighting contract, performance budget, and object-specific feature review targets.

- [ ] **Step 3: Validate the spec**

Run `validate_sculpt_spec.py ... --strict-quality`.

Expected: PASS before any generator artifact is accepted.

- [ ] **Step 4: Generate/compare build artifact**

Run the locked blockout generation command. Keep the hand-authored runtime factory as the application integration source when the generic generated artifact cannot preserve project-specific interaction/disposal interfaces; record this adaptation explicitly.

- [ ] **Step 5: Run part coverage**

Run `check_part_coverage.py --spec ... --manifest .img2threejs/parts.json`.

### Task 5: Visual review and correction

**Files:**
- Create: `output/img2threejs/factory-campus-reference-view.png`
- Create: `output/img2threejs/factory-campus-{front,right,rear,left}.png`
- Create: `output/img2threejs/factory-campus-comparison.png`
- Modify: `.img2threejs/factory-campus-sculpt-spec.json`

**Interfaces:**
- Review evidence uses the real Vite application route and existing camera/renderer.

- [ ] **Step 1: Start the Vite preview and capture the reference-matched view**

Capture the center scene at 1920 × 1080 after the renderer settles.

- [ ] **Step 2: Capture four orbit views**

Capture front, right, rear, and left views and run the multi-angle/turntable gates.

- [ ] **Step 3: Create and inspect the comparison sheet**

Use `make_comparison_sheet.py`; record layout, silhouette, hierarchy, material, and identity-feature scores with exact mismatches.

- [ ] **Step 4: Perform bounded corrections**

Correct one group per loop in this order: camera, silhouette/layout, structure, materials, lighting. Stop after the state-defined ceiling or when the reference-specific acceptance threshold is met.

- [ ] **Step 5: Verify the application**

Run: `npm test && npm run build`

Expected: all tests pass and Vite production build exits 0.

### Task 6: Commit and publish

**Files:**
- All files owned by Tasks 1–5, excluding unrelated user edits.

- [ ] **Step 1: Audit the diff**

Confirm `DashboardHeader.jsx` and `src/styles/index.css` are not included unless a model-specific integration change became necessary and can be separated from the user's pre-existing edits.

- [ ] **Step 2: Commit final evidence**

`git add` only the model, tests, img2threejs evidence, plan, and generated screenshots; commit with `feat: reconstruct factory campus from reference`.

- [ ] **Step 3: Push**

Run: `git push origin codex/img2threejs-factory-rebuild`.

- [ ] **Step 4: Report the GitHub branch and PR URL**

Provide the branch URL and the GitHub compare/PR link, noting any remaining single-view approximations.
