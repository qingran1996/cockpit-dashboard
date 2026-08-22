# Campus Advanced Lighting Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let operators adjust every day/evening campus lighting family from a compact advanced console while retaining safe defaults, independent mode memory, and one-click reset.

**Architecture:** Extract the approved day/evening base states into a schema-backed profile module. `App` owns independent profiles and sunlight values; `IndustrialScene` renders a controlled advanced panel and passes the active profile to the Three.js hook. The lighting applicator sanitizes values before changing renderer, atmosphere, light colors/intensities, sun direction, shadows, fixtures, and bloom.

**Tech Stack:** React, Three.js, CSS, Node test runner.

## Global Constraints

- Preserve default evening mode, default sunlight values, and the current approved appearance before any operator adjustment.
- Day and evening profiles remain independent in memory.
- Every numeric and color input is sanitized against an explicit safe range.
- The advanced panel is closed by default and must not overlap its own scene-control dock.
- Provide “恢复当前模式” and “全部恢复” actions.
- Do not commit, push, or merge without explicit user instruction.

## Design Direction

- Subject: a digital-twin lighting commissioning console used by energy-control operators.
- Palette: control navy `#031927`, signal cyan `#19d7ff`, telemetry white `#d7fbff`, solar amber `#ffc56e`, warning orange `#ff8a45`, muted blue `#5e91a2`.
- Type: existing condensed DIN data face for values; existing UI sans-serif for operational labels.
- Layout:

```text
┌ 光照参数 · 傍晚                         实时应用 × ┐
│ [日光] [环境] [天空氛围] [厂区灯具]                 │
│ 太阳主光        0.74     ─────●────                │
│ 太阳高度          42°     ───●──────                │
│ 太阳方位         135°     ──────●──                │
│ 光源色温       [ warm color swatch ]              │
│                                                     │
│ 恢复当前模式                           全部恢复      │
└─────────────────────────────────────────────────────┘
```

- Signature: a thin “solar vector” indicator beside sun elevation/azimuth, linking the controls to the actual directional light rather than looking like a generic settings form.
- Self-critique: all controls are available, but only one functional group is visible at a time; no modal, no oversized card, no decorative chart unrelated to commissioning.

---

### Task 1: Safe Profile Contract

**Files:**
- Create: `src/scene/campusLightingProfiles.js`
- Create: `tests/campusLightingProfiles.test.js`
- Modify: `src/scene/campusLightingMode.js`

**Interfaces:**
- Produces: `CAMPUS_LIGHTING_PARAMETER_GROUPS`, `createCampusLightingProfiles()`, `resolveCampusLightingProfile(profiles, mode)`, `updateCampusLightingProfile(profiles, mode, key, value)`, `resetCampusLightingProfile(profiles, mode)`.
- Consumes: the approved day/evening numeric and color defaults currently in `campusLightingMode.js`.

- [x] **Step 1: Write failing tests proving day/evening independence, numeric clamping, color parsing, immutable updates, and reset**
- [x] **Step 2: Run the focused test and verify RED because the profile module is missing**
- [x] **Step 3: Implement the schema, defaults, sanitizers, immutable update, resolve, and reset helpers**
- [x] **Step 4: Make `deriveCampusLightingState` consume the resolved default profile without changing existing default-state assertions**
- [x] **Step 5: Re-run profile and lighting tests and verify GREEN**

### Task 2: Full Three.js Parameter Application

**Files:**
- Modify: `src/scene/campusLightingMode.js`
- Modify: `src/scene/campusPostProcessing.js`
- Modify: `src/hooks/useIndustrialScene.js`
- Modify: `tests/campusLightingMode.test.js`
- Modify: `tests/campusPostProcessing.test.js`

**Interfaces:**
- Consumes: `lightingProfile` and `sunlightPercent`.
- Produces: live sun azimuth/elevation, shadow radius, independent fog color, all light intensities/colors, environment values, renderer exposure, and bounded bloom strength.

- [x] **Step 1: Add failing tests for custom sun position, fog color, light color/intensity, fixture intensity, exposure, and bloom**
- [x] **Step 2: Run focused tests and verify RED against the current preset-only implementation**
- [x] **Step 3: Merge a sanitized profile into `deriveCampusLightingState(mode, sunlightPercent, profile)`**
- [x] **Step 4: Apply sun direction and shadow softness to `CampusKey`, and pass custom bloom strength into post-processing**
- [x] **Step 5: Keep the active profile in a hook ref and reapply when it changes**
- [x] **Step 6: Re-run focused tests and verify GREEN**

### Task 3: Advanced Lighting Panel

**Files:**
- Create: `src/components/AdvancedLightingPanel.js`
- Create: `tests/advancedLightingPanel.test.js`
- Modify: `src/components/SunlightControl.js`
- Modify: `src/components/IndustrialScene.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `{ open, mode, profile, groups, activeGroup, onToggle, onGroupChange, onParameterChange, onResetMode, onResetAll }`.
- Produces: accessible tabbed controls with numeric ranges, color inputs, live values, close, and two reset actions.

- [x] **Step 1: Add failing server-render tests for collapsed/expanded state, four tabs, real parameter controls, mode label, and reset actions**
- [x] **Step 2: Run the focused component test and verify RED because the panel is missing**
- [x] **Step 3: Implement the controlled panel and add the advanced toggle to the sunlight instrument**
- [x] **Step 4: Lift profile state and reset handlers into `App`, pass the active profile through `IndustrialScene`**
- [x] **Step 5: Re-run focused component tests and verify GREEN**

### Task 4: Instrument Styling and Acceptance

**Files:**
- Modify: `src/styles/index.css`
- Modify: `src/styles/energy-detail.css`
- Modify: `README.md`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: a compact non-modal commissioning drawer in homepage, detail, and focus views.

- [x] **Step 1: Style the panel as a 336px commissioning drawer opening above/left of the control dock with one visible group at a time**
- [x] **Step 2: Run all Node tests and the production build**
- [x] **Step 3: Inspect homepage, energy-detail, and campus-focus layouts in Chrome**
- [x] **Step 4: Adjust at least one parameter in each group, switch modes to verify independent memory, then run both reset actions**
- [x] **Step 5: Verify keyboard focus, Escape/close behavior, and restore the browser to default evening**
- [x] **Step 6: Document the advanced lighting console in README**
