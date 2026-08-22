# Energy Detail Sidecars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add water, electricity, and steam second-level detail sidecars to the existing cockpit without moving, resizing, or replacing the central Blender campus model.

**Architecture:** Keep `App` as the single-page state owner with one nullable energy-detail key. Existing overview panels and the matching first three bottom metrics emit the same semantic open action; one reusable `EnergyDetailSidecar` renders resource-specific tabs, KPIs, trends, topology/equipment summaries, and alarms from a dedicated data contract. The sidecar overlays the existing dashboard edge while `IndustrialScene` remains mounted and receives no new camera or layout props.

**Tech Stack:** React 18, ECharts 5, CSS, Node test runner, React server rendering tests.

## Global Constraints

- Preserve the current Blender GLB, campus camera, building interactions, focus mode, traffic, and floor explosion behavior.
- Add no new runtime dependency and no new route; the second level is an in-page sidecar.
- Provide two entry points for each resource: its overview panel header and its corresponding bottom metric.
- Only one detail sidecar may be open at a time; close button and Escape return to the dashboard home state.
- Keep water/electricity cyan-blue and steam orange, consistent with the current cockpit.
- Do not commit or push until the user explicitly requests it.

---

### Task 1: Energy detail data contract

**Files:**
- Modify: `src/data/dashboard.js`
- Create: `tests/energyDetailData.test.js`

**Interfaces:**
- Produces: `energyDetailData` keyed by `water`, `power`, and `steam`, each with `title`, `tone`, `tabs`, `metrics`, `trend`, `breakdown`, `network`, and `alarms`.

- [ ] Write a failing test that imports `energyDetailData` and validates all three resources have complete, unit-bearing detail content and a non-empty alarm/network story.
- [ ] Run `node --test tests/energyDetailData.test.js` and confirm failure because the export does not exist.
- [ ] Add the minimum literal data contract in `src/data/dashboard.js`.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Reusable second-level sidecar

**Files:**
- Create: `src/components/EnergyDetailSidecar.jsx`
- Create: `tests/energyDetailSidecar.test.js`

**Interfaces:**
- Consumes: `{ resource, detail, activeTab, onTabChange, onClose }`.
- Produces: accessible dialog markup with `aria-modal="false"`, close action, tablist, KPI strip, trend visualization, network/equipment view, breakdown, and alarm list.

- [ ] Write failing static-render tests for water, power, and steam that assert resource-specific titles, tabs, units, close label, and non-modal dialog semantics.
- [ ] Run `node --test tests/energyDetailSidecar.test.js` and confirm failure because the component is missing.
- [ ] Implement the minimum reusable component with semantic buttons and CSS hooks.
- [ ] Re-run the focused test and confirm it passes.

### Task 3: Home-page entry points and state behavior

**Files:**
- Modify: `src/components/TechPanel.jsx`
- Modify: `src/components/WaterPanel.jsx`
- Modify: `src/components/PowerPanel.jsx`
- Modify: `src/components/SteamPanel.jsx`
- Modify: `src/components/BottomMetrics.jsx`
- Modify: `src/App.jsx`
- Create: `src/energyDetailState.js`
- Create: `tests/energyDetailState.test.js`
- Create: `tests/energyDetailEntryPoints.test.js`

**Interfaces:**
- Produces: `resolveEnergyDetail(current, action)` for open, switch, close, and Escape behavior.
- Extends panels with optional `onOpenDetails`; extends bottom metrics with optional `onMetricClick` and `detailKey`.

- [ ] Write failing state tests for opening one resource, switching directly to another, closing, and ignoring unsupported keys.
- [ ] Write failing static-render tests proving each resource has a visible `查看详情` button and the first three bottom metrics are buttons while the last two remain summaries.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement `resolveEnergyDetail`, wire App state and Escape handling, and add both entry paths without changing `IndustrialScene` props.
- [ ] Re-run focused tests and confirm they pass.

### Task 4: Sidecar visual system and responsive behavior

**Files:**
- Create: `src/styles/energy-detail.css`
- Modify: `src/styles/index.css`
- Modify: `README.md`

**Interfaces:**
- Consumes the `.energy-detail-*` hooks from `EnergyDetailSidecar`.
- Produces edge-specific open/close motion, resource tones, responsive stacking, visible focus treatment, and reduced-motion behavior.

- [ ] Add CSS for a 620px edge sidecar, cyan water/power identity, orange steam identity, compact SCADA grid, and a translucent scrim that does not capture pointer events over the campus.
- [ ] Keep the campus canvas and `IndustrialScene` layout untouched; sidecar layers above overview panels only.
- [ ] Add responsive rules for scaled 1920×1080 canvas and reduced-motion users.
- [ ] Document the home-to-detail interaction and the exact entry points in README.

### Task 5: Verification and visual review

**Files:**
- No production files.

- [ ] Run `npm test` and confirm all tests pass.
- [ ] Run `npm run build` and confirm production output succeeds.
- [ ] Run `git diff --check`.
- [ ] Open the running dashboard, verify water/power/steam entry points, direct switching, close/Escape, and confirm the campus camera and model do not move.
- [ ] Check browser console errors and capture a final screenshot for review.
