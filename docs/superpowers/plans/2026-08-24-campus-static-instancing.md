# Campus Static Instancing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce campus draw calls without changing visible geometry, materials, textures, lighting, shadows, animations, building selection, or floor explosion behavior.

**Architecture:** Convert repeated opaque static sibling meshes that share geometry, material, semantic quality tags, and render state into one Three.js `InstancedMesh`. Restrict each batch to a single direct parent so floor roots, inspection visibility groups, buildings, and animation hierarchies remain independent; exclude transparent, transmission, animated, skinned, morph-target, light-role, and gate-reader meshes.

**Tech Stack:** Three.js 0.165, React 18, Node built-in test runner, Vite 5.

## Global Constraints

- Do not change the GLB, Blender source, PBR textures, material parameters, lighting, shadows, DPR, or post-processing.
- Do not batch across direct parents, buildings, floor roots, or animated hierarchies.
- Preserve world transforms, visibility tiers, detail tiers, vegetation roles, render order, layers, and material identity.
- Preserve building hover, click selection, material laboratory, floor explosion, focused-floor cutaway, vehicles, people, gates, and robot animation.

---

### Task 1: Static instancing optimizer

**Files:**
- Create: `src/scene/campusStaticInstancing.js`
- Create: `tests/campusStaticInstancing.test.js`

**Interfaces:**
- Consumes: a loaded Three.js campus root.
- Produces: `optimizeCampusStaticInstances(root)` returning `{ sourceMeshes, instancedMeshes, instancedObjects, drawCallsSaved }`.

- [ ] Write failing tests for transform preservation and repeated sibling batching.
- [ ] Write failing tests that prevent cross-parent, animated, transparent, transmission, and incompatible semantic batching.
- [ ] Run the focused test and verify the missing implementation failure.
- [ ] Implement the minimal safe optimizer.
- [ ] Run the focused test and verify it passes.

### Task 2: Factory campus integration

**Files:**
- Modify: `src/scene/factoryCampusAsset.js`
- Modify: `tests/factoryCampusAsset.test.js`

**Interfaces:**
- Consumes: `optimizeCampusStaticInstances(root)` before building floor materials are cloned.
- Produces: prepared campus data with `instancingStats` and unchanged existing public records.

- [ ] Add a failing asset test proving repeated static siblings become instances while floor and animated hierarchies remain intact.
- [ ] Integrate the optimizer before floor preparation.
- [ ] Expose diagnostic statistics on the prepared asset and root `userData`.
- [ ] Run focused tests and verify they pass.

### Task 3: Full verification

**Files:**
- No production files beyond Tasks 1–2.

- [ ] Run the full test suite.
- [ ] Run the production build.
- [ ] Inspect the generated runtime scene statistics and confirm the GLB file is unchanged.
- [ ] Browser-test model load, camera drag, building click, floor explosion, and console errors.
- [ ] Inspect the final diff and confirm no quality configuration changed.
