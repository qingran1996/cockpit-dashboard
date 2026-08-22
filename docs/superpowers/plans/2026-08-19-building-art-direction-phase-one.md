# Building Art Direction Phase One Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the approved factory-campus buildings distinct, credible architectural identities through a restrained material hierarchy and more dimensional daytime lighting without changing layout or interaction.

**Architecture:** Add a deterministic building-art palette resolver to the Blender generator and use it for wall shells and four-sided cladding. Extend the existing Web lighting mode state with explicit sky, ground, and key-light colors so the generated materials retain relief under the dashboard renderer.

**Tech Stack:** Blender 5.2 Python (`bpy`), glTF/GLB material export, Three.js lighting, Node test runner, Vite.

## Global Constraints

- Preserve every approved building position, footprint, height, road, sports court, parking area, gate, route, and landscape object.
- Preserve `BLDG__*` names, floor explosion, interior focus, campus focus, traffic, and gate behavior.
- Keep the official GLB at or below 20 MiB (20,971,520 bytes).
- Use a clean modern industrial-park art direction; do not introduce heavy rust, dereliction, or external texture requests.
- Continue in `/private/tmp/Cockpit-blender-graybox` on `codex/main-based-20260817`; do not commit, merge, or push during this phase.

---

### Task 1: Lock the architectural material hierarchy

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: `BUILDINGS`, `material(...)`, `create_wall_cladding(...)`, and existing `mats` dictionary.
- Produces: `building_art_palette(building_id, kind, mats) -> dict` with `direction`, `shell`, `panel_light`, and `panel_mid` entries.

- [ ] **Step 1: Write the failing generated-scene test**

Add a Blender integration test that opens the real generated `.blend` and asserts representative buildings export these independent identities:

```js
{
  'main-production-hall': ['modern-production', 'MAT__factory-wall', 'MAT__factory-panel-light'],
  'front-warehouse': ['warm-logistics', 'MAT__warehouse-wall', 'MAT__warehouse-panel-light'],
  'east-process-hall': ['process-blue-gray', 'MAT__process-wall', 'MAT__process-panel-light'],
  'far-east-utility': ['dark-utility', 'MAT__utility-wall', 'MAT__utility-panel-light'],
  laboratory: ['clean-technical', 'MAT__laboratory-wall', 'MAT__laboratory-panel-light'],
  administration: ['executive-stone', 'MAT__admin-stone', 'MAT__limestone-light'],
}
```

The test must inspect actual object material slots and `BLDG__*` `artDirection` extras, and verify representative diffuse colors are not identical.

- [ ] **Step 2: Run the focused Blender test and confirm RED**

Run against the current official asset with `BLENDER_TEST_BLEND`/`BLENDER_TEST_GLB`. Expected failure: missing `artDirection` or missing category material names.

- [ ] **Step 3: Implement the palette resolver and materials**

Create the exact material families above with restrained base-color and roughness differences. Resolve palettes by building function, assign the shell material in `create_building`, assign light/mid panels in `create_wall_cladding`, and export `root["artDirection"]`.

- [ ] **Step 4: Generate a temporary asset and confirm GREEN**

Generate to a fresh `/tmp/factory-art-phase-one.*` directory, run the focused test, and confirm the material identities survive Blender save and GLB export.

### Task 2: Improve daytime architectural lighting

**Files:**
- Modify: `src/scene/campusLightingMode.js`
- Modify: `tests/campusLightingMode.test.js`

**Interfaces:**
- Consumes: `deriveCampusLightingState(mode)` and `applyCampusLightingMode({ scene, renderer }, mode)`.
- Produces: lighting states with `hemisphereSkyColor`, `hemisphereGroundColor`, and `keyColor`, applied to `CampusHemisphere` and `CampusKey`.

- [ ] **Step 1: Write the failing Web lighting test**

Assert day mode uses a restrained neutral-blue sky, warmer directional key light, lower exposure than the current washed-out value, and that `applyCampusLightingMode` changes the real Three.js light colors.

- [ ] **Step 2: Run the focused test and confirm RED**

Run `node --test tests/campusLightingMode.test.js`. Expected failure: missing color state and unchanged light colors.

- [ ] **Step 3: Implement the lighting state**

Add explicit color fields for day/evening, reduce day exposure to preserve material value separation, and update named hemisphere/key lights without changing fixture emission or traffic behavior.

- [ ] **Step 4: Run the focused and project tests**

Run the lighting test, then `npm test`, and confirm all tests pass.

### Task 3: Visual QA and formal export

**Files:**
- Modify: `README.md`
- Update: `assets/blender/factory-campus-graybox.blend`
- Update: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Consumes: the temporary Blender candidate and existing Vite service on port 5180.
- Produces: verified official editable Blender source and Web GLB.

- [ ] **Step 1: Run complete temporary-asset verification**

Run all Blender model contract tests, check GLB byte size, and render overview plus representative administration/warehouse/process views.

- [ ] **Step 2: Check Web day and evening presentation**

Load the local page, inspect campus-only view in both lighting modes, and verify no browser warning/error appears.

- [ ] **Step 3: Export official assets and document the art direction**

Write the verified candidate to the official `.blend`/`.glb` paths and add a README paragraph describing the six architectural material identities and neutral-warm daytime lighting.

- [ ] **Step 4: Run final verification**

Run `npm test`, `npm run build`, the complete Blender suite against official assets, `git diff --check`, and verify no Blender process remains.
