# Building Floor Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every campus building an exported floor hierarchy and let operators click a building in the Web dashboard to inspect, isolate, and explode its floors.

**Architecture:** Store the authoritative floor labels and uses in `buildingRegistry.js`, generate matching `FLOOR__<building-id>__<floor-id>` nodes in Blender and the procedural fallback, and normalize those nodes when loading the GLB. A pure Three.js presentation function owns visibility, ghosting, selection, and exploded offsets; React owns only the selected building/floor UI state.

**Tech Stack:** Blender 5.2 Python API, glTF/GLB extras, Three.js r165, React 18, Node.js test runner, Playwright CLI.

## Global Constraints

- Preserve the approved building positions, dimensions, camera, and site layout.
- Do not use `img2threejs`.
- Every building must expose at least two navigable levels; the administration building must expose three occupied floors.
- Floor nodes must remain editable in Blender and discoverable after GLB import by deterministic names and metadata.
- The Web interaction must work with both the GLB and the procedural fallback.
- The floor panel must match the existing cyan/orange industrial cockpit and remain keyboard accessible.
- Respect `prefers-reduced-motion`; floor changes must still be understandable without animation.
- Do not commit, push, or merge without an explicit user instruction.

## Design Direction

- Subject: a chemical industrial-park digital twin for control-room operators.
- Page job: select a facility and understand its vertical operational spaces without leaving the overview.
- Palette: abyss `#020c17`, panel `#041828`, signal cyan `#19d7ff`, equipment orange `#ff7138`, normal green `#30e58d`, muted steel `#7898aa`.
- Type: existing PingFang SC for labels, DIN Alternate/Arial Narrow for level codes and readings.
- Layout: extend the existing facility card into a vertical floor-section rail; each level is a real selectable row, not decorative numbering.
- Signature: the model and the UI expand in the same vertical order, so the floor rail behaves like a live section drawing.

---

### Task 1: Define the floor data contract

**Files:**
- Modify: `src/scene/buildingRegistry.js`
- Modify: `tests/buildingRegistry.test.js`

**Interfaces:**
- Produces: `record.floors: Array<{ id: string, name: string, usage: string, level: number, tone: 'cyan' | 'orange' }>` for all twelve buildings.

- [ ] **Step 1: Write a failing registry test**

Assert that every building has at least two uniquely identified floors, floor levels are ascending, and administration exposes `L01`, `L02`, and `L03` with literal Chinese names.

- [ ] **Step 2: Run the focused test and observe the missing-floor failure**

Run: `node --test tests/buildingRegistry.test.js`

- [ ] **Step 3: Add explicit floor definitions**

Define operational names such as `生产作业层`, `设备夹层`, `办公层`, and `屋面设备层`; use `orange` only for equipment/roof levels.

- [ ] **Step 4: Run the focused test and observe a pass**

Run: `node --test tests/buildingRegistry.test.js`

### Task 2: Export editable floor spaces from Blender

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Consumes: Blender-side `BUILDING_FLOORS` matching the registry IDs.
- Produces: child empties named `FLOOR__<building-id>__<floor-id>` with `buildingId`, `floorId`, `floorName`, `usage`, `level`, and `interactive` extras; each owns a slab, a translucent space volume, and a compact service core.

- [ ] **Step 1: Write a failing Blender hierarchy test**

Generate the scene and inspect the GLB. Assert all expected floor nodes exist, administration has exactly three occupied floors, metadata survives export, and the approved camera/site values remain unchanged.

- [ ] **Step 2: Run the focused test and observe missing floor nodes**

Run: `node --test --test-name-pattern="floor hierarchy" tools/blender/create_factory_campus_graybox.test.js`

- [ ] **Step 3: Implement floor-space generation**

Add deterministic floor nodes and lightweight geometry inside each existing building root without moving or resizing the exterior shells.

- [ ] **Step 4: Run the focused test and observe a pass**

Run: `node --test --test-name-pattern="floor hierarchy" tools/blender/create_factory_campus_graybox.test.js`

### Task 3: Normalize floor nodes and implement Three.js presentation

