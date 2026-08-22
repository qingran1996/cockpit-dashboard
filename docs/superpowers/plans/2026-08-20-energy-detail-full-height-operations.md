# Energy Detail Full-Height Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the water, electricity, and steam secondary pages as full-height operational workspaces with no large unused bottom region.

**Architecture:** Extend the shared `energyDetailData` contract with resource-specific equipment health and seven-day forecasts. Render one shared full-width operations footer from real detail data, then rebalance the existing upper analysis zones with CSS while preserving the central factory model and resource switching.

**Tech Stack:** React `createElement`, CSS, Node test runner, Vite, browser visual verification.

## Global Constraints

- Preserve the central factory model and existing detail open, close, tab, and resource-switch behavior.
- Water, electricity, and steam use the same structural grid but keep resource-specific terminology, values, and tone.
- Fill the secondary-page canvas to the bottom without overlapping content or introducing page scrolling.
- Use three border strengths only: workspace frame, module frame, internal divider.

---

### Task 1: Extend the resource data contract

**Files:**
- Modify: `src/data/dashboard.js`
- Test: `tests/energyDetailData.test.js`

**Interfaces:**
- Produces: `detail.health: Array<{label,value,percent,status}>`
- Produces: `detail.forecast: {title,unit,values,summary}`

- [ ] Write a failing contract test requiring four health rows and seven forecast values per resource.
- [ ] Run `node --test tests/energyDetailData.test.js` and confirm the missing fields fail.
- [ ] Add water, electricity, and steam health and forecast records.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Render the full-width operations footer

**Files:**
- Modify: `src/components/EnergyDetailSidecar.js`
- Test: `tests/energyDetailSidecar.test.js`

**Interfaces:**
- Consumes: `detail.breakdown`, `detail.workOrders`, `detail.health`, `detail.forecast`
- Produces: `EnergyOperationsFooter` with ranking, closure, health, and forecast modules.

- [ ] Write a failing render test requiring the four operational module labels and seven forecast bars.
- [ ] Run `node --test tests/energyDetailSidecar.test.js` and confirm the footer is missing.
- [ ] Implement the shared footer with resource-specific titles.
- [ ] Re-run the focused render tests and confirm they pass.

### Task 3: Rebalance the full-height layout

**Files:**
- Modify: `src/styles/energy-detail.css`

**Interfaces:**
- Consumes: `.energy-detail__operations-footer` and its four child modules.
- Produces: a 936px-tall detail workspace with an upper 670px analysis region and a 256px bottom operations region.

- [ ] Reduce the upper factory and side analysis region to end at 670px.
- [ ] Position the footer at 680px with 256px height and full 1864px width.
- [ ] Style compact ranking, work-order, health, and forecast modules with consistent frames and dividers.
- [ ] Add reduced-motion handling for footer entrance animation.

### Task 4: Verify behavior and visual density

**Files:**
- Verify: `tests/*.test.js`
- Verify: production build
- Verify: `http://localhost:5180/`

- [ ] Run the complete test suite and production build.
- [ ] Open water, electricity, and steam details and confirm all four footer modules are visible.
- [ ] Audit horizontal and vertical overflow for the detail workspace and footer children.
- [ ] Capture screenshots and inspect browser console warnings and errors.
