# Relocate Sports Courts and Add Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the basketball and tennis courts into the open upper-left parcel in the approved oblique view, and give each enclosure a modeled pedestrian gate.

**Architecture:** Keep both courts as children of `SITE__ground-and-roads`, so the existing plan-expansion pass moves their roots while their approved dimensions stay unchanged. Split each road-facing fence run around a centered opening, add a stable gate root and leaf, then regenerate the tracked Blender and GLB assets.

**Tech Stack:** Blender 5.2 Python API, GLB/glTF, Node.js test runner, Three.js/Vite.

## Global Constraints

- Preserve the existing basketball and tennis surface dimensions.
- Preserve all existing court, net, hoop, and fence node contracts needed by Web loading.
- Put both courts between the rear internal road and rear perimeter road, clear of buildings, roads, trees, and each other.
- Add stable gate nodes `BASKET__gate` / `BASKET__gate-leaf` and `TENNIS__gate` / `TENNIS__gate-leaf`.
- Keep `/models/factory-campus-graybox.glb` as the Web asset URL.

---

### Task 1: Court Location and Gate Contract

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`
- Modify: `tests/generatedModelContract.test.js`

**Interfaces:**
- Consumes: generated Blender scene and GLB JSON.
- Produces: assertions for relocated court roots, stable gate nodes, fence openings, and collision-free placement.

- [ ] **Step 1: Write the failing Blender-scene assertions**

Assert basketball world root X is `22..28`, tennis world root X is `10..16`, both world Y values are below `-18`, both gate leaves exist under their gate roots, and neither court enclosure overlaps roads, buildings, sports peers, or tree trunks.

- [ ] **Step 2: Run the focused Blender test and verify RED**

Run:

```bash
node --test --test-name-pattern="basketball and tennis courts occupy" tools/blender/create_factory_campus_graybox.test.js
```

Expected: fail because the current courts remain at positive Y and gate nodes do not exist.

- [ ] **Step 3: Extend the GLB boundary contract**

Add the four gate node names to the generated GLB test so export cannot silently strip them.

### Task 2: Move Courts and Model Gates

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: `box`, `cylinder`, `empty`, existing court materials, and the site root.
- Produces: relocated `SITE__basketball-court` and `SITE__tennis-court` roots plus modeled swing gates.

- [ ] **Step 1: Relocate the roots**

Set generator-space centers to basketball `(17.7, -14.85)` and tennis `(9.0, -14.85)`. After `PLAN_SCALE`, these land near world `(25.03, -21.00)` and `(12.73, -21.00)`.

- [ ] **Step 2: Split the road-facing fence runs**

Replace each full north run with left/right segments around a `1.4`-unit centered pedestrian opening while retaining the legacy north-run name on the left segment.

- [ ] **Step 3: Add the gate assemblies**

Create each gate as an empty hinge root with an ajar mesh leaf, two reinforced posts, `interactive=True`, and stable open/closed angle metadata.

- [ ] **Step 4: Run the focused generator contract**

Run the Task 1 focused Blender test and confirm the court relocation, gates, and collision checks pass.

### Task 3: Assets and Web Verification

**Files:**
- Regenerate: `assets/blender/factory-campus-graybox.blend`
- Regenerate: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Consumes: updated deterministic generator.
- Produces: editable Blender source and Web-ready GLB at the existing path.

- [ ] **Step 1: Regenerate tracked assets**

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python tools/blender/create_factory_campus_graybox.py -- \
  --blend-output assets/blender/factory-campus-graybox.blend \
  --glb-output public/models/factory-campus-graybox.glb
```

- [ ] **Step 2: Verify contracts and build**

```bash
node --test tests/generatedModelContract.test.js
npm test
npm run build
git diff --check
```

- [ ] **Step 3: Inspect Blender and Web**

Render the approved oblique camera, reload `http://localhost:5180/`, and confirm both courts occupy the upper-left open parcel with visible entrances and no browser warnings.
