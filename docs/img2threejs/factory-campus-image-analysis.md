# Factory Campus Reference Image Analysis

## Suitability verdict

Conditional. The supplied image is a high-resolution oblique aerial rendering of a complete industrial campus rather than a single isolated object. Its macro layout, architectural masses, road network, pipe racks, landscaping, and camera framing are readable enough for a stylized procedural reconstruction. Exact engineering geometry is not recoverable from one view; hidden rear elevations, roof slopes, dimensions, pipe connectivity, and occluded service yards must be inferred.

Intended output: a real-time browser scene that preserves the reference's recognizable campus layout while fitting the existing dark-blue energy dashboard. It is not a CAD/BIM reconstruction.

## Layer 1 — identification and classification

- Primary type: industrial factory campus / architectural compound.
- Primary domain: object.
- Form language: hard-surface, architectural, repeated-module, landscape-supported.
- Structure kind: compound scene with a branching hierarchy and repeated modules.
- Confidence: 0.96 for the scene class; 0.68 for individual building functions.

## Layer 2 — overall form and silhouette

- The campus occupies a broad rectangular ground plane viewed from an elevated three-quarter camera.
- The main silhouette is a stepped cluster of low and medium-height cuboids rather than one continuous mass.
- A long production hall dominates the front-left to center region.
- Several parallel production halls step upward toward the rear.
- A shorter office block and basketball court establish the front edge.
- Roads and tree bands frame the rectangular campus perimeter.
- Approximate symmetry is absent; the layout is intentionally asymmetric but organized on an orthogonal grid.

## Layer 3 — macro, meso, and micro hierarchy

### Macro assemblies

1. Campus ground plate and perimeter road system.
2. Main long production hall.
3. Central parallel production halls.
4. Rear high-bay hall.
5. Right-side warehouse and utility cluster.
6. Front administration building.
7. Pipe-rack network.
8. Landscape, parking, sports, and perimeter systems.

### Meso assemblies

- Each hall: wall shell, shallow-pitch roof, parapet/edge trim, door bays, window strips, roof ventilators.
- Roads: asphalt strips, curbs, lane markings, intersections, zebra crossings.
- Pipe racks: repeated columns, longitudinal beams, multiple pipe runs, elbow transitions.
- Landscaping: lawn planes, tree rows, flower/shrub bands, parking islands.
- Front amenities: covered parking, basketball court, gatehouse, fence.

### Micro feature groups

- Repeated circular roof vents and rectangular skylights.
- Blue loading-door recesses and narrow window bands.
- White/blue roof-edge trim.
- Repeated streetlights, fence posts, lane dashes, zebra stripes, and parking bays.
- Basketball court lines, hoops, and contrasting court surface.
- Repeated pipe supports and parallel cyan-gray pipes.

## Layer 4 — spatial relationships

- Production halls are attached to the ground plate with flush slab contact.
- Roof shells sit flush on wall shells; roof vents use embedded contact with the roof surface.
- Door and window carriers are embedded slightly into wall faces.
- Pipe-rack columns are socketed into the ground; beams overlap column tops; pipe runs rest above beams.
- Roads are conforming surface layers above the ground plate.
- Curbs and zebra stripes sit flush above road surfaces.
- Trees are socketed into lawn regions and distributed in perimeter rows and clustered bands.
- The basketball court is embedded in the front lawn and separated from the administration block by a service path.

## Layer 5 — materials and surface

- Factory walls: opaque dielectric, off-white/light gray albedo, matte to satin roughness approximately 0.68–0.82.
- Roofs: cool light gray coated metal, metalness approximately 0.25, roughness approximately 0.55–0.68.
- Trim and doors: muted cyan-blue coated metal, metalness approximately 0.2, roughness approximately 0.45–0.6.
- Roads: dark charcoal asphalt, metalness 0, roughness approximately 0.92.
- Pipe racks: painted steel, cool cyan-gray, metalness approximately 0.55, roughness approximately 0.38.
- Lawn and trees: opaque dielectric materials with high roughness and controlled value variation.
- Court: muted oxide-red painted surface, roughness approximately 0.8.