**Files:**
- Create: `src/scene/floorInteraction.js`
- Create: `tests/floorInteraction.test.js`
- Modify: `src/scene/factoryCampusAsset.js`
- Modify: `src/scene/buildingFactory.js`
- Modify: `tests/factoryCampusAsset.test.js`

**Interfaces:**
- Produces: `prepareBuildingFloors(building, record)` and `applyFloorView(buildings, { buildingId, floorId, exploded })`.
- Behavior: unselected buildings show normal exteriors and hidden floor volumes; a selected building ghosts its exterior, shows floors, highlights one floor, and offsets levels vertically when exploded.

- [ ] **Step 1: Write failing real-object tests**

Use real Three.js groups/materials to assert GLB floor discovery, fallback floor creation, exterior ghosting/restoration, selected-floor emphasis, and deterministic exploded offsets.

- [ ] **Step 2: Run focused tests and observe missing behavior**

Run: `node --test tests/factoryCampusAsset.test.js tests/floorInteraction.test.js`

- [ ] **Step 3: Implement normalized floor preparation and presentation**

Clone floor/exterior materials per building, retain base material state in `userData`, and apply floor visibility/position changes without rebuilding the renderer.

- [ ] **Step 4: Run focused tests and observe a pass**

Run: `node --test tests/factoryCampusAsset.test.js tests/floorInteraction.test.js`

### Task 4: Add the operator floor panel and connect scene state

**Files:**
- Create: `src/components/BuildingFloorPanel.js`
- Create: `tests/buildingFloorPanel.test.js`
- Modify: `src/components/IndustrialScene.jsx`
- Modify: `src/hooks/useIndustrialScene.js`
- Modify: `src/styles/index.css`

**Interfaces:**
- Consumes: selected building and its `floors` registry data.
- Produces: accessible floor buttons, an `展开分层` / `合拢楼层` control, and a floor view object passed to `useIndustrialScene`.

- [ ] **Step 1: Write a failing server-rendered component test**

Render the floor panel to static markup and assert the building name, level codes, Chinese usages, pressed state, and expansion control labels.

- [ ] **Step 2: Run the focused test and observe the missing-component failure**

Run: `node --test tests/buildingFloorPanel.test.js`

- [ ] **Step 3: Implement the panel and state wiring**

Selecting a building chooses its first floor and opens exploded mode. Closing the card restores the complete exterior. Floor buttons update both the highlighted floor and the live region copy.

- [ ] **Step 4: Add restrained industrial styling**

Build the vertical section rail from existing design tokens, preserve focus visibility, and disable transform transitions under reduced motion.

- [ ] **Step 5: Run the focused test and observe a pass**

Run: `node --test tests/buildingFloorPanel.test.js`

### Task 5: Regenerate and verify the complete experience

**Files:**
- Modify: `docs/BLENDER_GRAYBOX.md`
- Create: `output/playwright/factory-campus-floor-overview.png`
- Create: `output/playwright/factory-campus-floor-expanded.png`

**Interfaces:**
- Produces: regenerated Blender/GLB assets, documentation for the node contract, and browser screenshots of overview and expanded-floor states.

- [ ] **Step 1: Regenerate the production BLEND and GLB**

Run the documented Blender background command with the production output paths.

- [ ] **Step 2: Run complete automated verification**

Run:

```bash
node --test tools/blender/create_factory_campus_graybox.test.js
npm test
npm run build
```

- [ ] **Step 3: Validate the real browser interaction**

Start Vite on port `5180`, open it with Playwright CLI, snapshot, click a visible building, select another floor, toggle collapse/expand, and capture both screenshots in `output/playwright/`.

- [ ] **Step 4: Reload the final Blender file**

Use Computer Use to reopen `assets/blender/factory-campus-graybox.blend` and leave Blender showing the final model.

## Self-Review

- Spec coverage: Blender hierarchy, GLB extras, fallback behavior, click selection, floor selection, exploded/collapsed view, accessibility, documentation, browser validation, and layout preservation each map to a task.
- Placeholder scan: all production behavior, commands, paths, data shapes, and expected states are explicit.
- Interface consistency: registry floor IDs are the shared key used in Blender names, GLB extras, Three.js presentation state, and React button state.
