# Web Unity Render Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reversible “科技 / Unity” render-style switch that changes only the Three.js factory-campus presentation and never modifies the Blender, GLB, or FBX assets.

**Architecture:** Keep the selected style in `App`, pass it through `IndustrialScene` into the existing lighting hook, and resolve it in a new pure render-style policy module. The Unity policy transforms the active day/evening lighting profile and renderer tone mapping at runtime, while the cockpit policy remains an identity transform so the current appearance is preserved exactly.

**Tech Stack:** React 18, Three.js r165, Node test runner, Vite.

## Global Constraints

- The switch affects only the 3D campus canvas.
- Do not edit Blender source files, GLB files, FBX files, Unity files, or energy dashboard panels.
- Preserve the active sunlight slider and day/evening modes in both render styles.
- Switching back to “科技” must restore the current render policy without reloading the page.

---

### Task 1: Render-style policy

**Files:**
- Create: `src/scene/campusRenderStyle.js`
- Modify: `src/scene/campusLightingMode.js`
- Test: `tests/campusRenderStyle.test.js`

**Interfaces:**
- Produces: `CAMPUS_RENDER_STYLES`, `DEFAULT_CAMPUS_RENDER_STYLE`, `normalizeCampusRenderStyle(style)`, `applyCampusRenderStyleToLightingState(state, style, mode)`, and `resolveCampusRendererPolicy(style)`.
- Consumes: resolved day/evening lighting state from `campusLightingProfiles.js`.

- [x] **Step 1: Write failing policy tests**

Assert that cockpit is an identity profile, Unity uses neutral tone mapping, warmer sunlight, brighter three-tone ambient fill, softer fog, restrained reflections, and invalid values normalize to cockpit.

- [x] **Step 2: Run the focused tests and verify RED**

Run: `node --test tests/campusRenderStyle.test.js`

Expected: FAIL because `campusRenderStyle.js` does not exist.

- [x] **Step 3: Implement the pure style policy**

Use explicit numeric/color policies derived from the current Unity scene setup. Return new objects instead of mutating the user’s active lighting profile.

- [x] **Step 4: Integrate the style with live lighting**

Extend `deriveCampusLightingState`, `resolveCampusBackdrop`, and `applyCampusLightingMode` with a final optional `renderStyle` argument. Apply `THREE.NeutralToneMapping` only for Unity and preserve `THREE.ACESFilmicToneMapping` for cockpit.

- [x] **Step 5: Run focused lighting tests and verify GREEN**

Run: `node --test tests/campusRenderStyle.test.js tests/campusLightingMode.test.js`

Expected: PASS.

### Task 2: Accessible style switch and state wiring

**Files:**
- Modify: `src/components/SunlightControl.js`
- Modify: `src/components/IndustrialScene.jsx`
- Modify: `src/App.jsx`
- Modify: `src/hooks/useIndustrialScene.js`
- Test: `tests/sunlightControl.test.js`

**Interfaces:**
- Consumes: `DEFAULT_CAMPUS_RENDER_STYLE` and the policy interfaces from Task 1.
- Produces: controlled `renderStyle` / `onRenderStyleChange` component props and a live hook parameter.

- [x] **Step 1: Extend the component test and verify RED**

Require a `厂区渲染风格` group with controlled `科技` and `Unity` buttons and correct `aria-pressed` state.

- [x] **Step 2: Add the compact two-state control**

Place the control inside the existing light console, below day/evening, with no new floating panel.

- [x] **Step 3: Wire application state into the Three.js hook**

Keep the style in `App`, pass it through `IndustrialScene`, store the latest value in a hook ref, and reapply the existing lighting controller when it changes.

- [x] **Step 4: Run focused UI tests and verify GREEN**

Run: `node --test tests/sunlightControl.test.js tests/campusRenderStyle.test.js tests/campusLightingMode.test.js`

Expected: PASS.

### Task 3: Visual integration and verification

**Files:**
- Modify: `src/styles/index.css`

**Interfaces:**
- Consumes: `scene-render-style-toggle` markup from Task 2.
- Produces: a compact industrial calibration switch with distinct cyan cockpit and pale sky/warm Unity active states.

- [x] **Step 1: Add scoped styling**

Keep the control inside the current cyan/amber visual language and avoid changing any energy-panel selectors.

- [x] **Step 2: Run the full automated suite**

Run: `npm test && npm run build`

Expected: all tests pass and Vite builds successfully.

- [x] **Step 3: Verify both styles in the browser**

Open the existing local service, switch between both styles, confirm only the canvas appearance changes, test day/evening and sunlight interaction, and confirm no browser console errors.

- [x] **Step 4: Check the patch boundary**

Run: `git diff --check` and inspect changed paths. Confirm this stage introduced no model or Unity-file edits.