## Layer 6 — color and finish

- Walls: high-value, low-saturation cool gray.
- Roofs: mid-to-high-value neutral gray with blue-gray edge trim.
- Roads: low-value neutral charcoal.
- Vegetation: low-to-mid-value desaturated greens.
- Reference accents: muted blue doors/trim, cyan-gray pipe racks, oxide-red basketball court.
- Dashboard adaptation: retain the above base colors under a dark navy environment, with restrained cyan emissive accents on selected trim and pipe routes rather than applying glow to every surface.

## Layer 7 — identity-defining features

1. Long front-left production hall with repeated roof skylights and a continuous blue edge/window band.
2. Parallel stepped factory halls forming the central campus spine.
3. Elevated multi-line pipe rack connecting central and right-side buildings.
4. Front administration block with a more articulated facade than the factory halls.
5. Oxide-red basketball court directly in front of the administration block.
6. Covered parking canopy at the front-left perimeter.
7. Orthogonal internal road grid with frequent zebra crossings.
8. Dense tree perimeter and planted color bands around the front and side edges.
9. Repeated roof ventilators distributed in orderly rows.

## Layer 8 — uncertainty and single-image limits

- Rear and lateral elevations hidden by perspective are inferred from visible facade systems.
- Exact real-world dimensions and spacing are undetermined; visible proportions are normalized to a 42 × 32 scene footprint.
- Roof pitch is visually shallow and will be approximated with thin box/extruded roof shells.
- Pipe connectivity behind buildings is occluded; only visible route logic will be reconstructed.
- Tree species, vehicle models, signage, and company logos are not identity-critical and will be simplified or omitted.
- The top white title/logo area is presentation artwork outside the 3D campus and will not be reconstructed.
- Fine facade text is unreadable and will not be invented.

## Revised footprint count after layout review

The reference is treated as twelve independently readable building masses rather than the earlier
ten-building abstraction:

1. dominant west/main production hall;
2. central long processing hall;
3. rear high-bay hall;
4. north-east auxiliary workshop;
5. east process hall;
6. far-east stepped utility building;
7. east finished-goods warehouse;
8. front raw-material warehouse;
9. front utility annex;
10. low laboratory/service block;
11. administration building;
12. entrance gatehouse.

Parking canopies are site equipment, not additional buildings. The revised layout keeps explicit
front-to-back gaps between the main, central, and rear halls and separates the east cluster into
four depth bands instead of merging it into one dense row.

## Reference-camera and placement calibration

The second layout pass uses the 1992 × 1270 source image as a measurement frame. The initial camera
is fixed at `[12, 24, 36]`, targets `[0, 0.6, 0]`, and uses a 39° vertical field of view. Its
side/front position ratio is 0.333, which makes the projected front road and long roof edges follow
the shallow screen-space slope visible in the reference.

Each of the twelve building roof centres has a manually measured image landmark. The runtime test
projects each Three.js roof centre back into the 1992 × 1270 frame and requires it to land within an
18-pixel radius of that landmark. This makes placement changes measurable and prevents later camera
or coordinate edits from silently returning to the earlier generic campus layout.

This contract is image-view exactness, not survey/CAD exactness. Hidden elevations, true metric
dimensions, and occluded service corridors remain inferred until a site plan or additional views
are supplied.

## Quality contract draft

- Exactly 12 independently selectable building groups for the current single-view interpretation.
- Minimum 8 macro systems, 12 meso assemblies, and 18 mapped detail groups.
- Required repeated systems: roof vents, skylights, windows, doors, pipe supports, trees, streetlights, lane markings, zebra stripes, fence posts.
- Required review views: reference-matched oblique view plus front, right, rear, and left turntable views.
- Blocking failures: missing long production hall, missing central stepped halls, missing pipe racks, missing administration/court composition, degenerate flat buildings, road network obscuring buildings, or material treatment that breaks dashboard readability.
