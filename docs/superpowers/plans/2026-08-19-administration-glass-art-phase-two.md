# Administration Glass Art Phase Two Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved administration building into a convincing campus landmark by adding glass depth, a visible warm lobby, refined stone joints, and an illuminated ceremonial canopy while preserving the existing site layout and Web interactions.

**Architecture:** Extend the procedural Blender material helper with optional emissive controls, add dedicated administration glazing and lobby materials, then construct a shallow but readable interior scene behind the existing atrium glass. Keep every new object under `BLDG__administration` so building selection, floor explosion, and campus-focus behavior remain compatible.

**Tech Stack:** Blender 5.2 Python (`bpy`), glTF/GLB material export, Node test runner, Vite.

## Global Constraints

- Preserve all approved building positions, footprints, heights, roads, gates, courts, parking, traffic, and landscape objects.
- Preserve every `BLDG__*` name and the existing floor explosion, interior focus, traffic, gate, and campus-focus interactions.
- Keep the official GLB at or below 20 MiB (20,971,520 bytes).
- Use procedural geometry and embedded PBR values only; add no external texture dependency.
- Limit this phase to the administration landmark and static architectural lighting; do not implement a full campus night-lighting system.
- Continue in `/private/tmp/Cockpit-blender-graybox` on `codex/main-based-20260817`; do not commit, merge, or push during this phase.

---

### Task 1: Lock the administration landmark contract

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`

- [ ] Add a Blender integration test for dedicated atrium glass, recessed lobby geometry, reception furniture, stone joints, canopy soffit, and linear lights.
- [ ] Assert that every new object is parented to `BLDG__administration` and has non-zero geometry.
- [ ] Assert physically plausible material thresholds for transmission, coat, roughness, and warm emission.
- [ ] Run the focused test against the current official asset and confirm it fails for the new contract.

### Task 2: Build glass depth and visible lobby detail

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`

- [ ] Extend `material(...)` with optional emission color and strength.
- [ ] Add `MAT__admin-glass` and `MAT__lobby-glow` to the generated material library.
- [ ] Use the dedicated glazing on the atrium, administration windows, and roof lantern.
- [ ] Create a recessed lobby backdrop and floor, entry doors, reception desk, lounge furniture, and planters behind the glass.
- [ ] Add stone reveal joints, a dark canopy soffit, and warm linear canopy luminaires.

### Task 3: Generate, inspect, and promote the asset

**Files:**
- Update: `assets/blender/factory-campus-graybox.blend`
- Update: `public/models/factory-campus-graybox.glb`

- [ ] Generate the candidate to a fresh temporary directory with one Blender process.
- [ ] Run the focused and complete Blender contract suites on the candidate.
- [ ] Render an administration close view and a campus overview, then inspect glass depth, entrance hierarchy, and clipping.
- [ ] Promote the verified candidate to the official editable `.blend` and Web `.glb` paths.

### Task 4: Document and verify the Web result

**Files:**
- Modify: `README.md`

- [ ] Document the phase-two administration materials and visible lobby treatment.
- [ ] Check the local Web app in daytime and evening modes and confirm the administration building remains selectable and explodable.
- [ ] Run `npm test`, `npm run build`, the complete Blender suite against official assets, `git diff --check`, GLB size verification, and confirm no Blender process remains.
