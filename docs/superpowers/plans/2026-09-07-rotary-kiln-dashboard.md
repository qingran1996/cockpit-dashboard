# Rotary Kiln Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dense, standalone `/rotary-kiln` equipment dashboard that matches the existing Dazuka digital-twin visual language.

**Architecture:** Register a dedicated app surface and render a focused React page outside the main energy dashboard shell. Keep kiln telemetry and ECharts options in a data module, use a server-renderable `.js` view for structural tests, and inject the real ECharts component from a thin `.jsx` wrapper.

**Tech Stack:** React 18, ECharts 5, Vite 5, Node.js test runner, CSS.

## Global Constraints

- The page route is `/rotary-kiln` and must not mount the main dashboard or Three.js scene.
- The 1920×1080 equipment board must scale to fit the current browser viewport.
- Use the existing navy/cyan cockpit palette, with orange reserved for kiln heat and red reserved for alarms.
- Show operating, temperature, combustion, energy, mechanical-health, alarm, and trend information in one screen.
- Respect `prefers-reduced-motion` and retain readable labels at the 16:9 design resolution.

---

### Task 1: Surface and telemetry contract

**Files:**
- Modify: `src/appSurface.js`
- Create: `src/data/rotaryKilnData.js`
- Create: `tests/rotaryKilnDashboard.test.js`

**Interfaces:**
- Produces: `APP_SURFACES.rotaryKiln`, `resolveAppSurface('/rotary-kiln')`, `rotaryKilnData`, and `rotaryKilnChartOptions`.
- Consumes: Existing route resolver conventions and ECharts option shapes.

- [ ] **Step 1: Write the failing route and data test**

```js
assert.equal(resolveAppSurface('/rotary-kiln'), 'rotary-kiln')
assert.equal(rotaryKilnData.temperatureZones.length, 5)
assert.equal(rotaryKilnChartOptions.temperature.series.length, 3)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/rotaryKilnDashboard.test.js`

Expected: FAIL because the rotary-kiln surface and data module do not exist.

- [ ] **Step 3: Implement route and immutable telemetry**

Add the surface constant and route branch, then export literal equipment KPIs, temperature zones, burner data, drive health, alarms, and 24-point chart series.

- [ ] **Step 4: Run test to verify the data contract passes**

Run: `node --test tests/rotaryKilnDashboard.test.js`

Expected: route and data assertions PASS while the page assertion remains RED.

### Task 2: Dense kiln equipment page

**Files:**
- Create: `src/components/RotaryKilnDashboard.js`
- Create: `src/components/RotaryKilnDashboard.jsx`
- Create: `src/styles/rotary-kiln-dashboard.css`
- Modify: `tests/rotaryKilnDashboard.test.js`

**Interfaces:**
- Consumes: `rotaryKilnData`, chart slots named `temperatureChart` and `energyChart`.
- Produces: `RotaryKilnDashboard` structural view and responsive kiln-specific visual system.

- [ ] **Step 1: Add failing semantic markup assertions**

```js
assert.match(markup, /回转窑运行监测/)
assert.match(markup, /窑尾预热/)
assert.match(markup, /燃烧与供风/)
assert.match(markup, /设备健康/)
assert.match(markup, /活动告警/)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/rotaryKilnDashboard.test.js`

Expected: FAIL because the dashboard component is missing.

- [ ] **Step 3: Implement the page and styles**

Build a header and KPI band, a central horizontal kiln process schematic, left combustion/temperature panels, right mechanical-health/alarm panels, and two lower trend panels. Use a cyan instrument frame and a single orange heat-flow signature through the kiln body.

- [ ] **Step 4: Run the component test**

Run: `node --test tests/rotaryKilnDashboard.test.js`

Expected: all structural assertions PASS.

### Task 3: Entry integration and verification

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/styles/rotary-kiln-dashboard.css`
- Test: `tests/rotaryKilnDashboard.test.js`

**Interfaces:**
- Consumes: `surfaceMode === APP_SURFACES.rotaryKiln`, `EChart`, and the kiln wrapper.
- Produces: A directly navigable `/rotary-kiln` page.

- [ ] **Step 1: Integrate the dedicated page in the app entry**

Render `RotaryKilnDashboardPage` before the ordinary `App` branch and import its stylesheet.

- [ ] **Step 2: Run automated verification**

Run: `node --test tests/rotaryKilnDashboard.test.js tests/embeddedPartCharts.test.js tests/unityDashboardSurface.test.js`

Expected: all selected tests PASS.

- [ ] **Step 3: Build the production bundle**

Run: `npm run build`

Expected: Vite exits with code 0.

- [ ] **Step 4: Perform browser visual QA**

Open `http://127.0.0.1:5182/rotary-kiln`, verify the 1920×1080 board fits the viewport, all panels remain inside the canvas, both charts render, and the browser console has no errors.
