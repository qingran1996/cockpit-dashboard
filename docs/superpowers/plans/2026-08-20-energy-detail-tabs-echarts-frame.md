# Energy Detail Tabs, ECharts, and Frame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every secondary-page tab render distinct operational data, keep the factory model unobstructed, and upgrade static frames with restrained animated energy effects and ECharts.

**Architecture:** Add a resource-specific `tabViews` contract to the existing detail data and select it through a pure `resolveEnergyTabView(detail, activeTab)` function. Render the active view through a reusable ECharts component while preserving the existing detail shell. Separate the 3D scene from the central data deck by ending the scene exactly where the tab deck begins.

**Tech Stack:** React, ECharts, CSS animations, Node test runner, Vite.

## Global Constraints

- The central factory model remains interactive and must not sit beneath opaque detail panels.
- Every visible tab changes at least the main metrics, chart title, chart series, and context summary.
- Water, electricity, and steam retain resource-specific terminology and color.
- Animated frames respect `prefers-reduced-motion`.

---

### Task 1: Create tab-specific data views

**Files:**
- Modify: `src/data/dashboard.js`
- Create: `src/energyDetailTabView.js`
- Test: `tests/energyDetailTabView.test.js`

**Interfaces:**
- Produces: `resolveEnergyTabView(detail, activeTab)` returning `{ metrics, diagnostics, chart, context }`.

- [ ] Write a failing test asserting power `总览`, `负荷`, `需量`, `电能质量`, and `设备` return different chart titles and first metric labels.
- [ ] Run the focused test and confirm the resolver is missing.
- [ ] Add `tabViews` for every declared water, electricity, and steam tab.
- [ ] Implement fallback to `总览` for unknown tabs.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Render active ECharts content

**Files:**
- Create: `src/components/EnergyDetailEChart.js`
- Modify: `src/components/EnergyDetailSidecar.js`
- Test: `tests/energyDetailSidecar.test.js`

**Interfaces:**
- Consumes: active tab view chart `{ type, title, unit, labels, values, secondary, threshold }`.
- Produces: an accessible `.energy-detail-echart` region and tab-specific metrics/context.

- [ ] Write a failing server-render test comparing power `负荷` and `电能质量` output.
- [ ] Add an ECharts component supporting line, bar, and mixed series.
- [ ] Replace the static detail trend renderer with active ECharts content.
- [ ] Re-run sidecar tests and confirm tab content differs.

### Task 3: Separate model and upgrade animated frames

**Files:**
- Modify: `src/styles/index.css`
- Modify: `src/styles/energy-detail.css`

**Interfaces:**
- Produces: scene bottom at 538px while detail deck starts at 538px.
- Produces: active perimeter flow, corner emitters, scan glint, and tab-switch reveal effects.

- [ ] Set the open-detail scene height to `385px` so `153px + 385px = 538px`.
- [ ] Add a two-line animated perimeter and corner emitter only to major modules.
- [ ] Add chart reveal and tab deck transition without animating every row.
- [ ] Disable all new motion under reduced-motion preference.

### Task 4: Verify all resources

**Files:**
- Verify: `tests/*.test.js`
- Verify: production build and `http://localhost:5180/`

- [ ] Run the complete test suite and Vite build.
- [ ] Click every water, electricity, and steam tab and confirm chart title/data changes.
- [ ] Confirm the 3D scene bottom does not overlap the tab deck.
- [ ] Capture screenshots and confirm zero browser console warnings or errors.
