# Campus Sunlight Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an accessible real-time sunlight intensity control above the campus day/evening switch, with a separately remembered value for each lighting mode.

**Architecture:** Keep per-mode sunlight percentages in `App`, render one focused instrument control in `IndustrialScene`, and pass the active percentage into the Three.js lighting policy. `campusLightingMode` remains the single owner of renderer/light values; the new percentage only scales daylight energy and exposure, leaving operational fixture behavior mode-specific.

**Tech Stack:** React, Three.js, CSS, Node test runner.

## Global Constraints

- Preserve the current default evening mode and current approved appearance at the default percentages.
- Day and evening remember independent sunlight values.
- Clamp every sunlight value to `0..100` before it reaches UI or Three.js.
- Keep the control usable by mouse and keyboard and readable in homepage, detail, and campus-focus layouts.
- Do not commit, push, or merge without explicit user instruction.

## Design Direction

- Subject: an industrial energy operations cockpit; operators adjust simulated solar contribution while inspecting a digital twin.
- Palette: instrument navy `#031927`, signal cyan `#19d7ff`, daylight white `#d7fbff`, solar amber `#ffc56e`, muted telemetry `#5e91a2`.
- Type: existing DIN/Arial Narrow data face for percentages and existing UI sans-serif for labels.
- Layout:

```text
┌─────────────── sunlight instrument ───────────────┐
│  ☼  阳光强度                    42%              │
│     ───────────────●──────────────               │
│       [ 日间 ]             [ 傍晚 ]              │
└───────────────────────────────────────────────────┘
```

- Signature: the slider thumb is a restrained amber “solar aperture” with a short cyan-to-amber energy trail; it is the only warm accent in the scene-control cluster.
- Self-critique: avoid a generic detached range input by making the percentage, track fill, and mode buttons one compact instrument; do not add another decorative frame or animation.

---

### Task 1: Sunlight State Contract

**Files:**
- Create: `src/scene/campusSunlight.js`
- Create: `tests/campusSunlight.test.js`

**Interfaces:**
- Produces: `DEFAULT_CAMPUS_SUNLIGHT`, `clampCampusSunlight(value)`, `resolveCampusSunlight(values, mode)`, and `updateCampusSunlight(values, mode, value)`.
- Consumes: lighting modes `day | evening`.

- [x] **Step 1: Write failing tests for clamping and independent per-mode memory**

```js
assert.equal(module.clampCampusSunlight(180), 100)
assert.equal(module.clampCampusSunlight(-20), 0)
assert.deepEqual(module.updateCampusSunlight({ day: 78, evening: 42 }, 'evening', 61), { day: 78, evening: 61 })
```

- [x] **Step 2: Run `node --test tests/campusSunlight.test.js` and verify RED because the module is missing**
- [x] **Step 3: Implement the four small pure helpers with defaults `{ day: 78, evening: 42 }`**
- [x] **Step 4: Re-run the focused test and verify GREEN**

### Task 2: Lighting Policy Integration

**Files:**
- Modify: `src/scene/campusLightingMode.js`
- Modify: `src/hooks/useIndustrialScene.js`
- Modify: `tests/campusLightingMode.test.js`

**Interfaces:**
- Consumes: `sunlightPercent` from the React scene props.
- Produces: `deriveCampusLightingState(mode, sunlightPercent)` and `applyCampusLightingMode(controller, mode, sunlightPercent)`.

- [x] **Step 1: Add a failing test proving 100% produces more key light/exposure than 0%, while operational fixture intensity remains mode-owned**
- [x] **Step 2: Run `node --test tests/campusLightingMode.test.js` and verify RED against the current fixed lighting state**
- [x] **Step 3: Scale key, hemisphere, facade ambient, environment intensity, shadow fill, and exposure around each mode's approved default percentage; retain existing values at the default**
- [x] **Step 4: Store the active percentage in a hook ref and reapply lighting when either mode or sunlight changes**
- [x] **Step 5: Re-run the focused lighting tests and verify GREEN**

### Task 3: Accessible Sunlight Instrument

**Files:**
- Create: `src/components/SunlightControl.js`
- Create: `tests/sunlightControl.test.js`
- Modify: `src/App.jsx`
- Modify: `src/components/IndustrialScene.jsx`
- Modify: `src/styles/index.css`
- Modify: `src/styles/energy-detail.css`
- Modify: `src/homepagePanelLayout.js`
- Modify: `src/energyDetailWorkspaceLayout.js`
- Modify: `tests/homepageSceneControls.test.js`

**Interfaces:**
- Consumes: `{ value, mode, onChange, onModeChange }`.
- Produces: one labelled range input and the existing two mode buttons in a unified `.scene-lighting-console`.

- [x] **Step 1: Add failing server-render tests for the slider label, `0..100` range, live percentage, and active mode buttons**
- [x] **Step 2: Update layout expectations so traffic moves above the taller lighting console, then verify focused tests are RED**
- [x] **Step 3: Implement `SunlightControl` and lift `{ day, evening }` sunlight state into `App`**
- [x] **Step 4: Add the compact cyan/amber instrument styling and update homepage/detail traffic offsets**
- [x] **Step 5: Re-run component and layout tests and verify GREEN**

### Task 4: Acceptance

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: documented and verified sunlight control.

- [x] **Step 1: Run all Node tests**
- [x] **Step 2: Run the production build**
- [x] **Step 3: Inspect homepage and campus-focus views in Chrome; exercise 0%, default, and 100% in day and evening**
- [x] **Step 4: Confirm keyboard accessibility and no control overlap**
- [x] **Step 5: Document the per-mode sunlight control in README**
