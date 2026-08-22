# Energy Detail Visual Density Implementation Plan

**Goal:** Replace the homepage detail buttons with integrated energy guide rails, then unify and enrich the water, electricity, and steam secondary workspaces without changing the factory model or resource-switching behavior.

**Architecture:** Keep `EnergyDetailSidecar` as the shared secondary-page shell. Extend the existing resource data contract with compact operational diagnostics, derive trend summaries in the view layer, and use one hierarchy of frame tokens in CSS so all three resources share structure while retaining their own tone.

**Tech Stack:** React `createElement`, CSS, Vitest, Vite, Playwright.

---

### Task 1: Integrate the homepage detail entry

**Files:**
- Modify: `src/components/EnergyDetailEntryButton.js`
- Modify: `src/styles/energy-detail.css`
- Test: `tests/energyDetailEntryPoints.test.js`

1. Change visible copy from `查看详情` to `运行详情` while preserving the accessible resource-specific label.
2. Add a guide-line element and a dedicated arrow element.
3. Remove the boxed-button treatment and implement a rail, endpoint glow, hover travel, and underline focus state.

### Task 2: Expand the detail data contract

**Files:**
- Modify: `src/data/energyDetailData.js`
- Test: `tests/energyDetailData.test.js`

1. Add six decision-oriented diagnostics to every resource.
2. Validate diagnostic labels, values, and tone/status fields in tests.

### Task 3: Increase secondary-page information density

**Files:**
- Modify: `src/components/EnergyDetailSidecar.js`
- Test: `tests/energyDetailSidecar.test.js`

1. Add derived trend summaries for latest value, peak, average, and comparison.
2. Add explicit breakdown shares and network/alarm summaries.
3. Render the new operational diagnostic rail between primary metrics and benchmark comparison.

### Task 4: Unify secondary-page borders and layout

**Files:**
- Modify: `src/styles/energy-detail.css`

1. Establish three border strengths: workspace frame, analysis frame, and internal divider.
2. Align the central tabs, metrics, diagnostics, and benchmark band.
3. Standardize spacing and typography across water, electricity, and steam while preserving resource colors.

### Task 5: Verify behavior and visuals

**Files:**
- Verify: `tests/*.test.js`
- Verify: production build
- Verify: local page at `http://localhost:5180/`

1. Run focused tests after each behavior change, then the complete suite.
2. Run the production build.
3. Capture water, electricity, and steam secondary-page screenshots and inspect console errors.
