# Homepage Visual Reconstruction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruct the approved 1920×1080 EMS homepage mockup while preserving the existing interactive Blender campus and all second-level energy interactions.

**Architecture:** Keep `App` and the 3D scene lifecycle intact. Extend the existing dashboard data contract, reshape the three resource panels into dense operating summaries, and restyle the fixed 1920×1080 canvas to match the approved composition. Existing detail-entry callbacks remain the only connection between the homepage and second-level pages.

**Tech Stack:** React 18, ECharts 5, CSS, Node test runner, Three.js scene retained unchanged.

## Global Constraints

- Do not modify the Blender source, GLB asset, Three.js factory asset, camera, or campus interaction logic.
- Preserve clickable water, power, steam detail entry points and bottom metric shortcuts.
- Match the approved deep-navy, cyan and steam-orange art direction at the 1920×1080 design resolution.
- Keep the central campus visible and interactive; homepage panels may frame but must not replace it.
- Respect `prefers-reduced-motion` and preserve keyboard focus visibility.

---

### Task 1: Dense homepage data contract

**Files:**
- Modify: `src/data/dashboard.js`
- Test: `tests/homepageDashboardData.test.js`

**Interfaces:**
- Produces: `dashboardData.water.summary`, `dashboardData.water.districts`, `dashboardData.power.summary`, `dashboardData.power.transformers`, `dashboardData.steam.summary`, `dashboardData.steam.boilerStates`.

- [ ] Write contract tests for the four summary metrics, operational breakdowns, equipment health and concise alerts shown in the approved mockup.
- [ ] Run `node --test tests/homepageDashboardData.test.js` and confirm the missing contracts fail.
- [ ] Add literal homepage operating data without changing the existing second-level detail contract.
- [ ] Run the focused test and confirm it passes.

### Task 2: Water and power operating panels

**Files:**
- Modify: `src/components/WaterPanel.jsx`
- Modify: `src/components/PowerPanel.jsx`
- Modify: `src/data/dashboard.js`
- Test: `tests/homepageResourcePanels.test.js`

**Interfaces:**
- Consumes: Task 1 dashboard contracts and existing `onOpenDetails` callbacks.
- Produces: Dense water and power panels with summary rows, 24-hour charts, distribution bars, equipment health, cost/quality information and alerts.

- [ ] Write server-rendering tests that assert the operator-visible content and detail buttons for both panels.
- [ ] Run the focused test and confirm the old panels fail it.
- [ ] Implement the new semantic panel markup and update the two chart options to contain comparison/threshold series.
- [ ] Run the focused test and confirm it passes.

### Task 3: Steam operating panel and summary rail

**Files:**
- Modify: `src/components/SteamPanel.jsx`
- Modify: `src/components/CampusEnergyPulse.js`
- Modify: `src/components/BottomMetrics.js`
- Test: `tests/homepageSteamAndRails.test.js`

**Interfaces:**
- Consumes: Task 1 dashboard contracts and existing click callbacks.
- Produces: Compact horizontal steam workspace, six-signal live rail and five-metric footer matching the reference.

- [ ] Write server-rendering tests for four steam KPIs, four boiler states, efficiency, cost, warning, live signals and footer labels.
- [ ] Run the focused test and confirm the current markup fails.
- [ ] Implement the steam summary and refine rail/footer copy while keeping interactive metric buttons.
- [ ] Run the focused test and confirm it passes.

### Task 4: 1920×1080 visual reconstruction

**Files:**
- Modify: `src/components/DashboardHeader.jsx`
- Modify: `src/styles/index.css`
- Modify: `src/styles/panels.css`
- Modify: `src/styles/energy-detail.css`
- Test: `tests/homepageHeader.test.js`

**Interfaces:**
- Produces: Reference-matched header, panel geometry, central scene framing, energy-flow rail and reduced-motion-safe animation.

- [ ] Write a header rendering test for online state, updated time label, platform title and daytime mode.
- [ ] Run the focused test and confirm the current weather header fails.
- [ ] Implement the header structure and derive all layout, typography, panel, chart and rail styles from the approved token system.
- [ ] Run the focused test and confirm it passes.

### Task 5: Integration verification and visual QA

**Files:**
- Create: `output/playwright/homepage-reference-reconstruction.png`

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: A verified build and a 1920×1080 browser screenshot for visual comparison.

- [ ] Run `npm test` and require zero failures.
- [ ] Run `npm run build` and require exit code 0.
- [ ] Open the homepage at 1920×1080, confirm no console errors, and capture the screenshot.
- [ ] Compare the screenshot against the approved mockup; correct overflow, spacing, hierarchy or scene obstruction, then repeat verification.
