# Main Hall Wall System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the main production hall facade from flat panel boxes into a believable insulated-metal wall system that reads clearly in the normal campus view and the close floor-inspection view.

**Architecture:** Keep the procedural Blender generator as the single source of truth and add all new facade meshes below `BLDG__main-production-hall`. Use medium-scale geometry for silhouette, construction depth, and cast shadows; reuse a small material set so the exported GLB remains efficient and the existing Web floor explosion continues to classify the facade as exterior.

**Tech Stack:** Blender 5.2 Python API, Node.js test runner, glTF/GLB, Vite/Three.js

## Global Constraints

- Preserve the approved campus layout and all `BLDG__*`, `FLOOR__*`, `INTERIOR__*`, and `WALKER__*` node contracts.
- Preserve the existing building explosion, floor navigation, person animation, and vehicle animation behaviors.
- Refine only the main production hall as the representative wall-system sample in this pass.
- Use mesh geometry and shared PBR materials only; do not add external texture dependencies.
- Keep the running Web preview on port 5180.

---

### Task 1: Lock the constructed-wall contract

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.test.js`

**Interfaces:**
- Consumes: generated editable Blender scene from `create_factory_campus_graybox.py`
- Produces: assertions for `MAIN__wall-rib-*`, `MAIN__clerestory-reveal-*`, `MAIN__sectional-door-slat-*`, `MAIN__loading-canopy`, `MAIN__downpipe-*`, and `MAIN__safety-sign-*`

- [x] **Step 1: Extend the representative facade test with the new named construction details**
- [x] **Step 2: Assert physical projection, repeated wall rhythm, shared materials, and building-root ownership**
- [x] **Step 3: Run the focused test with `node --test --test-name-pattern="representative buildings" tools/blender/create_factory_campus_graybox.test.js`**
- [x] **Step 4: Confirm failure is caused by the missing wall-system nodes**

### Task 2: Model the main hall wall system

**Files:**
- Modify: `tools/blender/create_factory_campus_graybox.py`

**Interfaces:**
- Consumes: `create_main_production_facade(width, depth, height, mats, root)` and shared `box`/`cylinder` helpers
- Produces: GLB-safe facade meshes parented to `BLDG__main-production-hall`

- [x] **Step 1: Add graphite corrugation, safety-orange, and luminaire materials to the shared material library**
- [x] **Step 2: Add vertical wall ribs at a readable industrial panel module on the front and visible side**
- [x] **Step 3: Replace floating clerestory glazing with recessed backing, frame heads, jambs, and sills**
- [x] **Step 4: Add horizontal sectional-door slats, a projecting loading canopy, and structural brackets**
- [x] **Step 5: Add front downpipes with wall stand-offs, safety signs, and restrained exterior luminaires**
- [x] **Step 6: Re-run the focused representative facade test and confirm it passes**

### Task 3: Regenerate editable and Web assets

**Files:**
- Modify: `assets/blender/factory-campus-graybox.blend`
- Modify: `public/models/factory-campus-graybox.glb`

**Interfaces:**
- Consumes: the updated procedural generator
- Produces: an editable `.blend` scene and the Web-consumable `.glb`

- [x] **Step 1: Run Blender headlessly against the tracked output paths**
- [x] **Step 2: Confirm the generator exits successfully and both assets are non-empty**
- [x] **Step 3: Inspect the exported GLB node contract for the new details and existing building/floor nodes**

### Task 4: Verify visual quality and regressions

**Files:**
- Verify: `public/models/factory-campus-graybox.glb`
- Verify: `src/hooks/useIndustrialScene.js`
- Verify: `src/scene/floorInteraction.js`

**Interfaces:**
- Consumes: regenerated GLB and the running Vite page
- Produces: evidence for visual wall depth, floor navigation, and clean runtime state

- [x] **Step 1: Run the complete Blender generator test suite**
- [x] **Step 2: Run `npm test` and `npm run build`**
- [x] **Step 3: Reload port 5180 and inspect the campus overview and main hall close view**
- [x] **Step 4: Verify wall ribs, openings, canopy, signs, explosion, floor focus, reset, and browser logs**
- [x] **Step 5: Restore the preview to the campus overview**
