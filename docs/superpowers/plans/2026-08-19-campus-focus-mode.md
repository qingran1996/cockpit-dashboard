# Campus Focus Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an accessible toggle that hides the surrounding dashboard modules with coordinated motion and expands the central 3D campus into a distraction-free viewing mode.

**Architecture:** `App` owns a boolean focus-mode state and applies state classes to the shell and fixed design canvas. A dedicated `CampusFocusToggle` renders the stable accessible control, while CSS transitions move each dashboard region toward its nearest screen edge and expand `.industrial-scene`; the existing `ResizeObserver` resizes Three.js during the transition.

**Tech Stack:** React 18, CSS transitions, Three.js ResizeObserver integration, Node test runner, Vite.

## Global Constraints

- The toggle must remain visible in normal and focused modes.
- Focus mode must hide header, left/right panels, lower steam panel, bottom metrics, and outer side rails.
- The 3D scene must expand without remounting or losing selected building/floor state.
- `prefers-reduced-motion: reduce` must remove transition duration.

---

### Task 1: Accessible focus-mode control

**Files:**
- Create: `src/components/CampusFocusToggle.js`
- Create: `tests/campusFocusToggle.test.js`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `active: boolean`, `onToggle: () => void`.
- Produces: a button with stable `aria-pressed`, mode-specific label, and industrial reticle icon.

- [ ] **Step 1: Add a failing static-render test for inactive and active button states**
- [ ] **Step 2: Run the focused test and confirm the component is missing**
- [ ] **Step 3: Implement `CampusFocusToggle` and connect App state/classes**
- [ ] **Step 4: Run the focused test and confirm both states pass**

### Task 2: Coordinated dashboard transition

**Files:**
- Modify: `src/styles/index.css`
- Modify: `src/styles/panels.css`

**Interfaces:**
- Consumes: `.is-campus-focus` on the shell and `.dashboard-canvas`.
- Produces: edge-directed panel exits, expanded scene bounds, persistent focus toggle, reduced-motion fallback.

- [ ] **Step 1: Add transitions for header, panels, metrics, rails, scene, and toggle**
- [ ] **Step 2: Replace persistent reveal animation fill with backwards-only fill so focus transforms can take control**
- [ ] **Step 3: Add a restrained cyan focus-frame signature around the expanded scene**
- [ ] **Step 4: Disable transition duration for reduced-motion users**

### Task 3: Browser and build verification

**Files:**
- Modify: none

**Interfaces:**
- Consumes: running Vite service on port 5180.
- Produces: verified normal/focus screenshots and a green build/test result.

- [ ] **Step 1: Run the full unit suite and Vite production build**
- [ ] **Step 2: Open 5180, toggle focus mode, and inspect both visual states**
- [ ] **Step 3: Verify the WebGL canvas resizes and browser console remains clean**
