# Blender Factory Campus Graybox

This branch uses an editable Blender scene as the visual source for the dashboard campus. The model is a single-view approximation of `bgtp.jpg`; it is intended for visual validation and browser interaction, not CAD or BIM measurement.

## Assets

- Blender source: `assets/blender/factory-campus-graybox.blend`
- Browser asset: `public/models/factory-campus-graybox.glb`
- Deterministic generator: `tools/blender/create_factory_campus_graybox.py`

## Regenerate

```bash
/Applications/Blender.app/Contents/MacOS/Blender \
  --background \
  --python tools/blender/create_factory_campus_graybox.py \
  -- \
  --blend-output assets/blender/factory-campus-graybox.blend \
  --glb-output public/models/factory-campus-graybox.glb
```

The generator targets Blender 5.2 LTS and creates an expanded 58 × 42 campus, a four-sided perimeter road loop, twelve separated building masses, roof equipment, pipe racks, administration facade, basketball court, marked parking lot and canopy, an open vehicle gate, road traffic, perimeter fence, low-poly tree rows, and interactive floor-space volumes from primitives.

## Runtime contract

The GLB root is named `FactoryCampusGraybox`. Each selectable building is an independent node named `BLDG__<building-id>` with a matching exported `buildingId` custom property. Every building contains child nodes named `FLOOR__<building-id>__<floor-id>`; their exported extras include `buildingId`, `floorId`, `floorName`, `usage`, `level`, `tone`, and `interactive`.

`src/scene/factoryCampusAsset.js` rejects incomplete building or floor exports, prepares isolated floor/exterior materials, and discovers motion-tagged traffic nodes. The dashboard hides floor-space geometry in overview mode, then ghosts the selected exterior and explodes all floors together. `VEHICLE__gate-shuttle__root` carries `motionPath`, `motionDistance`, and `motionSpeed` extras so the Web renderer can drive it through the gate. The procedural fallback implements the same building and floor contract when the GLB cannot load.

## Known limits

- Hidden elevations and service yards are inferred from the visible facade language.
- Building dimensions and spacing are normalized for the dashboard camera, not survey measurements.
- Pipe connectivity is representative rather than process-engineering accurate.
- Vegetation uses repeated low-poly forms and does not reproduce tree species or exact density.
- Facade signage and unreadable text are omitted.
