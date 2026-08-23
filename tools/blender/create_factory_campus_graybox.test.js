import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildingRegistry } from '../../src/scene/buildingRegistry.js'

const BLENDER = '/Applications/Blender.app/Contents/MacOS/Blender'
const BLENDER_TIMEOUT = 1_200_000
const GENERATOR = new URL('./create_factory_campus_graybox.py', import.meta.url).pathname
const ASSET_EFFICIENCY_UPDATER = new URL('./update_factory_asset_efficiency.py', import.meta.url).pathname
let generatedFixture

test('asset-efficiency pass is reproducible from both the generator and incremental updater', () => {
  const generatorSource = readFileSync(GENERATOR, 'utf8')
  const updaterSource = readFileSync(ASSET_EFFICIENCY_UPDATER, 'utf8')

  assert.match(generatorSource, /def optimize_asset_reuse_and_visibility\(campus\):/)
  assert.match(generatorSource, /deduplicate_reusable_meshes\(\)/)
  assert.match(generatorSource, /tag_distance_visibility_tiers\(\)/)
  assert.match(generatorSource, /campus\["assetEfficiencyPass"\] = "geometry-signature-v1"/)
  assert.match(updaterSource, /generator\.optimize_asset_reuse_and_visibility\(campus\)/)
  assert.match(updaterSource, /export_extras=True/)
})

function getGeneratedFixture() {
  if (generatedFixture) return generatedFixture
  const output = mkdtempSync(join(tmpdir(), 'factory-campus-shared-fixture-'))
  if (process.env.BLENDER_TEST_BLEND && process.env.BLENDER_TEST_GLB) {
    generatedFixture = {
      output,
      blendPath: process.env.BLENDER_TEST_BLEND,
      glbPath: process.env.BLENDER_TEST_GLB,
    }
    return generatedFixture
  }
  const blendPath = join(output, 'factory-campus-graybox.blend')
  const glbPath = join(output, 'factory-campus-graybox.glb')
  const generated = spawnSync(BLENDER, [
    '--background', '--python', GENERATOR, '--',
    '--blend-output', blendPath,
    '--glb-output', glbPath,
  ], { encoding: 'utf8', timeout: BLENDER_TIMEOUT })
  assert.equal(generated.status, 0, generated.stderr || generated.stdout)
  generatedFixture = { output, blendPath, glbPath }
  return generatedFixture
}
const REQUIRED_SCENE_DETAILS = [
  'SITE__outer-boulevard',
  'SITE__entry-plaza',
  'ADMIN__glass-bay-01',
  'PARKING__solar-panel-01',
  'COURT__hoop-left',
  'BASKET__fence-run-north',
  'SITE__tennis-court',
  'TENNIS__surface',
  'TENNIS__net',
  'TENNIS__fence-run-north',
  'ADMIN__grand-atrium',
  'ADMIN__grand-canopy',
  'ADMIN__crown-band',
  'VEHICLE__bus-01',
  'LANDSCAPE__flower-bed-01',
  'FENCE__perimeter-run-01',
  'PIPE__bridge-gantry-01',
  'ROAD__perimeter-front',
  'ROAD__perimeter-rear',
  'ROAD__perimeter-west',
  'ROAD__perimeter-east',
  'PARKING__surface',
  'GATE__barrier-inbound',
  'GATE__barrier-inbound__arm',
  'GATE__recognition-zone',
  'GATE__stop-line',
  'GATE__speed-bump-01',
  'GATE__lane-arrow-inbound',
  'GATE__lane-arrow-outbound',
  'GATE__visitor-bay',
  'VEHICLE__gate-shuttle__root',
  'PATROL__campus-01',
]

test('generated Web GLB stays within the 40 MiB PBR deployment budget', () => {
  const { glbPath } = getGeneratedFixture()
  const size = statSync(glbPath).size
  assert.ok(size <= 40 * 1024 * 1024, `GLB exceeds 40 MiB PBR deployment budget: ${size} bytes`)
})

test('Blender generator exports an editable scene with the complete GLB node contract', () => {
  const { output, blendPath, glbPath } = getGeneratedFixture()
  assert.ok(statSync(blendPath).size > 50_000)
  assert.ok(statSync(glbPath).size > 20_000)

  const contractPath = join(output, 'contract.json')
  const inspectExpression = [
    'import bpy,json',
    `bpy.ops.import_scene.gltf(filepath=${JSON.stringify(glbPath)})`,
    "nodes=[o.name for o in bpy.context.scene.objects]",
    "building_ids={o.name:o.get('buildingId') for o in bpy.context.scene.objects if o.name.startswith('BLDG__')}",
    "meshes=sum(1 for o in bpy.context.scene.objects if o.type=='MESH')",
    `open(${JSON.stringify(contractPath)},'w').write(json.dumps({'nodes':nodes,'buildingIds':building_ids,'meshes':meshes}))`,
  ].join(';')
  const inspected = spawnSync(BLENDER, ['--background', '--factory-startup', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const contract = JSON.parse(readFileSync(contractPath, 'utf8'))
  for (const record of buildingRegistry) {
    assert.ok(contract.nodes.includes(record.nodeName), `missing ${record.nodeName}`)
    assert.equal(contract.buildingIds[record.nodeName], record.id)
  }
  for (const nodeName of REQUIRED_SCENE_DETAILS) {
    assert.ok(contract.nodes.includes(nodeName), `missing scene detail ${nodeName}`)
  }
  assert.ok(contract.meshes >= 240, `expected at least 240 meshes, received ${contract.meshes}`)
})

test('Blender scene preserves the wide front-left industrial-campus composition', () => {
  const { output, blendPath } = getGeneratedFixture()

  const layoutPath = join(output, 'layout.json')
  const inspectExpression = [
    'import bpy,json',
    "site=bpy.data.objects['SITE__ground']",
    "main=bpy.data.objects['main-production-hall__wall-shell']",
    "root=bpy.data.objects['FactoryCampusGraybox']",
    "camera=bpy.data.objects['ReferenceObliqueCamera']",
    "admin=bpy.data.objects['BLDG__administration']",
    "east=bpy.data.objects['BLDG__far-east-utility']",
    "rear=bpy.data.objects['BLDG__rear-high-bay']",
    `ids=${JSON.stringify(buildingRegistry.map(({ id }) => id))}`,
    "bounds={id:[bpy.data.objects['BLDG__'+id].location.x-bpy.data.objects[id+'__wall-shell'].dimensions.x/2,bpy.data.objects['BLDG__'+id].location.x+bpy.data.objects[id+'__wall-shell'].dimensions.x/2,bpy.data.objects['BLDG__'+id].location.y-bpy.data.objects[id+'__wall-shell'].dimensions.y/2,bpy.data.objects['BLDG__'+id].location.y+bpy.data.objects[id+'__wall-shell'].dimensions.y/2] for id in ids}",
    "parkingBays=sum(1 for o in bpy.data.objects if o.name.startswith('PARKING__bay-line-'))",
    "basketFenceCount=sum(1 for o in bpy.data.objects if o.name.startswith('BASKET__fence-'))",
    "sportsNames=['COURT__surface','TENNIS__surface','SITE__basketball-court','SITE__tennis-court']",
    "sports={name:{'dimensions':list(bpy.data.objects[name].dimensions) if bpy.data.objects[name].type=='MESH' else None,'location':list(bpy.data.objects[name].matrix_world.translation),'parent':bpy.data.objects[name].parent.name if bpy.data.objects[name].parent else None} for name in sportsNames}",
    "siteNames=['ROAD_DETAIL__inner-curb-01','ROAD_DETAIL__crosswalk-01-01','ROAD_DETAIL__stop-line-01','ROAD_DETAIL__direction-arrow-01-stem','ROAD_DETAIL__drain-channel-01','PEDESTRIAN__walkway-01','PARKING__wheel-stop-01','LANDSCAPE__rain-garden-01','LANDSCAPE__rain-garden-grass-01-01','LANDSCAPE__shrub-mass-01','LANDSCAPE__inner-tree-trunk-01','LANDSCAPE__inner-tree-crown-01','LANDSCAPE__tree-grate-01']",
    "siteObjects={name:{'dimensions':list(bpy.data.objects[name].dimensions),'location':list(bpy.data.objects[name].matrix_world.translation),'parent':bpy.data.objects[name].parent.name if bpy.data.objects[name].parent else None,'material':bpy.data.objects[name].data.materials[0].name} for name in siteNames if name in bpy.data.objects}",
    "siteCounts={'curbs':sum(1 for o in bpy.data.objects if o.name.startswith('ROAD_DETAIL__inner-curb-')),'crosswalkStripes':sum(1 for o in bpy.data.objects if o.name.startswith('ROAD_DETAIL__crosswalk-')),'wheelStops':sum(1 for o in bpy.data.objects if o.name.startswith('PARKING__wheel-stop-')),'rainGardens':sum(1 for o in bpy.data.objects if o.name.startswith('LANDSCAPE__rain-garden-') and '-grass-' not in o.name),'grassClumps':sum(1 for o in bpy.data.objects if o.name.startswith('LANDSCAPE__rain-garden-grass-')),'shrubs':sum(1 for o in bpy.data.objects if o.name.startswith('LANDSCAPE__shrub-mass-')),'innerTrees':sum(1 for o in bpy.data.objects if o.name.startswith('LANDSCAPE__inner-tree-trunk-'))}",
    "siteMaterials={name:{'roughness':next(n for n in bpy.data.materials[name].node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Roughness'].default_value,'color':list(bpy.data.materials[name].diffuse_color)} for name in ['MAT__safety-yellow','MAT__bioswale-soil','MAT__ornamental-grass','MAT__shrub-deep'] if name in bpy.data.materials}",
    "gateBlockingTrees=[o.name for o in bpy.data.objects if o.name.startswith('TREE__trunk-') and 23.3 <= o.matrix_world.translation.x <= 34.7 and o.matrix_world.translation.y >= 24.6]",
    "forestCrowns=[o for o in bpy.data.objects if o.name.startswith('ENV__tree-crown-')]",
    "forestTrunks=[o for o in bpy.data.objects if o.name.startswith('ENV__tree-trunk-')]",
    "perimeterCrowns=[o for o in bpy.data.objects if o.name.startswith('TREE__crown-')]",
    "rearPerimeterXs=sorted(o.matrix_world.translation.x for o in perimeterCrowns if o.matrix_world.translation.y < -17.5)",
    "rearPerimeterGaps=[rearPerimeterXs[i+1]-rearPerimeterXs[i] for i in range(len(rearPerimeterXs)-1)]",
    "perimeterSpacingVariance=(max(rearPerimeterGaps)-min(rearPerimeterGaps))/(sum(rearPerimeterGaps)/len(rearPerimeterGaps))",
    "entryCanopyIntrusions=sum(1 for o in perimeterCrowns if 23.3 <= o.matrix_world.translation.x <= 34.7 and o.matrix_world.translation.y >= 24.6)",
    "crownScaleVariants=len(set(round(o.scale.x,2) for o in perimeterCrowns))",
    "forestMetrics={'boundsX':[min(o.matrix_world.translation.x for o in forestCrowns),max(o.matrix_world.translation.x for o in forestCrowns)],'rearCount':sum(1 for o in forestCrowns if o.matrix_world.translation.y <= -29.5),'westCount':sum(1 for o in forestCrowns if o.matrix_world.translation.x <= -43 and -27 <= o.matrix_world.translation.y <= 24),'eastCount':sum(1 for o in forestCrowns if o.matrix_world.translation.x >= 43 and -27 <= o.matrix_world.translation.y <= 24),'uniqueCrownMeshes':len(set(o.data.name for o in forestCrowns)),'uniqueTrunkMeshes':len(set(o.data.name for o in forestTrunks))}",
    "apron=bpy.data.objects.get('ENV__landscape-apron')",
    "apronDimensions=list(apron.dimensions) if apron else None",
    "motion={k:bpy.data.objects['VEHICLE__gate-shuttle__root'].get(k) for k in ['motionPath','motionDistance','motionSpeed']}",
    "frontRowLengths={id:bpy.data.objects[id+'__wall-shell'].dimensions.x for id in ['front-warehouse','front-utility-annex','laboratory']}",
    "treeParts=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith(('TREE__trunk-','TREE__crown-','ENV__tree-trunk-','ENV__tree-crown-','LANDSCAPE__inner-tree-trunk-','LANDSCAPE__inner-tree-crown-'))]",
    "hardTargets=[o for o in bpy.data.objects if o.type=='MESH' and (o.name in ['COURT__surface','TENNIS__surface','PARKING__surface','SITE__entry-plaza'] or o.name.endswith('__wall-shell'))]",
    "majorRoads=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith(('ROAD__segment-','ROAD__perimeter-'))]",
    "internalRoads=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('ROAD__segment-')]",
    "buildingShells=[o for o in bpy.data.objects if o.type=='MESH' and o.name.endswith('__wall-shell')]",
    "buildingRoadCollisions=[[building.name,road.name] for building in buildingShells for road in internalRoads if abs(building.matrix_world.translation.x-road.matrix_world.translation.x)<(building.dimensions.x+road.dimensions.x)/2 and abs(building.matrix_world.translation.y-road.matrix_world.translation.y)<(building.dimensions.y+road.dimensions.y)/2]",
    "parkingSurface=bpy.data.objects['PARKING__surface']",
    "parkingRoof=bpy.data.objects['PARKING__canopy-roof']",
    "parkingCanopy={'surface':list(parkingSurface.dimensions),'roof':list(parkingRoof.dimensions),'roofOffset':[parkingRoof.matrix_world.translation.x-parkingSurface.matrix_world.translation.x,parkingRoof.matrix_world.translation.y-parkingSurface.matrix_world.translation.y],'posts':sum(1 for o in bpy.data.objects if o.name.startswith('PARKING__post-')),'solarPanels':sum(1 for o in bpy.data.objects if o.name.startswith('PARKING__solar-panel-'))}",
    "hardTreeCollisions=[[tree.name,target.name] for tree in treeParts for target in hardTargets if abs(tree.matrix_world.translation.x-target.matrix_world.translation.x)<(tree.dimensions.x+target.dimensions.x)/2 and abs(tree.matrix_world.translation.y-target.matrix_world.translation.y)<(tree.dimensions.y+target.dimensions.y)/2]",
    "roadTrunkCollisions=[[tree.name,target.name] for tree in treeParts if 'trunk' in tree.name for target in majorRoads if abs(tree.matrix_world.translation.x-target.matrix_world.translation.x)<(tree.dimensions.x+target.dimensions.x)/2 and abs(tree.matrix_world.translation.y-target.matrix_world.translation.y)<(tree.dimensions.y+target.dimensions.y)/2]",
    "world=list(bpy.context.scene.world.color)",
    "layout={'site':list(site.dimensions),'main':list(main.dimensions),'rootScale':list(root.scale),'camera':list(camera.location),'admin':list(admin.matrix_world.translation),'east':list(east.matrix_world.translation),'rear':list(rear.matrix_world.translation),'world':world,'hasForest':'ENV__forest-backdrop' in bpy.data.objects,'bounds':bounds,'parkingBays':parkingBays,'parkingCanopy':parkingCanopy,'buildingRoadCollisions':buildingRoadCollisions,'basketFenceCount':basketFenceCount,'sports':sports,'siteObjects':siteObjects,'siteCounts':siteCounts,'siteMaterials':siteMaterials,'gateBlockingTrees':gateBlockingTrees,'forestMetrics':forestMetrics,'apronDimensions':apronDimensions,'motion':motion,'frontRowLengths':frontRowLengths,'hardTreeCollisions':hardTreeCollisions,'roadTrunkCollisions':roadTrunkCollisions,'perimeterSpacingVariance':perimeterSpacingVariance,'entryCanopyIntrusions':entryCanopyIntrusions,'crownScaleVariants':crownScaleVariants}",
    `open(${JSON.stringify(layoutPath)},'w').write(json.dumps(layout))`,
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const layout = JSON.parse(readFileSync(layoutPath, 'utf8'))
  assert.ok(layout.site[0] * layout.site[1] >= 58 * 42 * 1.98, `site footprint is not doubled: ${layout.site}`)
  assert.ok(layout.main[0] >= 14 && layout.main[0] / layout.main[1] >= 2.2, `main hall lacks horizontal dominance: ${layout.main}`)
  assert.ok(layout.camera[0] < -70 && layout.camera[1] > 72, `camera is not pulled back over the doubled front-left site: ${layout.camera}`)
  assert.ok(layout.rootScale.every(value => value > 0), `negative root scale breaks Eevee after reloading: ${layout.rootScale}`)
  assert.ok(layout.admin[0] - layout.east[0] >= 22, `east service zone is not visually separated to the right of the administration frontage`)
  assert.ok(layout.rear[1] <= -8, `rear high-bay lacks depth separation: ${layout.rear}`)
  assert.ok(layout.world.reduce((sum, value) => sum + value, 0) / 3 >= 0.35, `world is too dark to create aerial depth: ${layout.world}`)
  assert.equal(layout.hasForest, true, 'missing forest backdrop for depth cues')
  assert.ok(layout.parkingBays >= 10, `parking lot needs at least ten marked bays: ${layout.parkingBays}`)
  assert.deepEqual(layout.buildingRoadCollisions, [], `building footprints must clear internal roads: ${JSON.stringify(layout.buildingRoadCollisions)}`)
  assert.ok(layout.parkingCanopy.roof[0] >= 8.2 && layout.parkingCanopy.roof[1] >= 4.5, `parking canopy must cover both parking rows: ${layout.parkingCanopy.roof}`)
  assert.ok(layout.parkingCanopy.roof[0] <= layout.parkingCanopy.surface[0] && layout.parkingCanopy.roof[1] <= layout.parkingCanopy.surface[1], `parking canopy must remain inside its parking surface: ${JSON.stringify(layout.parkingCanopy)}`)
  assert.ok(Math.abs(layout.parkingCanopy.roofOffset[0]) <= .1 && Math.abs(layout.parkingCanopy.roofOffset[1]) <= .1, `parking canopy must center over both rows: ${layout.parkingCanopy.roofOffset}`)
  assert.ok(layout.parkingCanopy.posts >= 8, `expanded parking canopy needs two support rows: ${layout.parkingCanopy.posts}`)
  assert.ok(layout.parkingCanopy.solarPanels >= 20, `expanded parking canopy needs four photovoltaic rows: ${layout.parkingCanopy.solarPanels}`)
  assert.equal(layout.basketFenceCount, 11, 'basketball court needs a split entrance run plus three intact fence runs and six posts')
  assert.deepEqual(layout.sports['COURT__surface'].dimensions.map(value => Math.round(value * 10) / 10), [8.8, 5.2, .1])
  assert.deepEqual(layout.sports['TENNIS__surface'].dimensions.map(value => Math.round(value * 10) / 10), [8.4, 4.4, .1])
  assert.equal(layout.sports['COURT__surface'].parent, 'SITE__basketball-court')
  assert.equal(layout.sports['TENNIS__surface'].parent, 'SITE__tennis-court')
  const basketballX = layout.sports['SITE__basketball-court'].location[0]
  const tennisX = layout.sports['SITE__tennis-court'].location[0]
  assert.ok(basketballX >= 22 && basketballX <= 28, 'basketball court must move into the upper-left open parcel')
  assert.ok(tennisX >= 10 && tennisX <= 16, 'tennis court must move into the upper-left open parcel')
  assert.ok(layout.sports['SITE__basketball-court'].location[1] <= -18, 'basketball court must sit behind the rear internal road')
  assert.ok(layout.sports['SITE__tennis-court'].location[1] <= -18, 'tennis court must sit behind the rear internal road')
  assert.ok(basketballX - tennisX - 8.6 >= 2, 'basketball and tennis courts need a clear pedestrian gap')
  assert.deepEqual(layout.gateBlockingTrees, [], 'gate entrance must keep a clear vehicle and sightline corridor')
  assert.equal(layout.entryCanopyIntrusions, 0, 'entry canopy must remain clear of perimeter crowns')
  assert.ok(layout.crownScaleVariants >= 5, `perimeter trees need at least five scale variants: ${layout.crownScaleVariants}`)
  assert.ok(layout.perimeterSpacingVariance >= .18, `perimeter spacing still reads as a rigid array: ${layout.perimeterSpacingVariance}`)
  assert.ok(layout.apronDimensions?.[0] >= 106 && layout.apronDimensions?.[1] >= 86, `landscape apron must extend beyond the campus ground: ${layout.apronDimensions}`)
  assert.ok(layout.forestMetrics.boundsX[0] >= -52 && layout.forestMetrics.boundsX[1] <= 52, `background forest must stay centered over its terrain: ${layout.forestMetrics.boundsX}`)
  assert.ok(layout.forestMetrics.rearCount >= 120, `rear forest needs enough depth for the reference composition: ${layout.forestMetrics.rearCount}`)
  assert.ok(layout.forestMetrics.westCount >= 18 && layout.forestMetrics.eastCount >= 18, `both side forest bands must close the orbit-view background: ${JSON.stringify(layout.forestMetrics)}`)
  assert.ok(layout.forestMetrics.uniqueCrownMeshes <= 3, `forest crowns should use linked mesh variants: ${layout.forestMetrics.uniqueCrownMeshes}`)
  assert.ok(layout.forestMetrics.uniqueTrunkMeshes <= 3, `forest trunks should use linked mesh variants: ${layout.forestMetrics.uniqueTrunkMeshes}`)
  assert.deepEqual(Object.keys(layout.siteObjects).sort(), [
    'LANDSCAPE__inner-tree-crown-01',
    'LANDSCAPE__inner-tree-trunk-01',
    'LANDSCAPE__rain-garden-01',
    'LANDSCAPE__rain-garden-grass-01-01',
    'LANDSCAPE__shrub-mass-01',
    'LANDSCAPE__tree-grate-01',
    'PARKING__wheel-stop-01',
    'PEDESTRIAN__walkway-01',
    'ROAD_DETAIL__crosswalk-01-01',
    'ROAD_DETAIL__direction-arrow-01-stem',
    'ROAD_DETAIL__drain-channel-01',
    'ROAD_DETAIL__inner-curb-01',
    'ROAD_DETAIL__stop-line-01',
  ])
  assert.equal(layout.siteObjects['ROAD_DETAIL__inner-curb-01'].parent, 'SITE__ground-and-roads')
  assert.equal(layout.siteObjects['LANDSCAPE__rain-garden-01'].parent, 'SITE__landscape')
  assert.ok(layout.siteObjects['PEDESTRIAN__walkway-01'].dimensions[0] >= 4, 'pedestrian connector must bridge a useful courtyard distance')
  assert.ok(layout.siteObjects['ROAD_DETAIL__drain-channel-01'].dimensions[0] >= 5, 'drainage channel must read as continuous infrastructure')
  assert.ok(layout.siteObjects['LANDSCAPE__rain-garden-01'].dimensions[0] >= 5, 'rain garden needs enough length to organize the internal road edge')
  assert.ok(layout.siteCounts.curbs >= 10, `internal roads need constructed curb edges: ${layout.siteCounts.curbs}`)
  assert.ok(layout.siteCounts.crosswalkStripes >= 16, `internal crossings need repeated zebra stripes: ${layout.siteCounts.crosswalkStripes}`)
  assert.ok(layout.siteCounts.wheelStops >= 10, `parking bays need physical wheel stops: ${layout.siteCounts.wheelStops}`)
  assert.equal(layout.siteCounts.rainGardens, 3)
  assert.ok(layout.siteCounts.grassClumps >= 24, `rain gardens need a readable ground layer: ${layout.siteCounts.grassClumps}`)
  assert.ok(layout.siteCounts.shrubs >= 24, `internal planting needs shrub massing: ${layout.siteCounts.shrubs}`)
  assert.ok(layout.siteCounts.innerTrees >= 12, `internal courtyards need a shade-tree layer: ${layout.siteCounts.innerTrees}`)
  assert.ok(layout.siteMaterials['MAT__safety-yellow'].roughness >= .62, 'road safety paint should be matte')
  assert.ok(layout.siteMaterials['MAT__bioswale-soil'].roughness >= .9, 'rain-garden soil should not look glossy')
  assert.ok(layout.siteMaterials['MAT__ornamental-grass'].color[1] > layout.siteMaterials['MAT__ornamental-grass'].color[0], 'ornamental grass needs a green-biased palette')
  assert.ok(layout.siteMaterials['MAT__shrub-deep'].color[1] > layout.siteMaterials['MAT__shrub-deep'].color[0], 'shrub mass needs a green-biased palette')
  assert.deepEqual(layout.motion, { motionPath: 'gate-lane', motionDistance: 10, motionSpeed: .09 })
  assert.deepEqual(layout.hardTreeCollisions, [], `trees must not intersect sports surfaces, parking, entry plaza, or building shells: ${JSON.stringify(layout.hardTreeCollisions)}`)
  assert.deepEqual(layout.roadTrunkCollisions, [], `tree trunks must remain outside major road surfaces: ${JSON.stringify(layout.roadTrunkCollisions)}`)
  const frontWarehouseLength = Math.round(layout.frontRowLengths['front-warehouse'] * 10) / 10
  assert.deepEqual(
    Object.values(layout.frontRowLengths).map(value => Math.round(value * 10) / 10),
    [frontWarehouseLength, frontWarehouseLength, frontWarehouseLength],
    `front-row buildings must match the raw-material warehouse length: ${JSON.stringify(layout.frontRowLengths)}`,
  )
  const bounds = Object.entries(layout.bounds)
  for (let left = 0; left < bounds.length; left += 1) {
    for (let right = left + 1; right < bounds.length; right += 1) {
      const [leftId, a] = bounds[left]
      const [rightId, b] = bounds[right]
      const gapX = Math.max(b[0] - a[1], a[0] - b[1])
      const gapY = Math.max(b[2] - a[3], a[2] - b[3])
      assert.ok(gapX >= 1 || gapY >= 1, `${leftId} and ${rightId} are too close: gapX=${gapX}, gapY=${gapY}`)
    }
  }
})

test('overlapping structural road meshes never export coplanar top faces', () => {
  const { output, blendPath } = getGeneratedFixture()
  const auditPath = join(output, 'road-depth-audit.json')
  const inspectExpression = [
    'import bpy,json,itertools',
    "roads=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith(('ROAD__segment-','ROAD__perimeter-'))]",
    "bounds=lambda o:(o.matrix_world.translation.x-o.dimensions.x/2,o.matrix_world.translation.x+o.dimensions.x/2,o.matrix_world.translation.y-o.dimensions.y/2,o.matrix_world.translation.y+o.dimensions.y/2)",
    "overlap=lambda a,b:min(bounds(a)[1],bounds(b)[1])-max(bounds(a)[0],bounds(b)[0])>.01 and min(bounds(a)[3],bounds(b)[3])-max(bounds(a)[2],bounds(b)[2])>.01",
    "top=lambda o:o.matrix_world.translation.z+o.dimensions.z/2",
    "coplanar=[[a.name,b.name,top(a),top(b)] for a,b in itertools.combinations(roads,2) if overlap(a,b) and abs(top(a)-top(b))<.008]",
    `open(${JSON.stringify(auditPath)},'w').write(json.dumps({'coplanar':coplanar}))`,
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(readFileSync(auditPath, 'utf8'))
  assert.deepEqual(audit.coplanar, [], `overlapping road tops can Z-fight: ${JSON.stringify(audit.coplanar)}`)
})

test('basketball and tennis courts occupy the upper-left parcel with usable fence gates', () => {
  const { blendPath } = getGeneratedFixture()
  const inspectExpression = [
    'import bpy,json',
    "roots=[bpy.data.objects[n] for n in ['SITE__basketball-court','SITE__tennis-court']]",
    "gates={name:{'parent':bpy.data.objects[name].parent.name if bpy.data.objects[name].parent else None,'interactive':bpy.data.objects[name].get('interactive'),'openAngle':bpy.data.objects[name].get('openAngle')} for name in ['BASKET__gate','TENNIS__gate'] if name in bpy.data.objects}",
    "leaves={name:{'parent':bpy.data.objects[name].parent.name,'dimensions':list(bpy.data.objects[name].dimensions)} for name in ['BASKET__gate-leaf','TENNIS__gate-leaf'] if name in bpy.data.objects}",
    "sportsMeshes=[o for root in roots for o in root.children_recursive if o.type=='MESH']",
    "obstacles=[o for o in bpy.data.objects if o.type=='MESH' and ('trunk' in o.name.lower() or o.name.endswith('__wall-shell') or o.name.startswith(('ROAD__segment-','ROAD__perimeter-')) or o.name in ['PARKING__surface','SITE__entry-plaza','PROCESS__equipment-pad'])]",
    "overlap=lambda a,b:all(abs(a.matrix_world.translation[i]-b.matrix_world.translation[i])<(a.dimensions[i]+b.dimensions[i])/2 for i in range(3))",
    "collisions=[[a.name,b.name] for a in sportsMeshes for b in obstacles if overlap(a,b)]",
    "result={'positions':{o.name:list(o.matrix_world.translation) for o in roots},'gates':gates,'leaves':leaves,'collisions':collisions}",
    "print('SPORTS_AUDIT='+json.dumps(result))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const sportsLine = inspected.stdout.split('\n').find(line => line.startsWith('SPORTS_AUDIT='))
  assert.ok(sportsLine, inspected.stderr || inspected.stdout)
  const sports = JSON.parse(sportsLine.slice('SPORTS_AUDIT='.length))
  assert.ok(sports.positions['SITE__basketball-court'][0] >= 22 && sports.positions['SITE__basketball-court'][0] <= 28)
  assert.ok(sports.positions['SITE__tennis-court'][0] >= 10 && sports.positions['SITE__tennis-court'][0] <= 16)
  assert.ok(sports.positions['SITE__basketball-court'][1] <= -18)
  assert.ok(sports.positions['SITE__tennis-court'][1] <= -18)
  assert.deepEqual(Object.keys(sports.gates).sort(), ['BASKET__gate', 'TENNIS__gate'])
  assert.deepEqual(Object.keys(sports.leaves).sort(), ['BASKET__gate-leaf', 'TENNIS__gate-leaf'])
  assert.equal(sports.gates['BASKET__gate'].parent, 'SITE__basketball-court')
  assert.equal(sports.gates['TENNIS__gate'].parent, 'SITE__tennis-court')
  assert.equal(sports.leaves['BASKET__gate-leaf'].parent, 'BASKET__gate')
  assert.equal(sports.leaves['TENNIS__gate-leaf'].parent, 'TENNIS__gate')
  assert.equal(sports.gates['BASKET__gate'].interactive, true)
  assert.equal(sports.gates['TENNIS__gate'].interactive, true)
  assert.ok(Math.abs(sports.gates['BASKET__gate'].openAngle) >= 1.2)
  assert.ok(Math.abs(sports.gates['TENNIS__gate'].openAngle) >= 1.2)
  assert.deepEqual(sports.collisions, [], `relocated courts must clear roads, buildings, equipment, and trees: ${JSON.stringify(sports.collisions)}`)
})

test('industrial process core and warehouse logistics create distinct operational zones', () => {
  const { output, blendPath } = getGeneratedFixture()
  const expansionPath = join(output, 'industrial-expansion.json')
  const inspectExpression = [
    'import bpy,json',
    "required=['SITE__process-core','PROCESS__tank-01','PROCESS__cooling-cell-01','PROCESS__scrubber-stack','PROCESS__substation-transformer-01','PROCESS__wastewater-basin','PROCESS__network-connector-01','PROCESS__substation-fence','SITE__logistics-yard','LOGISTICS__front-warehouse-apron','LOGISTICS__dock-platform-01','LOGISTICS__weighbridge','LOGISTICS__wheel-guide-01','LOGISTICS__pedestrian-safety-strip','VEHICLE__forklift-01','WAREHOUSE__loading-door-reveal-01','WAREHOUSE__door-header-01','WAREHOUSE__protective-plinth','WAREHOUSE__high-vent-01','LAB__curtain-wall','LAB__recessed-entry-frame','LAB__parapet-band','UTILITY__louver-bank-01','UTILITY__hazard-sign','UTILITY__equipment-plinth']",
    "objects={name:{'parent':bpy.data.objects[name].parent.name if bpy.data.objects.get(name) and bpy.data.objects[name].parent else None,'material':bpy.data.objects[name].data.materials[0].name if bpy.data.objects.get(name) and getattr(bpy.data.objects[name],'data',None) and hasattr(bpy.data.objects[name].data,'materials') and bpy.data.objects[name].data.materials else None,'layerRole':bpy.data.objects[name].get('layerRole') if bpy.data.objects.get(name) else None} for name in required if name in bpy.data.objects}",
    "counts={'tanks':sum(1 for i in range(1,4) if 'PROCESS__tank-%02d'%i in bpy.data.objects),'coolingCells':sum(1 for i in range(1,3) if 'PROCESS__cooling-cell-%02d'%i in bpy.data.objects),'transformers':sum(1 for i in range(1,3) if 'PROCESS__substation-transformer-%02d'%i in bpy.data.objects),'docks':sum(1 for i in range(1,4) if 'LOGISTICS__dock-platform-%02d'%i in bpy.data.objects),'pallets':sum(1 for o in bpy.data.objects if o.name.startswith('PROP__pallet-stack-'))}",
    "zoneRoots=[bpy.data.objects[n] for n in ['SITE__process-core','SITE__logistics-yard']]",
    "targets=[o for root in zoneRoots for o in root.children_recursive if o.type=='MESH']+[bpy.data.objects[n] for n in ['PROCESS__network-connector-01','PROCESS__network-connector-02']]",
    "trees=[o for o in bpy.data.objects if o.type=='MESH' and 'trunk' in o.name.lower()]",
    "shells=[o for o in bpy.data.objects if o.name.endswith('__wall-shell')]",
    "roads=[o for o in bpy.data.objects if o.type=='MESH' and (o.name.startswith(('ROAD__segment-','ROAD__perimeter-')) or o.name in ['COURT__surface','TENNIS__surface','PARKING__surface','SITE__entry-plaza'])]",
    "overlap=lambda a,b:abs(a.matrix_world.translation.x-b.matrix_world.translation.x)<(a.dimensions.x+b.dimensions.x)/2 and abs(a.matrix_world.translation.y-b.matrix_world.translation.y)<(a.dimensions.y+b.dimensions.y)/2 and abs(a.matrix_world.translation.z-b.matrix_world.translation.z)<(a.dimensions.z+b.dimensions.z)/2",
    "collisions={'trees':[[a.name,b.name] for a in trees for b in targets if overlap(a,b)],'buildings':[[a.name,b.name] for a in shells for b in targets if overlap(a,b)],'roads':[[a.name,b.name] for a in roads for b in targets if overlap(a,b)]}",
    "result={'objects':objects,'counts':counts,'collisions':collisions}",
    `open(${JSON.stringify(expansionPath)},'w').write(json.dumps(result))`,
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const expansion = JSON.parse(readFileSync(expansionPath, 'utf8'))
  assert.deepEqual(Object.keys(expansion.objects).sort(), [
    'LAB__curtain-wall',
    'LAB__parapet-band',
    'LAB__recessed-entry-frame',
    'LOGISTICS__dock-platform-01',
    'LOGISTICS__front-warehouse-apron',
    'LOGISTICS__pedestrian-safety-strip',
    'LOGISTICS__weighbridge',
    'LOGISTICS__wheel-guide-01',
    'PROCESS__cooling-cell-01',
    'PROCESS__network-connector-01',
    'PROCESS__scrubber-stack',
    'PROCESS__substation-fence',
    'PROCESS__substation-transformer-01',
    'PROCESS__tank-01',
    'PROCESS__wastewater-basin',
    'SITE__logistics-yard',
    'SITE__process-core',
    'UTILITY__equipment-plinth',
    'UTILITY__hazard-sign',
    'UTILITY__louver-bank-01',
    'VEHICLE__forklift-01',
    'WAREHOUSE__door-header-01',
    'WAREHOUSE__high-vent-01',
    'WAREHOUSE__loading-door-reveal-01',
    'WAREHOUSE__protective-plinth',
  ])
  assert.ok(expansion.counts.tanks >= 3, `expected three process tanks: ${JSON.stringify(expansion.counts)}`)
  assert.ok(expansion.counts.coolingCells >= 2, `expected two cooling cells: ${JSON.stringify(expansion.counts)}`)
  assert.ok(expansion.counts.transformers >= 2, `expected two transformers: ${JSON.stringify(expansion.counts)}`)
  assert.ok(expansion.counts.docks >= 3, `expected three loading docks: ${JSON.stringify(expansion.counts)}`)
  assert.ok(expansion.counts.pallets >= 4, `expected pallet staging props: ${JSON.stringify(expansion.counts)}`)
  assert.equal(expansion.objects['PROCESS__tank-01'].parent, 'SITE__process-core')
  assert.equal(expansion.objects['PROCESS__network-connector-01'].parent, 'SYSTEM__pipe-racks')
  assert.equal(expansion.objects['LOGISTICS__dock-platform-01'].parent, 'SITE__logistics-yard')
  assert.equal(expansion.objects['LAB__curtain-wall'].parent, 'BLDG__laboratory')
  for (const [name, record] of Object.entries(expansion.objects)) {
    if (!name.startsWith('SITE__') && !name.startsWith('VEHICLE__')) assert.ok(record.material, `${name} needs an exported material`)
  }
  for (const name of ['PROCESS__tank-01', 'PROCESS__cooling-cell-01', 'PROCESS__scrubber-stack', 'PROCESS__substation-transformer-01', 'PROCESS__wastewater-basin', 'PROCESS__network-connector-01']) {
    assert.ok(expansion.objects[name].layerRole, `${name} needs layerRole metadata`)
  }
  assert.deepEqual(expansion.collisions, { trees: [], buildings: [], roads: [] }, `industrial expansion must clear landscape, buildings, and roads: ${JSON.stringify(expansion.collisions)}`)
})

test('Blender scene uses semi-realistic industrial materials and construction details', () => {
  const { output, blendPath } = getGeneratedFixture()

  const realismPath = join(output, 'realism.json')
  const inspectExpression = [
    'import bpy,json',
    "details=['DETAIL__roof-rib-01','DETAIL__wall-plinth-01','DETAIL__gutter-01','DETAIL__downpipe-01','DETAIL__curb-01']",
    "props={name:{'roughness':s.inputs['Roughness'].default_value,'metallic':s.inputs['Metallic'].default_value,'transmission':s.inputs['Transmission Weight'].default_value,'coat':s.inputs['Coat Weight'].default_value} for name in ['MAT__roof','MAT__glass','MAT__asphalt','MAT__factory-wall'] for s in [next(n for n in bpy.data.materials[name].node_tree.nodes if n.type=='BSDF_PRINCIPLED')]}",
    "result={'details':{name:name in bpy.data.objects for name in details},'roof':props['MAT__roof'],'glass':props['MAT__glass'],'asphalt':props['MAT__asphalt'],'wall':props['MAT__factory-wall'],'camera':list(bpy.data.objects['ReferenceObliqueCamera'].location),'site':list(bpy.data.objects['SITE__ground'].dimensions)}",
    `open(${JSON.stringify(realismPath)},'w').write(json.dumps(result))`,
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const realism = JSON.parse(readFileSync(realismPath, 'utf8'))
  assert.deepEqual(realism.details, {
    'DETAIL__roof-rib-01': true,
    'DETAIL__wall-plinth-01': true,
    'DETAIL__gutter-01': true,
    'DETAIL__downpipe-01': true,
    'DETAIL__curb-01': true,
  })
  assert.ok(realism.roof.metallic <= 0.18 && realism.roof.roughness >= 0.55, `roof does not read as a light coated galvanized panel: ${JSON.stringify(realism.roof)}`)
  assert.ok(realism.glass.transmission >= 0.18 && realism.glass.coat >= 0.2, `glass lacks reflective depth: ${JSON.stringify(realism.glass)}`)
  assert.ok(realism.asphalt.roughness >= 0.9, `asphalt is too glossy: ${JSON.stringify(realism.asphalt)}`)
  assert.ok(realism.wall.roughness >= 0.52 && realism.wall.roughness <= 0.66, `painted wall needs a controlled coated-metal highlight: ${JSON.stringify(realism.wall)}`)
  assert.deepEqual(realism.camera.map(value => Math.round(value * 100) / 100), [-73.54, 76.37, 52], 'realism pass must preserve the doubled-site camera')
  assert.deepEqual(realism.site.map(value => Math.round(value * 100) / 100), [82.02, 59.4, 0.45], 'realism pass must preserve doubled site dimensions')
})

test('representative buildings expose layered facade construction instead of flat wall stickers', () => {
  const { output, blendPath } = getGeneratedFixture()

  const facadePath = join(output, 'facades.json')
  const inspectExpression = [
    'import bpy,json',
    "names=['MAIN__portal-frame-01','MAIN__loading-dock-platform','MAIN__sectional-door-frame-01','MAIN__wall-rib-front-01','MAIN__wall-rib-side-01','MAIN__clerestory-reveal-01','MAIN__clerestory-frame-top-01','MAIN__sectional-door-slat-01-01','MAIN__loading-canopy','MAIN__loading-canopy-bracket-01','MAIN__downpipe-01','MAIN__downpipe-stand-off-01-01','MAIN__safety-sign-loading','MAIN__exterior-light-01','ADMIN__window-reveal-01','ADMIN__window-frame-top-01','ADMIN__entrance-step-01','GATEHOUSE__window-reveal-01','GATEHOUSE__canopy-bracket-01','GATEHOUSE__bollard-01']",
    "objects={name:{'dimensions':list(bpy.data.objects[name].dimensions),'parent':bpy.data.objects[name].parent.name if bpy.data.objects[name].parent else None,'material':bpy.data.objects[name].data.materials[0].name} for name in names if name in bpy.data.objects}",
    "materials={name:{'roughness':next(n for n in bpy.data.materials[name].node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Roughness'].default_value,'metallic':next(n for n in bpy.data.materials[name].node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Metallic'].default_value} for name in ['MAT__facade-frame','MAT__wall-secondary','MAT__dock-rubber','MAT__wall-rib','MAT__safety-orange','MAT__luminaire'] if name in bpy.data.materials}",
    "counts={'frontRibs':sum(1 for o in bpy.data.objects if o.name.startswith('MAIN__wall-rib-front-')),'sideRibs':sum(1 for o in bpy.data.objects if o.name.startswith('MAIN__wall-rib-side-')),'doorSlats':sum(1 for o in bpy.data.objects if o.name.startswith('MAIN__sectional-door-slat-')),'clerestoryReveals':sum(1 for o in bpy.data.objects if o.name.startswith('MAIN__clerestory-reveal-'))}",
    "ids=['administration','main-production-hall','laboratory','gatehouse']",
    "constructed={id:{'frames':sum(1 for o in bpy.data.objects if o.name.startswith('FACADE__'+id+'__frame-')),'reveals':sum(1 for o in bpy.data.objects if o.name.startswith('FACADE__'+id+'__reveal-')),'gutters':sum(1 for o in bpy.data.objects if o.name.startswith('ROOF__'+id+'__gutter-')),'downpipes':sum(1 for o in bpy.data.objects if o.name.startswith('SERVICE__'+id+'__downpipe-')),'parent':bpy.data.objects.get('FACADE__'+id+'__frame-01').parent.name if bpy.data.objects.get('FACADE__'+id+'__frame-01') else None} for id in ids}",
    "landmarkNames=['ADMIN__grand-atrium','ADMIN__grand-canopy','ADMIN__crown-band','ADMIN__roof-lantern']",
    "landmark={name:{'dimensions':list(bpy.data.objects[name].dimensions),'parent':bpy.data.objects[name].parent.name,'material':bpy.data.objects[name].data.materials[0].name} for name in landmarkNames if name in bpy.data.objects}",
    "landmarkCounts={'columns':sum(1 for o in bpy.data.objects if o.name.startswith('ADMIN__portico-column-') and '-base-' not in o.name),'steps':sum(1 for o in bpy.data.objects if o.name.startswith('ADMIN__entrance-step-'))}",
    "adminShell=list(bpy.data.objects['administration__wall-shell'].dimensions)",
    "result={'objects':objects,'materials':materials,'counts':counts,'constructed':constructed,'landmark':landmark,'landmarkCounts':landmarkCounts,'adminShell':adminShell}",
    `open(${JSON.stringify(facadePath)},'w').write(json.dumps(result))`,
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const facade = JSON.parse(readFileSync(facadePath, 'utf8'))
  assert.deepEqual(Object.keys(facade.objects).sort(), [
    'ADMIN__entrance-step-01',
    'ADMIN__window-frame-top-01',
    'ADMIN__window-reveal-01',
    'GATEHOUSE__bollard-01',
    'GATEHOUSE__canopy-bracket-01',
    'GATEHOUSE__window-reveal-01',
    'MAIN__clerestory-frame-top-01',
    'MAIN__clerestory-reveal-01',
    'MAIN__downpipe-01',
    'MAIN__downpipe-stand-off-01-01',
    'MAIN__exterior-light-01',
    'MAIN__loading-canopy',
    'MAIN__loading-canopy-bracket-01',
    'MAIN__loading-dock-platform',
    'MAIN__portal-frame-01',
    'MAIN__safety-sign-loading',
    'MAIN__sectional-door-frame-01',
    'MAIN__sectional-door-slat-01-01',
    'MAIN__wall-rib-front-01',
    'MAIN__wall-rib-side-01',
  ])
  assert.equal(facade.objects['MAIN__loading-dock-platform'].parent, 'BLDG__main-production-hall')
  assert.ok(facade.objects['MAIN__loading-dock-platform'].dimensions[1] >= 0.65, 'loading dock must project from the wall')
  assert.ok(facade.objects['ADMIN__window-reveal-01'].dimensions[1] >= 0.12, 'administration windows need physical reveal depth')
  assert.ok(facade.objects['GATEHOUSE__canopy-bracket-01'].dimensions[1] >= 0.45, 'gatehouse canopy brackets need visible projection')
  assert.equal(facade.objects['MAIN__wall-rib-front-01'].parent, 'BLDG__main-production-hall')
  assert.ok(facade.objects['MAIN__clerestory-reveal-01'].dimensions[1] >= 0.14, 'clerestory windows need a visibly recessed opening')
  assert.ok(facade.objects['MAIN__loading-canopy'].dimensions[1] >= 1.0, 'loading canopy must cast a useful facade shadow')
  assert.ok(facade.counts.frontRibs >= 24, `main hall needs a readable corrugated front wall rhythm: ${facade.counts.frontRibs}`)
  assert.ok(facade.counts.sideRibs >= 8, `main hall needs corrugation on the camera-visible side: ${facade.counts.sideRibs}`)
  assert.ok(facade.counts.doorSlats >= 15, `sectional doors need physical horizontal panel joints: ${facade.counts.doorSlats}`)
  assert.ok(facade.counts.clerestoryReveals >= 7, `clerestory openings need repeated constructed depth: ${facade.counts.clerestoryReveals}`)
  assert.ok(facade.materials['MAT__facade-frame'].metallic >= 0.55, 'facade frames should read as coated metal')
  assert.ok(facade.materials['MAT__wall-secondary'].roughness >= 0.65, 'secondary wall panels should remain matte')
  assert.ok(facade.materials['MAT__dock-rubber'].roughness >= 0.85, 'dock bumpers should read as rubber')
  assert.ok(facade.materials['MAT__wall-rib'].metallic >= 0.45, 'wall ribs should read as coated sheet metal')
  assert.ok(facade.materials['MAT__safety-orange'].roughness <= 0.52, 'safety signs need a durable enamel finish')
  assert.ok(facade.materials['MAT__luminaire'].roughness <= 0.34, 'exterior light lenses need a crisp highlight')
  assert.ok(facade.adminShell[0] >= 8.3 && facade.adminShell[1] >= 5.3 && facade.adminShell[2] >= 6.1, `administration massing lacks landmark scale: ${facade.adminShell}`)
  assert.deepEqual(Object.keys(facade.landmark).sort(), ['ADMIN__crown-band', 'ADMIN__grand-atrium', 'ADMIN__grand-canopy', 'ADMIN__roof-lantern'])
  assert.equal(facade.landmark['ADMIN__grand-atrium'].parent, 'BLDG__administration')
  assert.ok(facade.landmark['ADMIN__grand-atrium'].dimensions[2] >= facade.adminShell[2] * .72, 'atrium glazing needs near-full-height presence')
  assert.ok(facade.landmark['ADMIN__grand-canopy'].dimensions[1] >= 1.2, 'grand canopy must project enough to create a ceremonial entrance')
  assert.equal(facade.landmark['ADMIN__crown-band'].material, 'MAT__limestone-light')
  assert.ok(facade.landmarkCounts.columns >= 4, 'administration entrance needs four portico columns')
  assert.ok(facade.landmarkCounts.steps >= 3, 'administration entrance needs a broad three-step procession')
  for (const [id, record] of Object.entries(facade.constructed)) {
    assert.ok(record.frames >= 2, `${id} needs a constructed facade frame rhythm`)
    assert.ok(record.reveals >= 2, `${id} needs recessed facade openings`)
    assert.ok(record.gutters >= 1, `${id} needs a roof gutter`)
    assert.ok(record.downpipes >= 2, `${id} needs paired downpipes`)
    assert.equal(record.parent, `BLDG__${id}`)
  }
})

test('every building exports constructed light PBR cladding with dark physical joints', () => {
  const { output, blendPath } = getGeneratedFixture()

  const claddingPath = join(output, 'wall-cladding.json')
  const ids = buildingRegistry.map(({ id }) => id)
  const inspectExpression = [
    'import bpy,json',
    `ids=${JSON.stringify(ids)}`,
    "records={id:{'front':sum(1 for o in bpy.data.objects if o.name.startswith('CLADDING__'+id+'__front-panel-')),'left':sum(1 for o in bpy.data.objects if o.name.startswith('CLADDING__'+id+'__left-panel-')),'frontJoints':sum(1 for o in bpy.data.objects if o.name.startswith('CLADDING__'+id+'__front-shadow-joint-')),'leftJoints':sum(1 for o in bpy.data.objects if o.name.startswith('CLADDING__'+id+'__left-shadow-joint-')),'battens':sum(1 for o in bpy.data.objects if o.name.startswith('CLADDING__'+id+'__pressed-batten-')),'hasSkirt':'CLADDING__'+id+'__wall-skirt-front' in bpy.data.objects,'hasCorner':'CLADDING__'+id+'__corner-trim-left' in bpy.data.objects,'frontParent':bpy.data.objects.get('CLADDING__'+id+'__front-panel-01').parent.name if bpy.data.objects.get('CLADDING__'+id+'__front-panel-01') else None} for id in ids}",
    "mainMaterials=[bpy.data.objects[name].data.materials[0].name for name in ['CLADDING__main-production-hall__front-panel-01','CLADDING__main-production-hall__front-panel-02'] if name in bpy.data.objects]",
    "wallColor=list(bpy.data.materials['MAT__factory-wall'].diffuse_color)",
    "materialNames=[name for name in ['MAT__factory-panel-light','MAT__factory-panel-mid','MAT__corner-flashing','MAT__facade-shadow-joint','MAT__wall-pressed-batten'] if name in bpy.data.materials]",
    "jointMaterial=bpy.data.materials.get('MAT__facade-shadow-joint')",
    "jointShader=next((n for n in jointMaterial.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) if jointMaterial else None",
    "result={'records':records,'mainMaterials':mainMaterials,'wallColor':wallColor,'materialNames':materialNames,'jointColor':list(jointMaterial.diffuse_color) if jointMaterial else None,'jointRoughness':jointShader.inputs['Roughness'].default_value if jointShader else None}",
    `open(${JSON.stringify(claddingPath)},'w').write(json.dumps(result))`,
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const cladding = JSON.parse(readFileSync(claddingPath, 'utf8'))
  for (const id of ids) {
    const record = cladding.records[id]
    assert.ok(record.front >= 2, `${id} needs modular front wall panels`)
    assert.ok(record.left >= 2, `${id} needs modular left wall panels`)
    assert.equal(record.hasSkirt, true, `${id} needs a durable lower wall skirt`)
    assert.equal(record.hasCorner, true, `${id} needs visible corner flashing`)
    assert.equal(record.frontParent, `BLDG__${id}`, `${id} cladding must follow the building exterior during floor explosion`)
    assert.equal(record.frontJoints, record.front - 1, `${id} front panels need physical shadow joints`)
    assert.equal(record.leftJoints, record.left - 1, `${id} left panels need physical shadow joints`)
    assert.ok(record.battens >= 8, `${id} needs pressed horizontal wall battens on all four elevations`)
  }
  assert.deepEqual(cladding.mainMaterials, ['MAT__factory-panel-light', 'MAT__factory-panel-mid'])
  assert.deepEqual(cladding.materialNames.sort(), ['MAT__corner-flashing', 'MAT__facade-shadow-joint', 'MAT__factory-panel-light', 'MAT__factory-panel-mid', 'MAT__wall-pressed-batten'])
  const wallAverage = cladding.wallColor.slice(0, 3).reduce((sum, value) => sum + value, 0) / 3
  assert.ok(wallAverage >= 0.86 && wallAverage <= 0.94, `base wall needs a pale near-white PBR value: ${cladding.wallColor}`)
  assert.ok(cladding.jointColor.slice(0, 3).reduce((sum, value) => sum + value, 0) / 3 <= .18, `facade joints need darker physical separation: ${cladding.jointColor}`)
  assert.ok(cladding.jointRoughness >= .68, `facade shadow joints should remain matte: ${cladding.jointRoughness}`)
})

test('every building exports a complete four-sided constructed envelope', () => {
  const { output, blendPath } = getGeneratedFixture()
  const auditPath = join(output, 'four-sided-envelope.json')
  const ids = buildingRegistry.map(({ id }) => id)
  const faces = ['front', 'rear', 'left', 'right']
  const corners = ['corner-trim-left', 'corner-trim-right', 'corner-trim-rear-left', 'corner-trim-rear-right']
  const inspectExpression = [
    'import bpy,json',
    `ids=${JSON.stringify(ids)}`,
    `faces=${JSON.stringify(faces)}`,
    `corners=${JSON.stringify(corners)}`,
    "records={id:{face:{'panels':sum(1 for o in bpy.data.objects if o.name.startswith('CLADDING__'+id+'__'+face+'-panel-')),'joints':sum(1 for o in bpy.data.objects if o.name.startswith('CLADDING__'+id+'__'+face+'-shadow-joint-')),'battens':sum(1 for o in bpy.data.objects if o.name.startswith('CLADDING__'+id+'__pressed-batten-'+face+'-')),'skirt':('CLADDING__'+id+'__wall-skirt-'+face) in bpy.data.objects,'parent':bpy.data.objects.get('CLADDING__'+id+'__'+face+'-panel-01').parent.name if bpy.data.objects.get('CLADDING__'+id+'__'+face+'-panel-01') else None} for face in faces} for id in ids}",
    "cornerRecords={id:{corner:('CLADDING__'+id+'__'+corner) in bpy.data.objects for corner in corners} for id in ids}",
    `open(${JSON.stringify(auditPath)},'w').write(json.dumps({'records':records,'corners':cornerRecords}))`,
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(readFileSync(auditPath, 'utf8'))
  for (const id of ids) {
    for (const face of faces) {
      const record = audit.records[id][face]
      assert.ok(record.panels >= 2, `${id} needs modular ${face} wall panels`)
      assert.equal(record.joints, record.panels - 1, `${id} ${face} panels need physical shadow joints`)
      assert.ok(record.battens >= 2, `${id} ${face} elevation needs pressed horizontal battens`)
      assert.equal(record.skirt, true, `${id} ${face} elevation needs a durable lower wall skirt`)
      assert.equal(record.parent, `BLDG__${id}`, `${id} ${face} cladding must remain attached to its building root`)
    }
    for (const corner of corners) {
      assert.equal(audit.corners[id][corner], true, `${id} needs ${corner}`)
    }
  }
})

test('major building envelopes export measurable opening and roof construction depth', () => {
  const { output, blendPath } = getGeneratedFixture()
  const auditPath = join(output, 'construction-depth.json')
  const ids = buildingRegistry.map(({ id }) => id)
  const requiredRoles = [
    'opening-reveal',
    'window-sill',
    'drip-edge',
    'corner-flashing',
    'wall-plinth',
    'roof-parapet',
    'roof-drainage',
  ]
  const inspectExpression = [
    'import bpy,json',
    `ids=${JSON.stringify(ids)}`,
    `roles=${JSON.stringify(requiredRoles)}`,
    "records={}",
    "for id in ids:",
    " root=bpy.data.objects['BLDG__'+id]",
    " owned=[o for o in bpy.data.objects if o.parent==root]",
    " role_counts={role:sum(1 for o in owned if o.get('constructionRole')==role) for role in roles}",
    " reveal=bpy.data.objects.get('FACADE__'+id+'__reveal-01')",
    " glass=bpy.data.objects.get('FACADE__'+id+'__glass-01')",
    " door=bpy.data.objects.get(id+'__door-01')",
    " edge_widths=[m.width for o in owned if o.get('constructionRole') in ['drip-edge','corner-flashing','roof-parapet'] for m in o.modifiers if m.type=='BEVEL']",
    " records[id]={'roles':role_counts,'revealDepth':reveal.get('openingDepth') if reveal else None,'glassSetback':reveal.get('openingDepth') if reveal and glass else None,'doorSetback':door.get('openingDepth') if door else None,'edgeWidths':edge_widths,'parents':sorted(set(o.parent.name for o in owned if o.get('constructionRole')))}",
    `open(${JSON.stringify(auditPath)},'w').write(json.dumps(records))`,
  ].join('\n')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const records = JSON.parse(readFileSync(auditPath, 'utf8'))
  for (const id of ids) {
    const record = records[id]
    for (const role of requiredRoles) {
      assert.ok(record.roles[role] >= 1, `${id} is missing ${role} construction`)
    }
    assert.ok(record.roles['corner-flashing'] >= 4, `${id} needs four constructed corner flashings`)
    assert.ok(record.roles['wall-plinth'] >= 4, `${id} needs a four-sided wall plinth`)
    assert.ok(record.roles['roof-parapet'] >= 4, `${id} needs a complete roof parapet`)
    assert.ok(record.roles['roof-drainage'] >= 8, `${id} needs gutters and paired front/rear downpipes`)
    assert.ok(record.revealDepth >= .08 && record.revealDepth <= .15, `${id} reveal depth is not credible: ${record.revealDepth}`)
    assert.ok(record.glassSetback >= .08 && record.glassSetback <= .15, `${id} glazing is not recessed: ${record.glassSetback}`)
    assert.ok(record.doorSetback >= .08 && record.doorSetback <= .15, `${id} door is not recessed: ${record.doorSetback}`)
    assert.ok(record.edgeWidths.length >= 9, `${id} needs measurable bevels on exposed construction edges`)
    assert.ok(record.edgeWidths.every(width => width >= .025 && width <= .08), `${id} exposes out-of-range bevel widths: ${record.edgeWidths}`)
    assert.deepEqual(record.parents, [`BLDG__${id}`], `${id} construction must stay attached to the interactive building root`)
  }
})

test('secondary elevations expose service access drainage and ventilation', () => {
  const { output, blendPath } = getGeneratedFixture()
  const auditPath = join(output, 'secondary-elevations.json')
  const ids = buildingRegistry.map(({ id }) => id)
  const factoryIds = [
    'main-production-hall',
    'central-processing-hall',
    'rear-high-bay',
    'north-east-workshop',
    'east-process-hall',
    'far-east-utility',
    'east-warehouse',
    'front-warehouse',
    'front-utility-annex',
  ]
  const officeIds = ['laboratory', 'administration', 'gatehouse']
  const inspectExpression = [
    'import bpy,json',
    `ids=${JSON.stringify(ids)}`,
    `factory_ids=${JSON.stringify(factoryIds)}`,
    `office_ids=${JSON.stringify(officeIds)}`,
    "records={id:{'rearDoor':('SERVICE__'+id+'__rear-door') in bpy.data.objects,'rearDoorParent':bpy.data.objects.get('SERVICE__'+id+'__rear-door').parent.name if bpy.data.objects.get('SERVICE__'+id+'__rear-door') else None,'gutters':{face:('ROOF__'+id+'__gutter-'+face) in bpy.data.objects for face in ['front','rear','left','right']},'rearDownpipes':sum(1 for o in bpy.data.objects if o.name.startswith('SERVICE__'+id+'__downpipe-rear-'))} for id in ids}",
    "factoryDetails={id:('SERVICE__'+id+'__right-louver-bank') in bpy.data.objects for id in factory_ids}",
    "officeDetails={id:('SERVICE__'+id+'__right-window-01') in bpy.data.objects for id in office_ids}",
    `open(${JSON.stringify(auditPath)},'w').write(json.dumps({'records':records,'factoryDetails':factoryDetails,'officeDetails':officeDetails}))`,
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(readFileSync(auditPath, 'utf8'))
  for (const id of ids) {
    assert.equal(audit.records[id].rearDoor, true, `${id} needs a rear service door`)
    assert.equal(audit.records[id].rearDoorParent, `BLDG__${id}`, `${id} rear service door must follow its building root`)
    assert.deepEqual(audit.records[id].gutters, { front: true, rear: true, left: true, right: true }, `${id} needs drainage on every roof edge`)
    assert.ok(audit.records[id].rearDownpipes >= 2, `${id} needs paired rear downpipes`)
  }
  for (const id of factoryIds) assert.equal(audit.factoryDetails[id], true, `${id} needs a right-side louver bank`)
  for (const id of officeIds) assert.equal(audit.officeDetails[id], true, `${id} needs a right-side service window`)
})

test('building wall palette retains relief under the Web day lighting', () => {
  const { output, blendPath } = getGeneratedFixture()
  const auditPath = join(output, 'wall-palette.json')
  const materialFamilies = [
    ['MAT__factory-panel-light', 'MAT__factory-panel-mid'],
    ['MAT__warehouse-panel-light', 'MAT__warehouse-panel-mid'],
    ['MAT__process-panel-light', 'MAT__process-panel-mid'],
    ['MAT__utility-panel-light', 'MAT__utility-panel-mid'],
    ['MAT__laboratory-panel-light', 'MAT__laboratory-panel-mid'],
    ['MAT__limestone-light', 'MAT__limestone-shadow'],
  ]
  const materialNames = materialFamilies.flat()
  const inspectExpression = [
    'import bpy,json',
    `names=${JSON.stringify(materialNames)}`,
    "colors={name:list(bpy.data.materials[name].diffuse_color)[:3] for name in names}",
    `open(${JSON.stringify(auditPath)},'w').write(json.dumps(colors))`,
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const colors = JSON.parse(readFileSync(auditPath, 'utf8'))
  const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length
  for (const [lightName, midName] of materialFamilies) {
    assert.ok(average(colors[lightName]) >= .86 && average(colors[lightName]) <= .97, `${lightName} needs a controlled pale-white value under the Web day exposure: ${colors[lightName]}`)
    assert.ok(average(colors[lightName]) - average(colors[midName]) >= .06, `${lightName}/${midName} need visible but restrained value separation`)
  }
})

test('architectural PBR maps retain visible medium-scale variation after Web mipmapping', () => {
  const { output, blendPath } = getGeneratedFixture()
  const auditPath = join(output, 'architectural-texture-contrast.json')
  const inspectExpression = [
    'import bpy,json,math',
    "names=['PBR__architectural__industrial-coated-metal__factory_wall__base-color','PBR__architectural__warehouse-sandwich-panel__warehouse_wall__base-color','PBR__architectural__administration-limestone__admin_wall__base-color']",
    "stats={}",
    "exec(\"for name in names:\\n image=bpy.data.images[name]\\n values=list(image.pixels)\\n lum=[sum(values[i:i+3])/3 for i in range(0,len(values),4)]\\n mean=sum(lum)/len(lum)\\n stats[name]={'mean':mean,'std':math.sqrt(sum((v-mean)**2 for v in lum)/len(lum))}\")",
    "objects=['main-production-hall__wall-shell','front-warehouse__wall-shell','administration__wall-shell']",
    "uvRepeat={name:list(bpy.data.objects[name].data.get('architecturalPbrUvRepeat',(0,0))) for name in objects}",
    `open(${JSON.stringify(auditPath)},'w').write(json.dumps({'stats':stats,'uvRepeat':uvRepeat}))`,
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(readFileSync(auditPath, 'utf8'))
  for (const [name, stats] of Object.entries(audit.stats)) {
    assert.ok(stats.mean >= .72 && stats.mean <= .9, `${name} must remain an off-white industrial finish: ${JSON.stringify(stats)}`)
    assert.ok(stats.std >= .015, `${name} variation disappears after mipmapping: ${JSON.stringify(stats)}`)
  }
  assert.ok(audit.uvRepeat['main-production-hall__wall-shell'][0] <= 12, 'factory wall texture repeats too densely to retain medium-scale variation')
  assert.ok(audit.uvRepeat['front-warehouse__wall-shell'][0] <= 8, 'warehouse wall texture repeats too densely to retain medium-scale variation')
  assert.ok(audit.uvRepeat['administration__wall-shell'][0] <= 8, 'administration stone repeats too densely to retain natural variation')
})

test('Blender floors contain use-specific interiors and walking staff', () => {
  const { output, blendPath } = getGeneratedFixture()

  const interiorsPath = join(output, 'floor-interiors.json')
  const floorRecords = buildingRegistry.flatMap((building) => building.floors.map((floor) => ({ buildingId: building.id, floorId: floor.id })))
  const inspectExpression = [
    'import bpy,json',
    `floors=${JSON.stringify(floorRecords)}`,
    "records={f['buildingId']+'__'+f['floorId']:{'interior':('INTERIOR__'+f['buildingId']+'__'+f['floorId']) in bpy.data.objects,'interiorParent':bpy.data.objects.get('INTERIOR__'+f['buildingId']+'__'+f['floorId']).parent.name if bpy.data.objects.get('INTERIOR__'+f['buildingId']+'__'+f['floorId']) else None,'props':sum(1 for o in bpy.data.objects if o.name.startswith('PROP__'+f['buildingId']+'__'+f['floorId']+'__')),'walker':('WALKER__'+f['buildingId']+'__'+f['floorId']+'__01') in bpy.data.objects,'walkerParent':bpy.data.objects.get('WALKER__'+f['buildingId']+'__'+f['floorId']+'__01').parent.name if bpy.data.objects.get('WALKER__'+f['buildingId']+'__'+f['floorId']+'__01') else None,'walkerScale':list(bpy.data.objects.get('WALKER__'+f['buildingId']+'__'+f['floorId']+'__01').scale) if bpy.data.objects.get('WALKER__'+f['buildingId']+'__'+f['floorId']+'__01') else None,'motion':{k:bpy.data.objects.get('WALKER__'+f['buildingId']+'__'+f['floorId']+'__01').get(k) for k in ['motionPath','motionDistance','motionSpeed','motionPhase']} if bpy.data.objects.get('WALKER__'+f['buildingId']+'__'+f['floorId']+'__01') else None,'spaceRole':bpy.data.objects[f\"FLOOR_MESH__{f['buildingId']}__{f['floorId']}__space\"].get('layerRole'),'sectionHeightRatio':bpy.data.objects[f\"FLOOR_MESH__{f['buildingId']}__{f['floorId']}__space\"].get('sectionHeightRatio')} for f in floors}",
    "required=['PROP__main-production-hall__L01__process-skid-01','PROP__main-production-hall__L01__worktable-01','PROP__front-warehouse__L01__rack-01','PROP__front-warehouse__L01__packing-table-01','PROP__administration__L02__desk-01','PROP__administration__L02__sofa-01','PROP__administration__L02__coffee-table-01','PROP__laboratory__L02__lab-bench-01','PROP__main-production-hall__RF__hvac-01','PROP__gatehouse__L01__checkpoint-desk-01']",
    "patrols=[o for o in bpy.data.objects if o.name.startswith('PATROL__campus-') and o.get('motionPath')=='site-patrol']",
    "gate=bpy.data.objects.get('GATE__barrier-inbound')",
    "zoneNames=['ZONE__administration__L02__open-office','ZONE__administration__L02__lounge','ZONE__main-production-hall__L01__process-line','ZONE__main-production-hall__L01__inspection-aisle','ZONE__front-warehouse__L01__packing']",
    "zones={name:{'exists':name in bpy.data.objects,'usage':bpy.data.objects[name].get('usage') if name in bpy.data.objects else None,'clearAisleWidth':bpy.data.objects[name].get('clearAisleWidth') if name in bpy.data.objects else None} for name in zoneNames}",
    "result={'records':records,'required':{name:name in bpy.data.objects for name in required},'materials':[name for name in ['MAT__interior-equipment','MAT__interior-worktop','MAT__workwear','MAT__safety-vest','MAT__hardhat'] if name in bpy.data.materials],'patrols':[{'name':o.name,'motionPath':o.get('motionPath'),'motionAxis':o.get('motionAxis'),'distance':o.get('motionDistance')} for o in patrols],'gate':{k:gate.get(k) for k in ['motionPath','motionAxis','motionSpeed','closedAngle','openAngle']} if gate else None,'zones':zones}",
    `open(${JSON.stringify(interiorsPath)},'w').write(json.dumps(result))`,
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const interiors = JSON.parse(readFileSync(interiorsPath, 'utf8'))
  for (const { buildingId, floorId } of floorRecords) {
    const record = interiors.records[`${buildingId}__${floorId}`]
    assert.equal(record.interior, true, `missing interior group for ${buildingId} ${floorId}`)
    assert.equal(record.interiorParent, `FLOOR__${buildingId}__${floorId}`)
    assert.ok(record.props >= 2, `${buildingId} ${floorId} needs at least two interior props`)
    assert.equal(record.spaceRole, 'floor-volume')
    assert.ok(record.sectionHeightRatio >= .78, `${buildingId} ${floorId} floor section is still too low`)
    if (floorId === 'RF') {
      assert.equal(record.walker, false, `${buildingId} ${floorId} should not have a routine walker`)
    } else {
      assert.equal(record.walker, true, `missing walker for ${buildingId} ${floorId}`)
      assert.equal(record.walkerParent, `INTERIOR__${buildingId}__${floorId}`)
      assert.ok(record.walkerScale.every((value) => value >= 1.3), `${buildingId} ${floorId} walker is too small for the dashboard camera`)
      assert.equal(record.motion.motionPath, 'floor-walk')
      assert.ok(record.motion.motionDistance > 0)
      assert.ok(record.motion.motionSpeed > 0)
    }
  }
  assert.ok(Object.values(interiors.required).every(Boolean), `missing typed interior props: ${JSON.stringify(interiors.required)}`)
  assert.ok(interiors.patrols.length >= 3, 'campus needs at least three outdoor patrol walkers')
  assert.ok(interiors.patrols.every((patrol) => patrol.motionPath === 'site-patrol' && patrol.distance > 0))
  assert.deepEqual(interiors.gate, { motionPath: 'gate-barrier', motionAxis: 'z', motionSpeed: .09, closedAngle: 0, openAngle: 1.22 })
  for (const [name, zone] of Object.entries(interiors.zones)) {
    assert.equal(zone.exists, true, `missing functional interior zone ${name}`)
    assert.ok(zone.usage, `${name} needs explicit usage metadata`)
    assert.ok(zone.clearAisleWidth >= .55, `${name} needs at least .55 clear aisle width`)
  }
  assert.deepEqual(interiors.materials.sort(), ['MAT__hardhat', 'MAT__interior-equipment', 'MAT__interior-worktop', 'MAT__safety-vest', 'MAT__workwear'])
})

test('Blender GLB exports an interactive floor hierarchy without changing the approved layout', () => {
  const { output, glbPath } = getGeneratedFixture()

  const hierarchyPath = join(output, 'floor-hierarchy.json')
  const inspectExpression = [
    'import bpy,json',
    'bpy.ops.object.select_all(action="SELECT")',
    'bpy.ops.object.delete(use_global=False)',
    `bpy.ops.import_scene.gltf(filepath=${JSON.stringify(glbPath)})`,
    "floors=[o for o in bpy.context.scene.objects if o.name.startswith('FLOOR__')]",
    "records={o.name:{'buildingId':o.get('buildingId'),'floorId':o.get('floorId'),'floorName':o.get('floorName'),'usage':o.get('usage'),'level':o.get('level'),'interactive':o.get('interactive'),'meshChildren':sum(1 for child in o.children if child.type=='MESH')} for o in floors}",
    "result={'records':records,'admin':[o.name for o in floors if o.get('buildingId')=='administration'],'site':list(bpy.data.objects['SITE__ground'].dimensions)}",
    `open(${JSON.stringify(hierarchyPath)},'w').write(json.dumps(result))`,
  ].join(';')
  const inspected = spawnSync(BLENDER, ['--background', '--factory-startup', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const hierarchy = JSON.parse(readFileSync(hierarchyPath, 'utf8'))
  for (const building of buildingRegistry) {
    for (const floor of building.floors) {
      const nodeName = `FLOOR__${building.id}__${floor.id}`
      assert.deepEqual(hierarchy.records[nodeName], {
        buildingId: building.id,
        floorId: floor.id,
        floorName: floor.name,
        usage: floor.usage,
        level: floor.level,
        interactive: true,
        meshChildren: 3,
      }, `missing or incomplete floor node ${nodeName}`)
    }
  }
  assert.deepEqual(hierarchy.admin.sort(), [
    'FLOOR__administration__L01',
    'FLOOR__administration__L02',
    'FLOOR__administration__L03',
  ])
  assert.deepEqual(hierarchy.site.map(value => Math.round(value * 100) / 100), [82.02, 59.4, 0.45])
})

test('every building has a road-connected access spur with safety infrastructure', () => {
  const { output, blendPath } = getGeneratedFixture()
  const accessPath = join(output, 'building-access.json')
  const ids = buildingRegistry.map(({ id }) => id)
  const inspectExpression = [
    'import bpy,json',
    `ids=${JSON.stringify(ids)}`,
    "bounds=lambda o:[o.matrix_world.translation.x-o.dimensions.x/2,o.matrix_world.translation.x+o.dimensions.x/2,o.matrix_world.translation.y-o.dimensions.y/2,o.matrix_world.translation.y+o.dimensions.y/2]",
    "gap=lambda a,b:[max(b[0]-a[1],a[0]-b[1],0),max(b[2]-a[3],a[2]-b[3],0)]",
    "touch=lambda a,b:max(gap(bounds(a),bounds(b)))<=0.12",
    "records={id:{'spur':('ACCESS__'+id+'__spur') in bpy.data.objects,'apron':('ACCESS__'+id+'__apron') in bpy.data.objects,'buildingId':bpy.data.objects.get('ACCESS__'+id+'__spur').get('buildingId') if bpy.data.objects.get('ACCESS__'+id+'__spur') else None,'targetRoad':bpy.data.objects.get('ACCESS__'+id+'__spur').get('targetRoad') if bpy.data.objects.get('ACCESS__'+id+'__spur') else None,'layerRole':bpy.data.objects.get('ACCESS__'+id+'__spur').get('layerRole') if bpy.data.objects.get('ACCESS__'+id+'__spur') else None,'touchesApron':touch(bpy.data.objects['ACCESS__'+id+'__spur'],bpy.data.objects['ACCESS__'+id+'__apron']) if ('ACCESS__'+id+'__spur') in bpy.data.objects and ('ACCESS__'+id+'__apron') in bpy.data.objects else False,'touchesBuilding':touch(bpy.data.objects['ACCESS__'+id+'__apron'],bpy.data.objects[id+'__wall-shell']) if ('ACCESS__'+id+'__apron') in bpy.data.objects else False,'touchesRoad':touch(bpy.data.objects['ACCESS__'+id+'__spur'],bpy.data.objects[bpy.data.objects['ACCESS__'+id+'__spur'].get('targetRoad')]) if ('ACCESS__'+id+'__spur') in bpy.data.objects and bpy.data.objects['ACCESS__'+id+'__spur'].get('targetRoad') in bpy.data.objects else False} for id in ids}",
    "spurs=[bpy.data.objects['ACCESS__'+id+'__spur'] for id in ids if ('ACCESS__'+id+'__spur') in bpy.data.objects]",
    "shells=[o for o in bpy.data.objects if o.name.endswith('__wall-shell')]",
    "intrusions=[[spur.name,shell.name] for spur in spurs for shell in shells if not shell.name.startswith(spur.get('buildingId')+'__') and max(gap(bounds(spur),bounds(shell)))==0]",
    "trunks=[o for o in bpy.data.objects if o.type=='MESH' and 'trunk' in o.name.lower()]",
    "treeIntrusions=[[spur.name,trunk.name] for spur in spurs for trunk in trunks if max(gap(bounds(spur),bounds(trunk)))==0]",
    "root=bpy.data.objects.get('SITE__building-access-network')",
    "result={'records':records,'root':{'parent':root.parent.name if root and root.parent else None,'layerRole':root.get('layerRole') if root else None},'intrusions':intrusions,'treeIntrusions':treeIntrusions,'counts':{'hydrants':sum(1 for o in bpy.data.objects if o.name.startswith('FIRE__hydrant-')),'crosswalkStripes':sum(1 for o in bpy.data.objects if o.name.startswith('ACCESS_DETAIL__crosswalk-')),'giveWay':sum(1 for o in bpy.data.objects if o.name.startswith('ACCESS_DETAIL__give-way-')),'curbs':sum(1 for o in bpy.data.objects if o.name.startswith('ACCESS_DETAIL__curb-'))}}",
    `open(${JSON.stringify(accessPath)},'w').write(json.dumps(result))`,
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const access = JSON.parse(readFileSync(accessPath, 'utf8'))
  assert.deepEqual(access.root, { parent: 'FactoryCampusGraybox', layerRole: 'building-access-network' })
  for (const id of ids) {
    const record = access.records[id]
    assert.equal(record.spur, true, `${id} is missing its final vehicle access spur`)
    assert.equal(record.apron, true, `${id} is missing its reinforced entrance apron`)
    assert.equal(record.buildingId, id)
    assert.match(record.targetRoad, /^ROAD__segment-/)
    assert.equal(record.layerRole, 'building-access-road')
    assert.equal(record.touchesApron, true, `${id} spur does not reach its entrance apron`)
    assert.equal(record.touchesBuilding, true, `${id} entrance apron does not reach the building edge`)
    assert.equal(record.touchesRoad, true, `${id} spur does not reach ${record.targetRoad}`)
  }
  assert.deepEqual(access.intrusions, [], `access routes must not cross unrelated buildings: ${JSON.stringify(access.intrusions)}`)
  assert.deepEqual(access.treeIntrusions, [], `access routes must not cross tree trunks: ${JSON.stringify(access.treeIntrusions)}`)
  assert.ok(access.counts.hydrants >= 6, `campus needs at least six fire hydrants: ${access.counts.hydrants}`)
  assert.ok(access.counts.crosswalkStripes >= 24, `priority entrances need zebra crossings: ${access.counts.crosswalkStripes}`)
  assert.ok(access.counts.giveWay >= 4, `industrial junctions need give-way markings: ${access.counts.giveWay}`)
  assert.ok(access.counts.curbs >= 12, `long access routes need constructed curb edges: ${access.counts.curbs}`)
})

test('Blender exports collision-free operational vehicle routes with ordered waypoints', () => {
  const { blendPath } = getGeneratedFixture()
  const expected = {
    'warehouse-delivery': { vehicle: 'VEHICLE__delivery-truck__root', waypointCount: 7, loopMode: 'ping-pong' },
    'maintenance-service': { vehicle: 'VEHICLE__maintenance-van__root', waypointCount: 6, loopMode: 'ping-pong' },
    'fire-patrol': { vehicle: 'VEHICLE__fire-patrol__root', waypointCount: 9, loopMode: 'loop' },
  }
  const inspectExpression = [
    'import bpy,json',
    `expected=${JSON.stringify(expected)}`,
    "routeIds=list(expected.keys())",
    "routes={routeId:{'root':('ROUTE__'+routeId) if ('ROUTE__'+routeId) in bpy.data.objects else None,'loopMode':bpy.data.objects.get('ROUTE__'+routeId).get('loopMode') if bpy.data.objects.get('ROUTE__'+routeId) else None,'waypoints':sorted([{'name':o.name,'order':o.get('waypointOrder'),'position':list(o.matrix_world.translation)} for o in bpy.data.objects if o.name.startswith('WAYPOINT__'+routeId+'__')],key=lambda item:item['order'] or 0),'vehicle':expected[routeId]['vehicle'] if expected[routeId]['vehicle'] in bpy.data.objects else None,'motionPath':bpy.data.objects.get(expected[routeId]['vehicle']).get('motionPath') if bpy.data.objects.get(expected[routeId]['vehicle']) else None,'linkedRoute':bpy.data.objects.get(expected[routeId]['vehicle']).get('linkedRoute') if bpy.data.objects.get(expected[routeId]['vehicle']) else None,'speed':bpy.data.objects.get(expected[routeId]['vehicle']).get('motionSpeed') if bpy.data.objects.get(expected[routeId]['vehicle']) else None} for routeId in routeIds}",
    "obstacles=[o for o in bpy.data.objects if o.type=='MESH' and (o.name.endswith('__wall-shell') or o.name in ['COURT__surface','TENNIS__surface'] or 'trunk' in o.name.lower() or o.name.startswith(('PARKING__post-','PIPE__column-','PIPE__bridge-gantry-')))]",
    "segments=[(routeId,index,route['waypoints'][index]['position'],route['waypoints'][index+1]['position']) for routeId,route in routes.items() for index in range(len(route['waypoints'])-1)]",
    "swept=lambda a,b:[min(a[0],b[0])-.48,max(a[0],b[0])+.48,min(a[1],b[1])-.48,max(a[1],b[1])+.48]",
    "bounds=lambda o:[o.matrix_world.translation.x-o.dimensions.x/2,o.matrix_world.translation.x+o.dimensions.x/2,o.matrix_world.translation.y-o.dimensions.y/2,o.matrix_world.translation.y+o.dimensions.y/2]",
    "overlap=lambda a,b:a[0]<b[1] and b[0]<a[1] and a[2]<b[3] and b[2]<a[3]",
    "collisions=[[routeId,index+1,obstacle.name] for routeId,index,start,end in segments for obstacle in obstacles if overlap(swept(start,end),bounds(obstacle))]",
    "print('OPERATIONAL_ROUTE_AUDIT='+json.dumps({'routes':routes,'collisions':collisions}))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('OPERATIONAL_ROUTE_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('OPERATIONAL_ROUTE_AUDIT='.length))
  for (const [routeId, record] of Object.entries(expected)) {
    const route = audit.routes[routeId]
    assert.equal(route.root, `ROUTE__${routeId}`)
    assert.equal(route.loopMode, record.loopMode)
    assert.equal(route.waypoints.length, record.waypointCount)
    assert.deepEqual(route.waypoints.map(({ order }) => order), Array.from({ length: record.waypointCount }, (_, index) => index + 1))
    assert.equal(route.vehicle, record.vehicle)
    assert.equal(route.motionPath, 'campus-route')
    assert.equal(route.linkedRoute, routeId)
    assert.ok(route.speed > 0)
  }
  assert.deepEqual(audit.collisions, [], `operational routes must clear campus obstacles: ${JSON.stringify(audit.collisions)}`)
})

test('functional building facades expose distinct operational identities', () => {
  const { blendPath } = getGeneratedFixture()
  const required = {
    'ADMIN__dropoff-porte-cochere': 'BLDG__administration',
    'ADMIN__corporate-sign-backplate': 'BLDG__administration',
    'MAIN__roof-monitor': 'BLDG__main-production-hall',
    'MAIN__service-annex': 'BLDG__main-production-hall',
    'WAREHOUSE__dock-platform': 'BLDG__front-warehouse',
    'WAREHOUSE__dock-canopy': 'BLDG__front-warehouse',
    'FINISHED__dock-platform': 'BLDG__east-warehouse',
    'FINISHED__sectional-door-01': 'BLDG__east-warehouse',
    'PROCESS_HALL__pipe-entry-frame': 'BLDG__east-process-hall',
    'PROCESS_HALL__roof-scrubber': 'BLDG__east-process-hall',
    'POWER__louver-bank': 'BLDG__far-east-utility',
    'POWER__roof-equipment-skid': 'BLDG__far-east-utility',
  }
  const buildings = {
    'main-production-hall': { position: [12 * Math.SQRT2, .5 * Math.SQRT2, 0], size: [16.8, 7, 3.8] },
    'east-process-hall': { position: [-14 * Math.SQRT2, -5 * Math.SQRT2, 0], size: [6.7, 4.1, 3.35] },
    'far-east-utility': { position: [-22 * Math.SQRT2, 3.2 * Math.SQRT2, 0], size: [3.6, 2.7, 2.3] },
    'east-warehouse': { position: [-14 * Math.SQRT2, 2.2 * Math.SQRT2, 0], size: [7.9, 4.5, 3] },
    'front-warehouse': { position: [-3 * Math.SQRT2, 10 * Math.SQRT2, 0], size: [8.1, 3.4, 3.2] },
    administration: { position: [9.5 * Math.SQRT2, 11.3 * Math.SQRT2, 0], size: [8.4, 5.4, 6.2] },
  }
  const inspectExpression = [
    'import bpy,json',
    `required=${JSON.stringify(required)}`,
    `buildings=${JSON.stringify(buildings)}`,
    "details={name:{'exists':name in bpy.data.objects,'parent':bpy.data.objects[name].parent.name if name in bpy.data.objects and bpy.data.objects[name].parent else None,'dimensions':list(bpy.data.objects[name].dimensions) if name in bpy.data.objects else None} for name in required}",
    "shells={id:{'position':list(bpy.data.objects['BLDG__'+id].location),'dimensions':list(bpy.data.objects[id+'__wall-shell'].dimensions)} for id in buildings}",
    "print('FUNCTIONAL_FACADE_AUDIT='+json.dumps({'details':details,'shells':shells}))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('FUNCTIONAL_FACADE_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('FUNCTIONAL_FACADE_AUDIT='.length))
  for (const [name, parent] of Object.entries(required)) {
    assert.equal(audit.details[name].exists, true, `missing functional facade detail ${name}`)
    assert.equal(audit.details[name].parent, parent, `${name} must remain attached to ${parent}`)
    assert.ok(audit.details[name].dimensions.every((value) => value > 0), `${name} must export non-zero geometry`)
  }
  for (const [id, expected] of Object.entries(buildings)) {
    const shell = audit.shells[id]
    assert.deepEqual(shell.position.map((value) => Math.round(value * 100) / 100), expected.position.map((value) => Math.round(value * 100) / 100))
    assert.deepEqual(shell.dimensions.map((value) => Math.round(value * 100) / 100), expected.size)
  }
})

test('key industrial buildings expose maintainable roof and facade service systems', () => {
  const { blendPath } = getGeneratedFixture()
  const required = {
    'ROOF_OPS__main-production-hall__maintenance-walkway': ['BLDG__main-production-hall', 'roof-maintenance-walkway'],
    'ROOF_OPS__main-production-hall__guardrail-01': ['BLDG__main-production-hall', 'roof-safety-rail'],
    'ROOF_OPS__central-processing-hall__hvac-unit-01': ['BLDG__central-processing-hall', 'roof-hvac'],
    'ROOF_OPS__east-process-hall__duct-run': ['BLDG__east-process-hall', 'roof-duct'],
    'SERVICE_OPS__main-production-hall__fire-cabinet': ['BLDG__main-production-hall', 'fire-service'],
    'SERVICE_OPS__east-warehouse__electrical-panel': ['BLDG__east-warehouse', 'electrical-service'],
    'SERVICE_OPS__far-east-utility__pipe-entry-01': ['BLDG__far-east-utility', 'utility-pipe-entry'],
  }
  const inspectExpression = [
    'import bpy,json',
    `required=${JSON.stringify(required)}`,
    "records={name:{'exists':name in bpy.data.objects,'parent':bpy.data.objects[name].parent.name if name in bpy.data.objects and bpy.data.objects[name].parent else None,'role':bpy.data.objects[name].get('layerRole') if name in bpy.data.objects else None,'dimensions':list(bpy.data.objects[name].dimensions) if name in bpy.data.objects else None} for name in required}",
    "print('OPERATIONAL_BUILDING_AUDIT='+json.dumps(records))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('OPERATIONAL_BUILDING_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('OPERATIONAL_BUILDING_AUDIT='.length))
  for (const [name, [parent, role]] of Object.entries(required)) {
    assert.equal(audit[name].exists, true, `missing operational building detail ${name}`)
    assert.equal(audit[name].parent, parent)
    assert.equal(audit[name].role, role)
    assert.ok(audit[name].dimensions.every((value) => value > 0), `${name} must export non-zero geometry`)
  }
})

test('both warehouse loading areas export pallets forklifts and loading crews', () => {
  const { blendPath } = getGeneratedFixture()
  const warehouses = ['front-warehouse', 'east-warehouse']
  const inspectExpression = [
    'import bpy,json',
    `warehouses=${JSON.stringify(warehouses)}`,
    "records={id:{'pallet':('LOGISTICS_OPS__'+id+'__pallet-stack-01') in bpy.data.objects,'forklift':('LOGISTICS_OPS__'+id+'__forklift') in bpy.data.objects,'loader':('LOGISTICS_OPS__'+id+'__loader-01') in bpy.data.objects,'forkliftParent':bpy.data.objects.get('LOGISTICS_OPS__'+id+'__forklift').parent.name if bpy.data.objects.get('LOGISTICS_OPS__'+id+'__forklift') and bpy.data.objects.get('LOGISTICS_OPS__'+id+'__forklift').parent else None,'loaderParent':bpy.data.objects.get('LOGISTICS_OPS__'+id+'__loader-01').parent.name if bpy.data.objects.get('LOGISTICS_OPS__'+id+'__loader-01') and bpy.data.objects.get('LOGISTICS_OPS__'+id+'__loader-01').parent else None,'motion':{k:bpy.data.objects.get('LOGISTICS_OPS__'+id+'__forklift').get(k) for k in ['motionPath','motionAxis','motionDistance','motionSpeed','motionPhase']} if bpy.data.objects.get('LOGISTICS_OPS__'+id+'__forklift') else None,'loaderMotion':bpy.data.objects.get('LOGISTICS_OPS__'+id+'__loader-01').get('motionPath') if bpy.data.objects.get('LOGISTICS_OPS__'+id+'__loader-01') else None} for id in warehouses}",
    "print('WAREHOUSE_ACTIVITY_AUDIT='+json.dumps(records))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('WAREHOUSE_ACTIVITY_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('WAREHOUSE_ACTIVITY_AUDIT='.length))
  for (const id of warehouses) {
    const record = audit[id]
    assert.equal(record.pallet, true, `${id} needs a visible pallet stack`)
    assert.equal(record.forklift, true, `${id} needs a forklift`)
    assert.equal(record.loader, true, `${id} needs loading crew`)
    assert.equal(record.forkliftParent, `BLDG__${id}`)
    assert.equal(record.loaderParent, `BLDG__${id}`)
    assert.equal(record.motion.motionPath, 'yard-shuttle')
    assert.match(record.motion.motionAxis, /^[xz]$/)
    assert.ok(record.motion.motionDistance > 0)
    assert.ok(record.motion.motionSpeed > 0)
    assert.equal(record.loaderMotion, 'site-patrol')
  }
})

test('building functions export distinct architectural material identities', () => {
  const { blendPath } = getGeneratedFixture()
  const expected = {
    'main-production-hall': ['modern-production', 'MAT__factory-wall', 'MAT__factory-panel-light'],
    'front-warehouse': ['warm-logistics', 'MAT__warehouse-wall', 'MAT__warehouse-panel-light'],
    'east-process-hall': ['process-blue-gray', 'MAT__process-wall', 'MAT__process-panel-light'],
    'far-east-utility': ['dark-utility', 'MAT__utility-wall', 'MAT__utility-panel-light'],
    laboratory: ['clean-technical', 'MAT__laboratory-wall', 'MAT__laboratory-panel-light'],
    administration: ['executive-stone', 'MAT__admin-stone', 'MAT__limestone-light'],
  }
  const inspectExpression = [
    'import bpy,json',
    `expected=${JSON.stringify(expected)}`,
    "records={id:{'direction':bpy.data.objects['BLDG__'+id].get('artDirection'),'shellMaterial':bpy.data.objects[id+'__wall-shell'].data.materials[0].name,'panelMaterial':bpy.data.objects['CLADDING__'+id+'__front-panel-01'].data.materials[0].name,'panelColor':list(bpy.data.objects['CLADDING__'+id+'__front-panel-01'].data.materials[0].diffuse_color)[:3]} for id in expected}",
    "print('BUILDING_ART_AUDIT='+json.dumps(records))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('BUILDING_ART_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('BUILDING_ART_AUDIT='.length))
  for (const [id, [direction, shellMaterial, panelMaterial]] of Object.entries(expected)) {
    assert.equal(audit[id].direction, direction, `${id} needs a functional art direction`)
    assert.equal(audit[id].shellMaterial, shellMaterial, `${id} shell material is not function-specific`)
    assert.equal(audit[id].panelMaterial, panelMaterial, `${id} cladding material is not function-specific`)
  }
  const uniquePanelColors = new Set(Object.values(audit).map(({ panelColor }) => panelColor.map(value => value.toFixed(3)).join(',')))
  assert.equal(uniquePanelColors.size, Object.keys(expected).length, 'representative building identities need visibly distinct panel colors')
})

test('administration landmark exposes deep glazing a visible warm lobby and crafted canopy', () => {
  const { blendPath } = getGeneratedFixture()
  const requiredNames = [
    'ADMIN__grand-atrium',
    'ADMIN__lobby-backdrop',
    'ADMIN__lobby-floor',
    'ADMIN__reception-desk',
    'ADMIN__lobby-sofa-left',
    'ADMIN__lobby-sofa-right',
    'ADMIN__entry-door-left',
    'ADMIN__entry-door-right',
    'ADMIN__grand-canopy-soffit',
    'ADMIN__canopy-linear-light-01',
    'ADMIN__canopy-linear-light-02',
    'ADMIN__canopy-linear-light-03',
  ]
  const inspectExpression = [
    'import bpy,json',
    `names=${JSON.stringify(requiredNames)}`,
    "objects={name:{'exists':name in bpy.data.objects,'parent':bpy.data.objects[name].parent.name if name in bpy.data.objects and bpy.data.objects[name].parent else None,'dimensions':list(bpy.data.objects[name].dimensions) if name in bpy.data.objects else None,'location':list(bpy.data.objects[name].location) if name in bpy.data.objects else None,'material':bpy.data.objects[name].data.materials[0].name if name in bpy.data.objects and getattr(bpy.data.objects[name].data,'materials',None) else None} for name in names}",
    "shader=lambda name:next(n for n in bpy.data.materials[name].node_tree.nodes if n.type=='BSDF_PRINCIPLED')",
    "materials={'glass':{'name':'MAT__admin-glass','transmission':shader('MAT__admin-glass').inputs['Transmission Weight'].default_value,'coat':shader('MAT__admin-glass').inputs['Coat Weight'].default_value,'roughness':shader('MAT__admin-glass').inputs['Roughness'].default_value,'alpha':shader('MAT__admin-glass').inputs['Alpha'].default_value,'surface':bpy.data.materials['MAT__admin-glass'].surface_render_method},'glow':{'name':'MAT__lobby-glow','strength':shader('MAT__lobby-glow').inputs['Emission Strength'].default_value}}",
    "counts={'stoneJoints':sum(1 for o in bpy.data.objects if o.name.startswith('ADMIN__stone-joint-')),'linearLights':sum(1 for o in bpy.data.objects if o.name.startswith('ADMIN__canopy-linear-light-'))}",
    "print('ADMIN_ART_AUDIT='+json.dumps({'objects':objects,'materials':materials,'counts':counts}))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('ADMIN_ART_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('ADMIN_ART_AUDIT='.length))
  for (const [name, record] of Object.entries(audit.objects)) {
    assert.equal(record.exists, true, `missing administration art object ${name}`)
    assert.equal(record.parent, 'BLDG__administration', `${name} must follow building selection and explosion`)
    assert.ok(record.dimensions.every((value) => value > 0), `${name} must export non-zero geometry`)
  }
  assert.equal(audit.objects['ADMIN__grand-atrium'].material, 'MAT__admin-glass')
  assert.equal(audit.objects['ADMIN__entry-door-left'].material, 'MAT__admin-glass')
  assert.ok(audit.materials.glass.transmission >= 0.45, `administration glass lacks depth: ${JSON.stringify(audit.materials.glass)}`)
  assert.ok(audit.materials.glass.coat >= 0.38, `administration glass lacks reflective coat: ${JSON.stringify(audit.materials.glass)}`)
  assert.ok(audit.materials.glass.roughness <= 0.16, `administration glass is too diffuse: ${JSON.stringify(audit.materials.glass)}`)
  assert.ok(audit.materials.glass.alpha <= 0.58, `administration glass must reveal the lobby: ${JSON.stringify(audit.materials.glass)}`)
  assert.equal(audit.materials.glass.surface, 'DITHERED', 'administration glass must use a transparent render method')
  assert.ok(audit.materials.glow.strength >= 0.45 && audit.materials.glow.strength <= 1.2, `lobby glow is not restrained: ${JSON.stringify(audit.materials.glow)}`)
  assert.ok(audit.objects['ADMIN__lobby-backdrop'].location[1] < audit.objects['ADMIN__grand-atrium'].location[1] - 0.3, 'lobby backdrop must be visibly recessed behind the glazing')
  assert.ok(audit.counts.stoneJoints >= 10, 'stone wings need a readable large-format joint rhythm')
  assert.equal(audit.counts.linearLights, 3, 'the ceremonial canopy needs three warm linear lights')
})

test('every building exports role-based night fixtures and functional wayfinding', () => {
  const { blendPath } = getGeneratedFixture()
  const ids = buildingRegistry.map(({ id }) => id)
  const taskIds = ['main-production-hall', 'front-warehouse', 'east-warehouse', 'east-process-hall']
  const inspectExpression = [
    'import bpy,json',
    `ids=${JSON.stringify(ids)}`,
    `task_ids=${JSON.stringify(taskIds)}`,
    "record=lambda name:{'exists':name in bpy.data.objects,'parent':bpy.data.objects[name].parent.name if name in bpy.data.objects and bpy.data.objects[name].parent else None,'dimensions':list(bpy.data.objects[name].dimensions) if name in bpy.data.objects else None,'lightRole':bpy.data.objects[name].get('lightRole') if name in bpy.data.objects else None,'layerRole':bpy.data.objects[name].get('layerRole') if name in bpy.data.objects else None,'material':bpy.data.objects[name].data.materials[0].name if name in bpy.data.objects and getattr(bpy.data.objects[name].data,'materials',None) else None}",
    "buildings={id:{'entry1':record('LIGHT__'+id+'__entry-01'),'entry2':record('LIGHT__'+id+'__entry-02'),'wayfinding':record('WAYFINDING__'+id+'__identity-panel')} for id in ids}",
    "tasks={id:[record('LIGHT__'+id+'__task-01'),record('LIGHT__'+id+'__task-02')] for id in task_ids}",
    "shader=lambda name:next(n for n in bpy.data.materials[name].node_tree.nodes if n.type=='BSDF_PRINCIPLED')",
    "materials={name:shader(name).inputs['Emission Strength'].default_value for name in ['MAT__entry-light-warm','MAT__task-light-cool','MAT__wayfinding-amber'] if name in bpy.data.materials}",
    "lobby=[record('ADMIN__lobby-backdrop')]+[record('ADMIN__canopy-linear-light-'+str(i).zfill(2)) for i in range(1,4)]",
    "print('NIGHT_WAYFINDING_AUDIT='+json.dumps({'buildings':buildings,'tasks':tasks,'lobby':lobby,'materials':materials}))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('NIGHT_WAYFINDING_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('NIGHT_WAYFINDING_AUDIT='.length))
  for (const [id, building] of Object.entries(audit.buildings)) {
    for (const [slot, record] of Object.entries(building)) {
      assert.equal(record.exists, true, `${id} is missing ${slot}`)
      assert.equal(record.parent, `BLDG__${id}`, `${id} ${slot} must follow building focus and explosion`)
      assert.ok(record.dimensions.every((value) => value > 0), `${id} ${slot} needs non-zero geometry`)
      assert.equal(record.layerRole, slot === 'wayfinding' ? 'building-wayfinding' : 'building-lighting')
    }
    assert.equal(building.entry1.lightRole, 'entry-warm')
    assert.equal(building.entry2.lightRole, 'entry-warm')
    assert.equal(building.wayfinding.lightRole, 'wayfinding-amber')
    assert.equal(building.wayfinding.material, 'MAT__wayfinding-amber')
  }
  for (const [id, fixtures] of Object.entries(audit.tasks)) {
    for (const record of fixtures) {
      assert.equal(record.exists, true, `${id} needs paired task lighting`)
      assert.equal(record.parent, `BLDG__${id}`)
      assert.equal(record.lightRole, 'task-cool')
      assert.equal(record.layerRole, 'building-lighting')
    }
  }
  for (const fixture of audit.lobby) {
    assert.equal(fixture.exists, true)
    assert.equal(fixture.parent, 'BLDG__administration')
    assert.equal(fixture.lightRole, 'lobby-warm')
  }
  assert.deepEqual(Object.keys(audit.materials).sort(), ['MAT__entry-light-warm', 'MAT__task-light-cool', 'MAT__wayfinding-amber'])
  assert.ok(audit.materials['MAT__entry-light-warm'] >= .25 && audit.materials['MAT__entry-light-warm'] <= .7)
  assert.ok(audit.materials['MAT__task-light-cool'] >= .2 && audit.materials['MAT__task-light-cool'] <= .65)
  assert.ok(audit.materials['MAT__wayfinding-amber'] >= .18 && audit.materials['MAT__wayfinding-amber'] <= .55)
})

test('ground roads and landscape export layered semi-realistic site art', () => {
  const { blendPath } = getGeneratedFixture()
  const inspectExpression = [
    'import bpy,json',
    "detail=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith(('SURFACE_ART__','PAVING_DETAIL__','PARKING_DETAIL__','LANDSCAPE_ART__'))]",
    "record=lambda o:{'parent':o.parent.name if o.parent else None,'material':o.data.materials[0].name if o.data.materials else None,'role':o.get('layerRole'),'bottom':o.matrix_world.translation.z-o.dimensions.z/2}",
    "objects={o.name:record(o) for o in detail}",
    "counts={'surface':sum(1 for o in detail if o.name.startswith('SURFACE_ART__')),'patches':sum(1 for o in detail if o.name.startswith('SURFACE_ART__asphalt-patch-')),'wear':sum(1 for o in detail if o.name.startswith('SURFACE_ART__traffic-wear-')),'covers':sum(1 for o in detail if o.name.startswith('SURFACE_ART__utility-cover-')),'paving':sum(1 for o in detail if o.name.startswith('PAVING_DETAIL__joint-')),'parking':sum(1 for o in detail if o.name.startswith('PARKING_DETAIL__bay-id-')),'landscape':sum(1 for o in detail if o.name.startswith('LANDSCAPE_ART__'))}",
    "shader=lambda name:next(n for n in bpy.data.materials[name].node_tree.nodes if n.type=='BSDF_PRINCIPLED')",
    "material_names=['MAT__asphalt-repair-warm','MAT__traffic-wear-cool','MAT__utility-iron','MAT__paving-joint','MAT__warm-aggregate','MAT__planting-mulch']",
    "materials={name:{'roughness':shader(name).inputs['Roughness'].default_value,'color':list(bpy.data.materials[name].diffuse_color)} for name in material_names if name in bpy.data.materials}",
    "parking_numbers=sorted(o.get('bayNumber') for o in detail if o.name.startswith('PARKING_DETAIL__bay-id-'))",
    "protected=[o for o in bpy.data.objects if o.type=='MESH' and (o.name.endswith('__wall-shell') or o.name in ['COURT__surface','TENNIS__surface'])]",
    "overlap=lambda a,b:all(abs(a.matrix_world.translation[i]-b.matrix_world.translation[i])<(a.dimensions[i]+b.dimensions[i])/2 for i in range(3))",
    "collisions=[[a.name,b.name] for a in detail for b in protected if overlap(a,b)]",
    "gate_landscape=[o.name for o in detail if o.name.startswith('LANDSCAPE_ART__') and 25.0 <= o.matrix_world.translation.x <= 34.5 and 21.5 <= o.matrix_world.translation.y <= 36.0]",
    "inner_crowns=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('LANDSCAPE__inner-tree-crown-')]",
    "foliage_palette=sorted(set(o.data.materials[0].name for o in inner_crowns if o.data.materials))",
    "print('SITE_ART_AUDIT='+json.dumps({'group':'SITE__surface-art' in bpy.data.objects,'objects':objects,'counts':counts,'materials':materials,'parkingNumbers':parking_numbers,'collisions':collisions,'gateLandscape':gate_landscape,'foliagePalette':foliage_palette}))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('SITE_ART_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('SITE_ART_AUDIT='.length))
  assert.equal(audit.group, true, 'site art needs one selectable Blender parent group')
  assert.ok(audit.counts.patches >= 12, `site needs distributed asphalt repair, received ${audit.counts.patches}`)
  assert.ok(audit.counts.wear >= 8, `traffic wear needs directional repetition, received ${audit.counts.wear}`)
  assert.ok(audit.counts.covers >= 4, `road network needs utility covers, received ${audit.counts.covers}`)
  assert.ok(audit.counts.paving >= 6, `entry paving needs construction joints, received ${audit.counts.paving}`)
  assert.equal(audit.counts.parking, 10, 'parking canopy needs ten numbered bay identifiers')
  assert.ok(audit.counts.landscape >= 8, `landscape edges need material depth, received ${audit.counts.landscape}`)
  assert.deepEqual(Object.keys(audit.materials).sort(), [
    'MAT__asphalt-repair-warm',
    'MAT__paving-joint',
    'MAT__planting-mulch',
    'MAT__traffic-wear-cool',
    'MAT__utility-iron',
    'MAT__warm-aggregate',
  ])
  assert.ok(audit.materials['MAT__asphalt-repair-warm'].roughness >= .82)
  assert.ok(audit.materials['MAT__traffic-wear-cool'].roughness >= .82)
  assert.ok(audit.materials['MAT__utility-iron'].roughness >= .58)
  assert.ok(audit.materials['MAT__planting-mulch'].roughness >= .90)
  assert.deepEqual(audit.parkingNumbers, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  assert.deepEqual(audit.collisions, [], `site art must clear buildings and sports surfaces: ${JSON.stringify(audit.collisions)}`)
  assert.deepEqual(audit.gateLandscape, [], 'landscape art must keep the gate approach and sightline clear')
  assert.ok(audit.foliagePalette.length >= 3, `inner landscape needs at least three foliage tones: ${audit.foliagePalette}`)
  for (const [name, record] of Object.entries(audit.objects)) {
    assert.equal(record.parent, 'SITE__surface-art', `${name} must stay under the site-art group`)
    assert.ok(record.bottom <= .18, `${name} visibly floats above its supporting surface: ${record.bottom}`)
    assert.ok(record.role, `${name} needs a semantic layerRole for Web inspection`)
  }
})

test('campus close-range storytelling exports porous sports mesh and operational props', () => {
  const { blendPath } = getGeneratedFixture()
  const inspectExpression = [
    'import bpy,json',
    "wire=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('SPORTS_DETAIL__')]",
    "operational=[o for o in bpy.data.objects if o.name.startswith(('STREET_FURNITURE__','VEGETATION_DETAIL__','OPERATION_DETAIL__'))]",
    "operational_meshes=[o for o in operational if o.type=='MESH']",
    "shader=lambda name:next(n for n in bpy.data.materials[name].node_tree.nodes if n.type=='BSDF_PRINCIPLED')",
    "fence_mat=bpy.data.materials.get('MAT__sports-fence')",
    "fence={'exists':fence_mat is not None,'alpha':shader('MAT__sports-fence').inputs['Alpha'].default_value if fence_mat else None,'surface':fence_mat.surface_render_method if fence_mat else None}",
    "panels={name:bpy.data.objects[name].data.materials[0].name for name in ['BASKET__fence-run-south','TENNIS__fence-run-south'] if name in bpy.data.objects}",
    "gates={name:{'interactive':bpy.data.objects[name].get('interactive'),'openAngle':bpy.data.objects[name].get('openAngle')} for name in ['BASKET__gate','TENNIS__gate'] if name in bpy.data.objects}",
    "counts={'benches':sum(1 for o in operational if o.type=='EMPTY' and o.name.startswith('STREET_FURNITURE__bench-')),'bins':sum(1 for o in operational if o.type=='EMPTY' and o.name.startswith('STREET_FURNITURE__bin-')),'pylons':sum(1 for o in operational if o.type=='EMPTY' and o.name.startswith('STREET_FURNITURE__pylon-')),'cones':sum(1 for o in operational if o.type=='EMPTY' and o.name.startswith('OPERATION_DETAIL__safety-cone-')),'understory':sum(1 for o in operational if o.type=='EMPTY' and o.name.startswith('VEGETATION_DETAIL__understory-')),'walkers':sum(1 for o in operational if o.type=='EMPTY' and o.name.startswith('OPERATION_DETAIL__walker-')),'loading':sum(1 for o in operational if o.type=='EMPTY' and o.name.startswith('OPERATION_DETAIL__loading-'))}",
    "wire_parents=sorted(set(o.parent.name if o.parent else None for o in wire))",
    "missing_roles=[o.name for o in wire+operational_meshes if not o.get('layerRole')]",
    "protected=[o for o in bpy.data.objects if o.type=='MESH' and (o.name.endswith('__wall-shell') or o.name in ['COURT__surface','TENNIS__surface'])]",
    "overlap=lambda a,b:all(abs(a.matrix_world.translation[i]-b.matrix_world.translation[i])<(a.dimensions[i]+b.dimensions[i])/2 for i in range(3))",
    "collisions=[[a.name,b.name] for a in operational_meshes for b in protected if overlap(a,b)]",
    "gate_intrusions=[o.name for o in operational_meshes if o.name.startswith('OPERATION_DETAIL__gate-') and abs(o.matrix_world.translation.x-28.8)<1.3]",
    "ground=[o for o in operational_meshes if o.get('groundContact')]",
    "floating=[{'name':o.name,'bottom':o.matrix_world.translation.z-o.dimensions.z/2} for o in ground if o.matrix_world.translation.z-o.dimensions.z/2>.20]",
    "print('CLOSE_RANGE_AUDIT='+json.dumps({'group':'SITE__operational-story' in bpy.data.objects,'fence':fence,'panels':panels,'gates':gates,'wireCount':len(wire),'wireParents':wire_parents,'counts':counts,'missingRoles':missing_roles,'collisions':collisions,'gateIntrusions':gate_intrusions,'floating':floating}))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('CLOSE_RANGE_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('CLOSE_RANGE_AUDIT='.length))
  assert.equal(audit.group, true, 'close-range props need one selectable operational-story root')
  assert.equal(audit.fence.exists, true)
  assert.ok(audit.fence.alpha <= .18, `sports fence backing is still opaque: ${JSON.stringify(audit.fence)}`)
  assert.equal(audit.fence.surface, 'DITHERED')
  assert.deepEqual(audit.panels, {
    'BASKET__fence-run-south': 'MAT__sports-fence',
    'TENNIS__fence-run-south': 'MAT__sports-fence',
  })
  assert.deepEqual(Object.keys(audit.gates).sort(), ['BASKET__gate', 'TENNIS__gate'])
  assert.ok(Object.values(audit.gates).every((gate) => gate.interactive && gate.openAngle < -1))
  assert.ok(audit.wireCount >= 48, `sports enclosures need constructed wire rhythm: ${audit.wireCount}`)
  assert.deepEqual(audit.wireParents, ['SITE__basketball-court', 'SITE__tennis-court'])
  assert.ok(audit.counts.benches >= 4, `campus needs four resting points: ${audit.counts.benches}`)
  assert.ok(audit.counts.bins >= 4, `campus needs four waste stations: ${audit.counts.bins}`)
  assert.ok(audit.counts.pylons >= 3, `campus needs three pedestrian wayfinding points: ${audit.counts.pylons}`)
  assert.equal(audit.counts.cones, 8)
  assert.ok(audit.counts.understory >= 12, `campus planting needs a low shrub layer: ${audit.counts.understory}`)
  assert.equal(audit.counts.walkers, 3)
  assert.ok(audit.counts.loading >= 4, `both warehouse aprons need loading support props: ${audit.counts.loading}`)
  assert.deepEqual(audit.missingRoles, [], `new meshes need semantic layerRole values: ${audit.missingRoles}`)
  assert.deepEqual(audit.collisions, [], `operational props must clear buildings and courts: ${JSON.stringify(audit.collisions)}`)
  assert.deepEqual(audit.gateIntrusions, [], 'gate equipment must stay outside the vehicle travel lane')
  assert.deepEqual(audit.floating, [], `ground-mounted props visibly float: ${JSON.stringify(audit.floating)}`)
})

test('building envelopes export restrained four-sided weathering and roof patina', () => {
  const { blendPath } = getGeneratedFixture()
  const ids = buildingRegistry.map(({ id }) => id)
  const inspectExpression = [
    'import bpy,json',
    `ids=${JSON.stringify(ids)}`,
    "details=[o for o in bpy.data.objects if o.name.startswith('SURFACE_DETAIL__')]",
    "meshes=[o for o in details if o.type=='MESH']",
    "roots={id:bpy.data.objects.get('SURFACE_DETAIL__'+id) for id in ids}",
    "shader=lambda name:next(n for n in bpy.data.materials[name].node_tree.nodes if n.type=='BSDF_PRINCIPLED')",
    "material_names=['MAT__facade-weathering','MAT__facade-weathering-light','MAT__roof-patina']",
    "materials={name:{'roughness':shader(name).inputs['Roughness'].default_value,'alpha':shader(name).inputs['Alpha'].default_value,'surface':bpy.data.materials[name].surface_render_method} for name in material_names if name in bpy.data.materials}",
    "parents={id:{'exists':roots[id] is not None,'parent':roots[id].parent.name if roots[id] and roots[id].parent else None,'role':roots[id].get('layerRole') if roots[id] else None} for id in ids}",
    "base_bands=sum(1 for o in meshes if '__base-' in o.name)",
    "streaks=sum(1 for o in meshes if '__streak-' in o.name)",
    "roof_patina=sum(1 for o in meshes if '__roof-patina-' in o.name)",
    "admin_streaks=sum(1 for o in meshes if o.name.startswith('SURFACE_DETAIL__administration__streak-'))",
    "missing_roles=[o.name for o in meshes if not o.get('layerRole')]",
    "missing_tiers=[o.name for o in meshes if o.get('detailTier')!='micro']",
    "wrong_mesh_parents=[o.name for o in meshes if not o.parent or not o.parent.name.startswith('SURFACE_DETAIL__') or o.parent.type!='EMPTY']",
    "print('SURFACE_AGE_AUDIT='+json.dumps({'parents':parents,'baseBands':base_bands,'streaks':streaks,'roofPatina':roof_patina,'adminStreaks':admin_streaks,'materials':materials,'missingRoles':missing_roles,'missingTiers':missing_tiers,'wrongMeshParents':wrong_mesh_parents}))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('SURFACE_AGE_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('SURFACE_AGE_AUDIT='.length))
  assert.deepEqual(Object.keys(audit.materials).sort(), [
    'MAT__facade-weathering',
    'MAT__facade-weathering-light',
    'MAT__roof-patina',
  ])
  assert.equal(Object.keys(audit.parents).length, 12)
  for (const [id, root] of Object.entries(audit.parents)) {
    assert.equal(root.exists, true, `${id} needs a selectable surface-age root`)
    assert.equal(root.parent, `BLDG__${id}`, `${id} surface age must follow building focus and explosion`)
    assert.equal(root.role, 'building-surface-age')
  }
  assert.equal(audit.baseBands, 48, 'every building needs four-sided base weathering')
  assert.ok(audit.streaks >= 40, `facades need sparse repeated rain marks: ${audit.streaks}`)
  assert.equal(audit.adminStreaks, 2, 'administration should remain cleaner than industrial buildings')
  assert.equal(audit.roofPatina, 24, 'every roof needs two restrained patina fields')
  assert.deepEqual(audit.missingRoles, [], `surface meshes need semantic layer roles: ${audit.missingRoles}`)
  assert.deepEqual(audit.missingTiers, [], `surface meshes must stay in the micro detail tier: ${audit.missingTiers}`)
  assert.deepEqual(audit.wrongMeshParents, [], `surface meshes need per-building roots: ${audit.wrongMeshParents}`)
  assert.ok(Object.values(audit.materials).every((record) => record.roughness >= .82), JSON.stringify(audit.materials))
  assert.ok(audit.materials['MAT__facade-weathering'].alpha <= .42)
  assert.ok(audit.materials['MAT__facade-weathering-light'].alpha < audit.materials['MAT__facade-weathering'].alpha)
  assert.equal(audit.materials['MAT__facade-weathering'].surface, 'DITHERED')
})

test('ground materials export embedded base color normal and roughness maps with tiled UVs', () => {
  const { blendPath, glbPath } = getGeneratedFixture()
  const inspectExpression = [
    'import bpy,json',
    "material_names=['MAT__asphalt','MAT__bioswale-soil','MAT__concrete','MAT__entry-paving','MAT__lawn','MAT__planting-mulch']",
    "channels=lambda mat:{n.image.get('pbrChannel'):{'name':n.image.name,'embedded':n.image.packed_file is not None or n.image.source=='GENERATED','size':list(n.image.size),'colorspace':n.image.colorspace_settings.name} for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.get('pbrChannel')}",
    "materials={name:channels(bpy.data.materials[name]) for name in material_names if name in bpy.data.materials}",
    "representatives=['SITE__ground','SITE__outer-boulevard','SITE__entry-plaza','PARKING__surface','PROCESS__equipment-pad','LANDSCAPE__rain-garden-01']",
    "uv_range=lambda o:[max((uv.uv.x for uv in o.data.uv_layers.active.data),default=0)-min((uv.uv.x for uv in o.data.uv_layers.active.data),default=0),max((uv.uv.y for uv in o.data.uv_layers.active.data),default=0)-min((uv.uv.y for uv in o.data.uv_layers.active.data),default=0)] if o and o.type=='MESH' and o.data.uv_layers.active else [0,0]",
    "uv_ranges={name:uv_range(bpy.data.objects.get(name)) for name in representatives}",
    "print('GROUND_PBR_AUDIT='+json.dumps({'materials':materials,'uvRanges':uv_ranges}))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('GROUND_PBR_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('GROUND_PBR_AUDIT='.length))
  assert.deepEqual(Object.keys(audit.materials).sort(), [
    'MAT__asphalt',
    'MAT__bioswale-soil',
    'MAT__concrete',
    'MAT__entry-paving',
    'MAT__lawn',
    'MAT__planting-mulch',
  ])
  for (const [name, channels] of Object.entries(audit.materials)) {
    assert.deepEqual(Object.keys(channels).sort(), ['base-color', 'normal', 'roughness'], `${name} needs a complete embedded PBR set`)
    assert.ok(Object.values(channels).every((record) => record.embedded), `${name} images must be stored inside the BLEND`)
    assert.ok(Object.values(channels).every((record) => record.size[0] >= 128 && record.size[1] >= 128), `${name} maps are too small`)
    assert.equal(channels.normal.colorspace, 'Non-Color')
    assert.equal(channels.roughness.colorspace, 'Non-Color')
  }
  assert.ok(audit.uvRanges['SITE__ground'][0] >= 8 && audit.uvRanges['SITE__ground'][1] >= 8, JSON.stringify(audit.uvRanges))
  assert.ok(audit.uvRanges['SITE__outer-boulevard'][0] >= 8, JSON.stringify(audit.uvRanges))
  assert.ok(audit.uvRanges['SITE__entry-plaza'][0] >= 3, JSON.stringify(audit.uvRanges))
  assert.ok(audit.uvRanges['PARKING__surface'][0] >= 1.8, JSON.stringify(audit.uvRanges))

  const glb = readFileSync(glbPath)
  const jsonLength = glb.readUInt32LE(12)
  const gltf = JSON.parse(glb.subarray(20, 20 + jsonLength).toString().replace(/\0+$/, ''))
  assert.ok(gltf.images.length >= 18, `GLB needs all embedded ground PBR images: ${gltf.images.length}`)
  assert.ok(gltf.images.every((image) => image.bufferView !== undefined && image.uri === undefined), 'GLB must not request external texture files')
})

test('ground surfaces expose nine functional PBR material zones at credible real-world scale', () => {
  const { blendPath } = getGeneratedFixture()
  const inspectExpression = [
    'import bpy,json',
    "required=['new-asphalt','aged-asphalt','loading-concrete','entry-paving','parking-surface','walkway','lawn','mulch','bare-soil']",
    "materials={m.get('groundMaterialRole'):{'name':m.name,'tileSize':m.get('groundTileSize'),'normalStrength':max((n.inputs['Strength'].default_value for n in m.node_tree.nodes if n.type=='NORMAL_MAP'),default=0)} for m in bpy.data.materials if m.get('groundMaterialRole')}",
    "representative_names=['SITE__outer-boulevard','SURFACE_ZONE__aged-asphalt-01','LOGISTICS__front-warehouse-apron','SITE__entry-plaza','PARKING__surface','PEDESTRIAN__walkway-01','SITE__ground','GROUND_CONTACT__tree-mulch-01','LANDSCAPE__rain-garden-01']",
    "representatives={name:{'role':bpy.data.objects[name].get('groundRole'),'material':bpy.data.objects[name].data.materials[0].get('groundMaterialRole')} for name in representative_names if name in bpy.data.objects}",
    "print('GROUND_ZONE_AUDIT='+json.dumps({'required':required,'materials':materials,'representatives':representatives}))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('GROUND_ZONE_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('GROUND_ZONE_AUDIT='.length))
  for (const role of audit.required) {
    assert.ok(audit.materials[role], `missing distinct ${role} ground material`)
    assert.ok(audit.materials[role].normalStrength <= .12, `${role} normal map is too noisy`)
  }
  assert.equal(new Set(Object.values(audit.materials).map((record) => record.name)).size, 9, 'ground functions need nine distinct material identities')
  assert.equal(audit.materials['new-asphalt'].tileSize, 4.6)
  assert.equal(audit.materials['aged-asphalt'].tileSize, 4.8)
  assert.equal(audit.materials['loading-concrete'].tileSize, 4.2)
  assert.equal(audit.materials['entry-paving'].tileSize, 3.4)
  assert.equal(audit.materials['parking-surface'].tileSize, 4.6)
  assert.equal(audit.materials.walkway.tileSize, 3.2)
  assert.equal(audit.materials.lawn.tileSize, 4.8)
  assert.equal(audit.materials.mulch.tileSize, 3.2)
  assert.equal(audit.materials['bare-soil'].tileSize, 3.6)
  assert.deepEqual(Object.keys(audit.representatives).sort(), [
    'GROUND_CONTACT__tree-mulch-01',
    'LANDSCAPE__rain-garden-01',
    'LOGISTICS__front-warehouse-apron',
    'PARKING__surface',
    'PEDESTRIAN__walkway-01',
    'SITE__entry-plaza',
    'SITE__ground',
    'SITE__outer-boulevard',
    'SURFACE_ZONE__aged-asphalt-01',
  ])
  for (const [name, record] of Object.entries(audit.representatives)) {
    assert.equal(record.role, record.material, `${name} ground role must match its PBR material role`)
  }
})

test('ground wear is anchored to operations and preserves clear non-black contact zones', () => {
  const { blendPath } = getGeneratedFixture()
  const inspectExpression = [
    'import bpy,json',
    "root=bpy.data.objects.get('SITE__ground-contact-realism')",
    "details=[o for o in bpy.data.objects if root and o.parent==root and o.type=='MESH']",
    "roles=['tire-darkening','concrete-joint','asphalt-repair','drain-discoloration','dock-abrasion','wall-base-dust','oil-mark','contact-transition']",
    "counts={role:sum(1 for o in details if o.get('wearRole')==role) for role in roles}",
    "missing_anchors=[o.name for o in details if not o.get('anchorType') or not o.get('anchorName') or o.get('anchorName') not in bpy.data.objects]",
    "materials={m.name:{'mean':sum(m.diffuse_color[:3])/3,'alpha':m.diffuse_color[3],'roughness':next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Roughness'].default_value} for m in {o.data.materials[0] for o in details if o.data.materials and o.get('wearRole')!='contact-transition'}}",
    "clearance=[bpy.data.objects.get(n) for n in ['COURT__surface','TENNIS__surface','GATE__recognition-zone','GATE__stop-line']]",
    "collisions=[[o.name,c.name] for o in details for c in clearance if c and abs(o.matrix_world.translation.x-c.matrix_world.translation.x)<(o.dimensions.x+c.dimensions.x)/2 and abs(o.matrix_world.translation.y-c.matrix_world.translation.y)<(o.dimensions.y+c.dimensions.y)/2]",
    "zfight=[o.name for o in details if o.matrix_world.translation.z-o.dimensions.z/2<0.115]",
    "print('GROUND_WEAR_AUDIT='+json.dumps({'root':root.name if root else None,'counts':counts,'missingAnchors':missing_anchors,'materials':materials,'collisions':collisions,'zfight':zfight}))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('GROUND_WEAR_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('GROUND_WEAR_AUDIT='.length))
  assert.equal(audit.root, 'SITE__ground-contact-realism')
  assert.ok(audit.counts['tire-darkening'] >= 8)
  assert.ok(audit.counts['concrete-joint'] >= 10)
  assert.ok(audit.counts['asphalt-repair'] >= 6)
  assert.ok(audit.counts['drain-discoloration'] >= 4)
  assert.ok(audit.counts['dock-abrasion'] >= 4)
  assert.ok(audit.counts['wall-base-dust'] >= 12)
  assert.ok(audit.counts['oil-mark'] >= 3)
  assert.ok(audit.counts['contact-transition'] >= 12)
  assert.deepEqual(audit.missingAnchors, [], `wear must come from named routes, drains, docks, or buildings: ${audit.missingAnchors}`)
  assert.deepEqual(audit.collisions, [], `ground wear must preserve sports and gate clearances: ${JSON.stringify(audit.collisions)}`)
  assert.deepEqual(audit.zfight, [], `ground details need a stable vertical offset: ${audit.zfight}`)
  assert.ok(Object.values(audit.materials).every((record) => record.mean >= .10), `contact materials must not create black halos: ${JSON.stringify(audit.materials)}`)
  assert.ok(Object.values(audit.materials).every((record) => record.alpha <= .38), `ground wear must remain restrained: ${JSON.stringify(audit.materials)}`)
  assert.ok(Object.values(audit.materials).every((record) => record.roughness >= .78), `ground wear must stay matte: ${JSON.stringify(audit.materials)}`)
})

test('trees use tapered trunks and reusable clustered PBR crowns', () => {
  const { blendPath } = getGeneratedFixture()
  const inspectExpression = [
    'import bpy,json',
    "material_names=['MAT__trunk','MAT__foliage','MAT__foliage-light','MAT__foliage-warm','MAT__forest-foliage','MAT__forest-foliage-light']",
    "channels=lambda mat:sorted({n.image.get('pbrChannel') for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.get('pbrChannel')})",
    "materials={name:channels(bpy.data.materials[name]) for name in material_names if name in bpy.data.materials}",
    "crowns=[o for o in bpy.data.objects if o.type=='MESH' and (o.name.startswith('TREE__crown-') or o.name.startswith('LANDSCAPE__inner-tree-crown-') or o.name.startswith('ENV__tree-crown-'))]",
    "trunks=[o for o in bpy.data.objects if o.type=='MESH' and (o.name.startswith('TREE__trunk-') or o.name.startswith('LANDSCAPE__inner-tree-trunk-') or o.name.startswith('ENV__tree-trunk-'))]",
    "crown_records=[{'name':o.name,'form':o.get('vegetationForm'),'vertices':len(o.data.vertices),'mesh':o.data.name} for o in crowns]",
    "trunk_records=[{'name':o.name,'form':o.get('vegetationForm'),'base':o.get('baseRadius',0),'top':o.get('topRadius',1)} for o in trunks]",
    "print('VEGETATION_PBR_AUDIT='+json.dumps({'materials':materials,'crowns':crown_records,'trunks':trunk_records,'uniqueCrownMeshes':len({o.data.name for o in crowns})}))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('VEGETATION_PBR_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('VEGETATION_PBR_AUDIT='.length))
  assert.deepEqual(Object.keys(audit.materials).sort(), [
    'MAT__foliage',
    'MAT__foliage-light',
    'MAT__foliage-warm',
    'MAT__forest-foliage',
    'MAT__forest-foliage-light',
    'MAT__trunk',
  ])
  assert.ok(Object.values(audit.materials).every((channels) => JSON.stringify(channels) === JSON.stringify(['base-color', 'normal', 'roughness'])), JSON.stringify(audit.materials))
  assert.ok(audit.crowns.length >= 100, `campus needs a complete reusable tree population: ${audit.crowns.length}`)
  assert.ok(audit.crowns.every((record) => record.form === 'clustered-canopy' && record.vertices >= 120), JSON.stringify(audit.crowns.slice(0, 5)))
  assert.ok(audit.uniqueCrownMeshes <= 9, `tree crowns need linked reusable meshes: ${audit.uniqueCrownMeshes}`)
  assert.equal(audit.trunks.length, audit.crowns.length)
  assert.ok(audit.trunks.every((record) => record.form === 'tapered-trunk' && record.top > 0 && record.top / record.base <= .72), JSON.stringify(audit.trunks.slice(0, 5)))
})

test('vegetation exports six readable species across near mid and far tiers', () => {
  const { blendPath } = getGeneratedFixture()
  const inspectExpression = [
    'import bpy,json',
    "crowns=[o for o in bpy.data.objects if o.type=='MESH' and (o.name.startswith('TREE__crown-') or o.name.startswith('LANDSCAPE__inner-tree-crown-') or o.name.startswith('ENV__tree-crown-'))]",
    "near=[o for o in crowns if o.get('vegetationTier')=='near']",
    "branches=[o for o in bpy.data.objects if o.type=='MESH' and o.get('vegetationDetail')=='branch-structure']",
    "foliage=[m for m in bpy.data.materials if m.get('vegetationPbrLayer') in {'deep','mid','sunlit','forest-deep','forest-light'}]",
    "channels=lambda mat:sorted({n.image.get('pbrChannel') for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.get('pbrChannel')})",
    "records=[{'name':o.name,'species':o.get('vegetationSpecies'),'tier':o.get('vegetationTier'),'slots':len(o.data.materials)} for o in crowns]",
    "print('VEGETATION_REALISM_AUDIT='+json.dumps({'records':records,'species':sorted({o.get('vegetationSpecies') for o in crowns if o.get('vegetationSpecies')}),'tiers':sorted({o.get('vegetationTier') for o in crowns if o.get('vegetationTier')}),'nearCount':len(near),'nearLayered':sum(1 for o in near if len(o.data.materials)>=3),'branches':len(branches),'uniqueMeshes':len({o.data.name for o in crowns}),'materials':{m.name:channels(m) for m in foliage}}))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('VEGETATION_REALISM_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('VEGETATION_REALISM_AUDIT='.length))
  assert.ok(audit.species.length >= 6, `expected six distinct tree silhouettes: ${JSON.stringify(audit.species)}`)
  assert.deepEqual(audit.tiers, ['far', 'mid', 'near'])
  assert.ok(audit.nearCount >= 12, `expected readable near trees: ${audit.nearCount}`)
  assert.equal(audit.nearLayered, audit.nearCount, 'every near crown needs deep, mid, and sunlit foliage layers')
  assert.ok(audit.branches >= audit.nearCount, `near trees need visible branch structure: ${audit.branches}/${audit.nearCount}`)
  assert.ok(audit.uniqueMeshes <= 12, `vegetation must reuse profile meshes: ${audit.uniqueMeshes}`)
  assert.ok(Object.keys(audit.materials).length >= 5, JSON.stringify(audit.materials))
  assert.ok(Object.values(audit.materials).every((channels) => JSON.stringify(channels) === JSON.stringify(['base-color', 'normal', 'roughness'])), JSON.stringify(audit.materials))
})

test('near tree crowns stay porous and expose a two-order branch hierarchy', () => {
  const { blendPath } = getGeneratedFixture()
  const inspectExpression = [
    'import bpy,json',
    "exec(\"def crown_metrics(mesh):\\n adjacency=[set() for _ in mesh.vertices]\\n for edge in mesh.edges:\\n  a,b=edge.vertices; adjacency[a].add(b); adjacency[b].add(a)\\n remaining=set(range(len(mesh.vertices))); components=[]\\n while remaining:\\n  stack=[remaining.pop()]; component=set(stack)\\n  while stack:\\n   for neighbor in adjacency[stack.pop()]:\\n    if neighbor in remaining:\\n     remaining.remove(neighbor); component.add(neighbor); stack.append(neighbor)\\n  components.append(component)\\n bounds=[]\\n for component in components:\\n  coords=[mesh.vertices[index].co for index in component]\\n  minimum=[min(value[axis] for value in coords) for axis in range(3)]\\n  maximum=[max(value[axis] for value in coords) for axis in range(3)]\\n  bounds.append((minimum,maximum))\\n global_min=[min(item[0][axis] for item in bounds) for axis in range(3)]\\n global_max=[max(item[1][axis] for item in bounds) for axis in range(3)]\\n global_volume=max(1e-6,(global_max[0]-global_min[0])*(global_max[1]-global_min[1])*(global_max[2]-global_min[2]))\\n component_volume=sum((maximum[0]-minimum[0])*(maximum[1]-minimum[1])*(maximum[2]-minimum[2]) for minimum,maximum in bounds)\\n overlap_volume=0.0\\n for index,first in enumerate(bounds):\\n  for second in bounds[index+1:]:\\n   overlap=1.0\\n   for axis in range(3): overlap*=max(0.0,min(first[1][axis],second[1][axis])-max(first[0][axis],second[0][axis]))\\n   overlap_volume+=overlap\\n return {'components':len(components),'componentVolumeRatio':component_volume/global_volume,'overlapVolumeRatio':overlap_volume/global_volume}\")",
    "near=[o for o in bpy.data.objects if o.type=='MESH' and o.get('vegetationTier')=='near' and 'crown' in o.name.lower()]",
    "mesh_metrics={o.data.name:crown_metrics(o.data) for o in near}",
    "groups=[o for o in bpy.data.objects if o.type=='EMPTY' and o.get('vegetationDetail')=='branch-group']",
    "branch_records=[]",
    "exec(\"for group in groups:\\n primary=[o for o in bpy.data.objects if o.parent==group and o.get('branchOrder')==1]\\n secondary=[o for o in bpy.data.objects if o.parent==group and o.get('branchOrder')==2]\\n primary_names={o.name for o in primary}\\n branch_records.append({'name':group.name,'primary':len(primary),'secondary':len(secondary),'lineage':all(o.get('branchParent') in primary_names for o in secondary)})\")",
    "foliage={m.name:{'alpha':m.diffuse_color[3],'twoSided':not m.use_backface_culling} for m in bpy.data.materials if m.get('vegetationPbrLayer') in {'deep','mid','sunlit'}}",
    "print('POROUS_CANOPY_AUDIT='+json.dumps({'nearCount':len(near),'uniqueMeshes':len(mesh_metrics),'meshMetrics':mesh_metrics,'branchGroups':branch_records,'foliage':foliage}))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('POROUS_CANOPY_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('POROUS_CANOPY_AUDIT='.length))
  assert.ok(audit.nearCount >= 12, `expected at least twelve near trees: ${audit.nearCount}`)
  assert.ok(audit.uniqueMeshes <= 12, `near crowns must reuse no more than twelve meshes: ${audit.uniqueMeshes}`)
  assert.ok(Object.values(audit.meshMetrics).every((record) => record.components >= 8), JSON.stringify(audit.meshMetrics))
  assert.ok(Object.values(audit.meshMetrics).every((record) => record.overlapVolumeRatio <= .65), `near crown lobes remain visually fused: ${JSON.stringify(audit.meshMetrics)}`)
  assert.ok(Object.values(audit.meshMetrics).every((record) => record.componentVolumeRatio <= 1.35), `near crowns need visible air between masses: ${JSON.stringify(audit.meshMetrics)}`)
  assert.equal(audit.branchGroups.length, audit.nearCount, 'every near tree needs one visible branch group')
  assert.ok(audit.branchGroups.every((record) => record.primary >= 4 && record.secondary >= 8 && record.lineage), JSON.stringify(audit.branchGroups))
  assert.ok(Object.keys(audit.foliage).length >= 3, JSON.stringify(audit.foliage))
  assert.ok(Object.values(audit.foliage).every((record) => record.alpha === 1 && record.twoSided), `foliage clusters must stay opaque and two-sided: ${JSON.stringify(audit.foliage)}`)
})

test('vegetation ecology integrates tree bases and an irregular forest understory', () => {
  const { blendPath } = getGeneratedFixture()
  const inspectExpression = [
    'import bpy,json',
    "root=bpy.data.objects.get('SITE__vegetation-ecology')",
    "details=[o for o in bpy.data.objects if o.type=='MESH' and o.get('ecologyRole')]",
    "roles=['bare-soil-transition','sparse-grass','leaf-litter','low-understory']",
    "counts={role:sum(1 for o in details if o.get('ecologyRole')==role) for role in roles}",
    "missing_anchors=[o.name for o in details if not o.get('anchorName') or o.get('anchorName') not in bpy.data.objects]",
    "clearance=[bpy.data.objects.get(n) for n in ['COURT__surface','TENNIS__surface','GATE__recognition-zone','GATE__stop-line']]",
    "collisions=[[o.name,c.name] for o in details for c in clearance if c and abs(o.matrix_world.translation.x-c.matrix_world.translation.x)<(o.dimensions.x+c.dimensions.x)/2 and abs(o.matrix_world.translation.y-c.matrix_world.translation.y)<(o.dimensions.y+c.dimensions.y)/2]",
    "unstable=[o.name for o in details if o.matrix_world.translation.z-o.dimensions.z/2<0.015]",
    "materials={m.name:{'mean':sum(m.diffuse_color[:3])/3,'roughness':next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Roughness'].default_value} for m in {o.data.materials[0] for o in details if o.data.materials}}",
    "forest_x=[round(o.matrix_world.translation.x,2) for o in details if o.get('ecologyZone')=='forest-edge']",
    "print('VEGETATION_ECOLOGY_AUDIT='+json.dumps({'root':root.name if root else None,'counts':counts,'missingAnchors':missing_anchors,'collisions':collisions,'unstable':unstable,'materials':materials,'forestX':forest_x}))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('VEGETATION_ECOLOGY_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('VEGETATION_ECOLOGY_AUDIT='.length))
  assert.equal(audit.root, 'SITE__vegetation-ecology')
  assert.ok(audit.counts['bare-soil-transition'] >= 12, JSON.stringify(audit.counts))
  assert.ok(audit.counts['sparse-grass'] >= 24, JSON.stringify(audit.counts))
  assert.ok(audit.counts['leaf-litter'] >= 18, JSON.stringify(audit.counts))
  assert.ok(audit.counts['low-understory'] >= 18, JSON.stringify(audit.counts))
  assert.deepEqual(audit.missingAnchors, [], `ecology details must stay anchored to trees or forest ground: ${audit.missingAnchors}`)
  assert.deepEqual(audit.collisions, [], `ecology must preserve sports and gate clearances: ${JSON.stringify(audit.collisions)}`)
  assert.deepEqual(audit.unstable, [], `ecology details need a stable surface offset: ${audit.unstable}`)
  assert.ok(Object.values(audit.materials).every((record) => record.mean >= .06 && record.roughness >= .88), JSON.stringify(audit.materials))
  assert.ok(new Set(audit.forestX).size >= 14, `forest understory must not collapse into a repeated grid: ${JSON.stringify(audit.forestX)}`)
})

test('background forest forms an irregular PBR transition instead of a detached tree grid', () => {
  const { blendPath } = getGeneratedFixture()
  const inspectExpression = [
    'import bpy,json',
    "mat=bpy.data.materials.get('MAT__forest-ground')",
    "channels=sorted({n.image.get('pbrChannel') for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.get('pbrChannel')}) if mat else []",
    "crowns=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('ENV__tree-crown-')]",
    "bands={band:[o for o in crowns if o.get('forestBand')==band] for band in ['edge','mid','deep']}",
    "mean_height=lambda objects:sum(o.dimensions.z for o in objects)/len(objects) if objects else 0",
    "unique_y=len({round(o.matrix_world.translation.y,2) for o in crowns})",
    "meadows=[o for o in bpy.data.objects if o.name.startswith('ENV__transition-meadow-')]",
    "shrubs=[o for o in bpy.data.objects if o.name.startswith('ENV__edge-shrub-')]",
    "ground_roles={name:bpy.data.objects[name].get('transitionRole') for name in ['ENV__landscape-apron','ENV__forest-backdrop','ENV__forest-side-west','ENV__forest-side-east'] if name in bpy.data.objects}",
    "print('FOREST_TRANSITION_AUDIT='+json.dumps({'channels':channels,'crownCount':len(crowns),'bandCounts':{k:len(v) for k,v in bands.items()},'bandHeights':{k:mean_height(v) for k,v in bands.items()},'uniqueYRatio':unique_y/len(crowns) if crowns else 0,'meadows':len(meadows),'shrubs':len(shrubs),'groundRoles':ground_roles}))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('FOREST_TRANSITION_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('FOREST_TRANSITION_AUDIT='.length))
  assert.deepEqual(audit.channels, ['base-color', 'normal', 'roughness'])
  assert.ok(audit.crownCount >= 130, `background forest is too sparse: ${audit.crownCount}`)
  assert.ok(Object.values(audit.bandCounts).every((count) => count >= 20), JSON.stringify(audit.bandCounts))
  assert.ok(audit.bandHeights.edge < audit.bandHeights.deep, JSON.stringify(audit.bandHeights))
  assert.ok(audit.uniqueYRatio >= .55, `tree rows remain mechanically aligned: ${audit.uniqueYRatio}`)
  assert.ok(audit.meadows >= 8, `forest edge needs overlapping meadow patches: ${audit.meadows}`)
  assert.ok(audit.shrubs >= 24, `forest edge needs a low understory transition: ${audit.shrubs}`)
  assert.deepEqual(audit.groundRoles, {
    'ENV__forest-backdrop': 'deep-forest',
    'ENV__forest-side-east': 'side-buffer',
    'ENV__forest-side-west': 'side-buffer',
    'ENV__landscape-apron': 'campus-buffer',
  })
})

test('architectural materials export five embedded PBR families', () => {
  const { blendPath, glbPath } = getGeneratedFixture()
  const representatives = {
    'MAT__factory-wall': 'industrial-coated-metal',
    'MAT__warehouse-wall': 'warehouse-sandwich-panel',
    'MAT__admin-stone': 'administration-limestone',
    'MAT__wall-plinth': 'architectural-concrete',
    'MAT__roof': 'galvanized-roof',
  }
  const inspectExpression = [
    'import bpy,json',
    `expected=${JSON.stringify(representatives)}`,
    "shader=lambda mat:next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')",
    "channels=lambda mat:{n.image.get('pbrChannel'):{'name':n.image.name,'family':n.image.get('pbrFamily'),'embedded':n.image.packed_file is not None or n.image.source=='GENERATED','size':list(n.image.size),'colorspace':n.image.colorspace_settings.name} for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.get('pbrChannel')}",
    "occlusion=lambda mat:any(n.type=='GROUP' and n.node_tree and n.node_tree.name=='glTF Material Output' and n.inputs.get('Occlusion') and n.inputs['Occlusion'].is_linked for n in mat.node_tree.nodes)",
    "materials={name:{'family':bpy.data.materials[name].get('architecturalPbrFamily'),'channels':channels(bpy.data.materials[name]),'occlusionLinked':occlusion(bpy.data.materials[name]),'metallic':shader(bpy.data.materials[name]).inputs['Metallic'].default_value,'roughness':shader(bpy.data.materials[name]).inputs['Roughness'].default_value} for name in expected if name in bpy.data.materials}",
    "print('ARCHITECTURAL_PBR_AUDIT='+json.dumps(materials))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('ARCHITECTURAL_PBR_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('ARCHITECTURAL_PBR_AUDIT='.length))
  assert.deepEqual(Object.keys(audit).sort(), Object.keys(representatives).sort())
  for (const [name, expectedFamily] of Object.entries(representatives)) {
    const record = audit[name]
    assert.equal(record.family, expectedFamily)
    assert.deepEqual(Object.keys(record.channels).sort(), ['base-color', 'normal', 'occlusion', 'roughness'], `${name} needs a complete architectural PBR set`)
    assert.ok(Object.values(record.channels).every((image) => image.family === expectedFamily && image.embedded), `${name} images need the correct embedded family`)
    assert.ok(Object.values(record.channels).every((image) => image.size[0] >= 256 && image.size[1] >= 256), `${name} maps are too small`)
    assert.equal(record.channels.normal.colorspace, 'Non-Color')
    assert.equal(record.channels.roughness.colorspace, 'Non-Color')
    assert.equal(record.channels.occlusion.colorspace, 'Non-Color')
    assert.equal(record.occlusionLinked, true, `${name} must connect AO to glTF Material Output`)
  }
  assert.ok(audit['MAT__factory-wall'].metallic <= .12)
  assert.ok(audit['MAT__warehouse-wall'].metallic <= .12)
  assert.ok(audit['MAT__admin-stone'].metallic <= .02)
  assert.ok(audit['MAT__wall-plinth'].metallic <= .02)
  assert.ok(audit['MAT__roof'].metallic <= .18)
  assert.ok(audit['MAT__roof'].roughness >= .55)

  const glb = readFileSync(glbPath)
  const jsonLength = glb.readUInt32LE(12)
  const gltf = JSON.parse(glb.subarray(20, 20 + jsonLength).toString().replace(/\0+$/, ''))
  const images = gltf.images ?? []
  assert.ok(images.every((image) => image.bufferView !== undefined && image.uri === undefined), 'architectural textures must remain embedded in the GLB')
  for (const name of Object.keys(representatives)) {
    const material = gltf.materials.find((entry) => entry.name === name)
    assert.ok(material?.pbrMetallicRoughness?.baseColorTexture, `${name} needs an exported base-color texture`)
    assert.ok(material?.pbrMetallicRoughness?.metallicRoughnessTexture, `${name} needs an exported roughness texture`)
    assert.ok(material?.normalTexture, `${name} needs an exported normal texture`)
    assert.ok(material?.occlusionTexture, `${name} needs an exported occlusion texture`)
  }
})

test('architectural normal maps avoid high-frequency camera shimmer', () => {
  const { blendPath } = getGeneratedFixture()
  const inspectExpression = [
    'import bpy,json',
    "names=['MAT__factory-wall','MAT__warehouse-wall','MAT__roof']",
    "normal=lambda mat:next(n.image for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.get('pbrChannel')=='normal')",
    "row=lambda image:[image.pixels[((image.size[1]//2)*image.size[0]+x)*4]-0.5 for x in range(image.size[0])]",
    "metrics=lambda values:{'zeroCrossings':sum(1 for a,b in zip(values,values[1:]) if a*b<0),'meanAdjacentDelta':sum(abs(b-a) for a,b in zip(values,values[1:]))/max(1,len(values)-1)}",
    "audit={name:metrics(row(normal(bpy.data.materials[name]))) for name in names}",
    "print('ARCHITECTURAL_SHIMMER_AUDIT='+json.dumps(audit))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('ARCHITECTURAL_SHIMMER_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('ARCHITECTURAL_SHIMMER_AUDIT='.length))
  for (const [name, metrics] of Object.entries(audit)) {
    assert.ok(metrics.zeroCrossings <= 10, `${name} normal map oscillates too frequently for the dashboard camera: ${JSON.stringify(metrics)}`)
    assert.ok(metrics.meanAdjacentDelta <= .008, `${name} normal map changes too sharply between texels: ${JSON.stringify(metrics)}`)
  }
})

test('architectural PBR base colors keep building envelopes light without becoming flat white', () => {
  const { blendPath } = getGeneratedFixture()
  const expectedMinimums = {
    'MAT__factory-wall': 0.72,
    'MAT__warehouse-wall': 0.74,
    'MAT__admin-stone': 0.70,
    'MAT__wall-plinth': 0.62,
    'MAT__roof': 0.84,
  }
  const inspectExpression = [
    'import bpy,json',
    `expected=${JSON.stringify(expectedMinimums)}`,
    "base=lambda mat:next(n.image for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.get('pbrChannel')=='base-color')",
    "stats=lambda image:(lambda pixels:(lambda values:{'mean':sum(values)/len(values),'span':max(values)-min(values)})([(pixels[i]+pixels[i+1]+pixels[i+2])/3 for i in range(0,len(pixels),4)]))(list(image.pixels[:]))",
    "materials={name:stats(base(bpy.data.materials[name])) for name in expected}",
    "print('ARCHITECTURAL_LIGHT_PBR_AUDIT='+json.dumps(materials))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('ARCHITECTURAL_LIGHT_PBR_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('ARCHITECTURAL_LIGHT_PBR_AUDIT='.length))
  for (const [name, minimum] of Object.entries(expectedMinimums)) {
    assert.ok(audit[name].mean >= minimum && audit[name].mean <= 0.90, `${name} must remain a restrained light PBR surface: ${JSON.stringify(audit[name])}`)
    assert.ok(audit[name].span >= 0.01, `${name} base color must retain subtle surface variation: ${JSON.stringify(audit[name])}`)
  }
})

test('all primary building envelope materials remain pale and physically non-black', () => {
  const { blendPath } = getGeneratedFixture()
  const wallNames = [
    'MAT__factory-wall', 'MAT__factory-panel-light', 'MAT__factory-panel-mid',
    'MAT__warehouse-wall', 'MAT__warehouse-panel-light', 'MAT__warehouse-panel-mid',
    'MAT__admin-stone', 'MAT__limestone-light', 'MAT__limestone-shadow',
    'MAT__process-wall', 'MAT__process-panel-light', 'MAT__process-panel-mid',
    'MAT__utility-wall', 'MAT__utility-panel-light', 'MAT__utility-panel-mid',
    'MAT__laboratory-wall', 'MAT__laboratory-panel-light', 'MAT__laboratory-panel-mid',
  ]
  const roofNames = ['MAT__roof', 'MAT__roof-rib', 'MAT__galvanized-gutter', 'MAT__corner-flashing']
  const inspectExpression = [
    'import bpy,json',
    `wall_names=${JSON.stringify(wallNames)}`,
    `roof_names=${JSON.stringify(roofNames)}`,
    "shader=lambda mat:next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')",
    "base=lambda mat:next(n.image for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.get('pbrChannel')=='base-color')",
    "stats=lambda image:(lambda p:(lambda values:{'mean':sum(values)/len(values),'minimum':min(values)})([(p[i]+p[i+1]+p[i+2])/3 for i in range(0,len(p),4)]))(list(image.pixels[:]))",
    "record=lambda name:(lambda mat:(lambda values:{**values,'metallic':shader(mat).inputs['Metallic'].default_value,'roughness':shader(mat).inputs['Roughness'].default_value})(stats(base(mat))))(bpy.data.materials[name])",
    "print('PALE_ENVELOPE_AUDIT='+json.dumps({'walls':{name:record(name) for name in wall_names},'roofs':{name:record(name) for name in roof_names}}))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('PALE_ENVELOPE_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('PALE_ENVELOPE_AUDIT='.length))
  for (const [name, record] of Object.entries(audit.walls)) {
    assert.ok(record.mean >= 0.80 && record.mean <= 0.93, `${name} wall mean must stay pale: ${JSON.stringify(record)}`)
    assert.ok(record.minimum >= 0.62, `${name} wall texture contains a near-black region: ${JSON.stringify(record)}`)
    assert.ok(record.metallic <= 0.12, `${name} wall is too metallic: ${JSON.stringify(record)}`)
    assert.ok(record.roughness >= 0.58 && record.roughness <= 0.84, `${name} wall roughness is outside the pale-cladding range: ${JSON.stringify(record)}`)
  }
  for (const [name, record] of Object.entries(audit.roofs)) {
    assert.ok(record.mean >= 0.72 && record.mean <= 0.94, `${name} roof must stay light gray: ${JSON.stringify(record)}`)
    assert.ok(record.metallic <= 0.16, `${name} roof is too metallic: ${JSON.stringify(record)}`)
    assert.ok(record.roughness >= 0.55, `${name} roof is too glossy and can render black: ${JSON.stringify(record)}`)
  }
})

test('all four-sided wall cladding variants stay in a pale PBR value range', () => {
  const { blendPath } = getGeneratedFixture()
  const names = [
    'MAT__factory-wall', 'MAT__factory-panel-light', 'MAT__factory-panel-mid',
    'MAT__warehouse-wall', 'MAT__warehouse-panel-light', 'MAT__warehouse-panel-mid',
    'MAT__admin-stone', 'MAT__limestone-light', 'MAT__limestone-shadow',
    'MAT__process-wall', 'MAT__process-panel-light', 'MAT__process-panel-mid',
    'MAT__utility-wall', 'MAT__utility-panel-light', 'MAT__utility-panel-mid',
    'MAT__laboratory-wall', 'MAT__laboratory-panel-light', 'MAT__laboratory-panel-mid',
  ]
  const inspectExpression = [
    'import bpy,json',
    `names=${JSON.stringify(names)}`,
    "base=lambda mat:next(n.image for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.get('pbrChannel')=='base-color')",
    "mean=lambda image:(lambda p:sum((p[i]+p[i+1]+p[i+2])/3 for i in range(0,len(p),4))/(len(p)/4))(list(image.pixels[:]))",
    "values={name:mean(base(bpy.data.materials[name])) for name in names}",
    "print('PALE_CLADDING_AUDIT='+json.dumps(values))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('PALE_CLADDING_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const values = JSON.parse(auditLine.slice('PALE_CLADDING_AUDIT='.length))
  for (const [name, mean] of Object.entries(values)) {
    assert.ok(mean >= .78 && mean <= .92, `${name} must remain pale under directional Web lighting: ${mean}`)
  }
})

test('architectural walls and roofs tile PBR maps at building scale', () => {
  const { blendPath } = getGeneratedFixture()
  const representatives = [
    'main-production-hall__wall-shell',
    'front-warehouse__wall-shell',
    'administration__wall-shell',
    'main-production-hall__roof',
  ]
  const inspectExpression = [
    'import bpy,json',
    `names=${JSON.stringify(representatives)}`,
    "uv_range=lambda o:[max((uv.uv.x for uv in o.data.uv_layers.active.data),default=0)-min((uv.uv.x for uv in o.data.uv_layers.active.data),default=0),max((uv.uv.y for uv in o.data.uv_layers.active.data),default=0)-min((uv.uv.y for uv in o.data.uv_layers.active.data),default=0)] if o and o.type=='MESH' and o.data.uv_layers.active else [0,0]",
    "records={name:{'range':uv_range(bpy.data.objects.get(name)),'family':bpy.data.objects[name].data.materials[0].get('architecturalPbrFamily') if name in bpy.data.objects and bpy.data.objects[name].data.materials else None} for name in names}",
    "print('ARCHITECTURAL_UV_AUDIT='+json.dumps(records))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const auditLine = inspected.stdout.split('\n').find((line) => line.startsWith('ARCHITECTURAL_UV_AUDIT='))
  assert.ok(auditLine, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(auditLine.slice('ARCHITECTURAL_UV_AUDIT='.length))
  assert.deepEqual(Object.keys(audit).sort(), representatives.slice().sort())
  assert.ok(Object.values(audit).every((record) => record.family), JSON.stringify(audit))
  assert.ok(Object.values(audit).every((record) => record.range[0] >= 1.2), `architectural maps must repeat at least once across representative surfaces: ${JSON.stringify(audit)}`)
  assert.ok(Object.values(audit).every((record) => record.range[0] <= 3.2), `architectural maps repeat too densely for the dashboard camera: ${JSON.stringify(audit)}`)
})

test('exported GLB preserves usable non-color PBR pixels for walls and roofs', () => {
  const { output, glbPath } = getGeneratedFixture()
  const auditPath = join(output, 'exported-pbr-pixels.json')
  const inspectExpression = [
    'import bpy,json',
    `bpy.ops.import_scene.gltf(filepath=${JSON.stringify(glbPath)})`,
    "mean=lambda image:(lambda p:[sum(p[c::4])/len(p[c::4]) for c in range(4)])(list(image.pixels[:]))",
    "normal=next(image for image in bpy.data.images if 'galvanized-roof__shared__normal' in image.name)",
    "orm=next(image for image in bpy.data.images if 'galvanized-roof__shared__occlusion' in image.name and 'roughness' in image.name)",
    "result={'normal':mean(normal),'orm':mean(orm)}",
    `open(${JSON.stringify(auditPath)},'w').write(json.dumps(result))`,
  ].join(';')
  const inspected = spawnSync(BLENDER, ['--background', '--factory-startup', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(readFileSync(auditPath, 'utf8'))
  assert.ok(audit.normal[0] >= .35 && audit.normal[0] <= .65, `normal R channel must remain centered: ${audit.normal}`)
  assert.ok(audit.normal[1] >= .35 && audit.normal[1] <= .65, `normal G channel must remain centered: ${audit.normal}`)
  assert.ok(audit.normal[2] >= .9, `normal B channel must remain positive-Z: ${audit.normal}`)
  assert.ok(audit.orm[0] >= .82, `occlusion must not export as black: ${audit.orm}`)
  assert.ok(audit.orm[1] >= .5 && audit.orm[1] <= .95, `roughness must retain its authored range: ${audit.orm}`)
})

test('industrial operational realism concentrates role-based props in named work zones', () => {
  const { blendPath } = getGeneratedFixture()
  const inspectExpression = [
    'import bpy,json',
    "root=bpy.data.objects.get('SITE__operational-realism')",
    "details=[o for o in bpy.data.objects if o.type=='MESH' and o.get('operationRole')]",
    "roles=['dock-bumper','dock-seal','pallet-staging','loading-cage','safety-cone','service-signage','process-valve','process-instrument','cable-tray','pipe-label','arrival-furniture','arrival-planter','arrival-signage']",
    "counts={role:sum(1 for o in details if o.get('operationRole')==role) for role in roles}",
    "allowed={'gate','loading','maintenance','process','parking','administration-entry','sports-support'}",
    "invalid=[o.name for o in details if o.get('operationalZone') not in allowed or not o.get('anchorName') or o.get('anchorName') not in bpy.data.objects or not o.get('layerRole')]",
    "clearance=[bpy.data.objects.get(n) for n in ['COURT__surface','TENNIS__surface','GATE__recognition-zone','GATE__stop-line']]",
    "collisions=[[o.name,c.name] for o in details for c in clearance if c and abs(o.matrix_world.translation.x-c.matrix_world.translation.x)<(o.dimensions.x+c.dimensions.x)/2 and abs(o.matrix_world.translation.y-c.matrix_world.translation.y)<(o.dimensions.y+c.dimensions.y)/2]",
    "floating=[o.name for o in details if o.get('groundContact') and o.matrix_world.translation.z-o.dimensions.z/2>.20]",
    "print('OPERATIONAL_REALISM_AUDIT='+json.dumps({'root':root.name if root else None,'counts':counts,'invalid':invalid,'collisions':collisions,'floating':floating}))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8', timeout: BLENDER_TIMEOUT,
  })
  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const line = inspected.stdout.split('\n').find((value) => value.startsWith('OPERATIONAL_REALISM_AUDIT='))
  assert.ok(line, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(line.slice('OPERATIONAL_REALISM_AUDIT='.length))
  assert.equal(audit.root, 'SITE__operational-realism')
  const minimums = {
    'dock-bumper': 8, 'dock-seal': 5, 'pallet-staging': 6, 'loading-cage': 4,
    'safety-cone': 8, 'service-signage': 4, 'process-valve': 12,
    'process-instrument': 6, 'cable-tray': 4, 'pipe-label': 8,
    'arrival-furniture': 4, 'arrival-planter': 4, 'arrival-signage': 2,
  }
  for (const [role, minimum] of Object.entries(minimums)) {
    assert.ok(audit.counts[role] >= minimum, `${role} is under-authored: ${audit.counts[role]}/${minimum}`)
  }
  assert.deepEqual(audit.invalid, [], `operational props need valid role, zone, anchor and layer metadata: ${audit.invalid}`)
  assert.deepEqual(audit.collisions, [], `operational props must preserve sports and gate clearances: ${JSON.stringify(audit.collisions)}`)
  assert.deepEqual(audit.floating, [], `ground-contact props must sit on their work surface: ${audit.floating}`)
})

test('purposeful operators connect named task anchors with inspection dwell', () => {
  const { blendPath } = getGeneratedFixture()
  const inspectExpression = [
    'import bpy,json',
    "operators=[o for o in bpy.data.objects if o.type=='EMPTY' and o.get('motionPath')=='task-route']",
    "records=[]",
    "exec(\"for o in operators:\\n start=bpy.data.objects.get(o.get('taskStartAnchor',''))\\n end=bpy.data.objects.get(o.get('taskEndAnchor',''))\\n axis=o.get('motionAxis')\\n delta=abs((end.matrix_world.translation.x-start.matrix_world.translation.x) if start and end and axis=='x' else (end.matrix_world.translation.y-start.matrix_world.translation.y) if start and end and axis=='z' else 0)\\n records.append({'name':o.name,'start':bool(start),'end':bool(end),'distance':o.get('motionDistance',0),'delta':delta,'speed':o.get('motionSpeed',0),'dwell':o.get('dwellFraction',0),'role':o.get('taskRole'),'zone':o.get('operationalZone')})\")",
    "print('TASK_OPERATOR_AUDIT='+json.dumps(records))",
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8', timeout: BLENDER_TIMEOUT,
  })
  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const line = inspected.stdout.split('\n').find((value) => value.startsWith('TASK_OPERATOR_AUDIT='))
  assert.ok(line, inspected.stderr || inspected.stdout)
  const audit = JSON.parse(line.slice('TASK_OPERATOR_AUDIT='.length))
  assert.ok(audit.length >= 6, `expected six purposeful operator routes: ${audit.length}`)
  assert.ok(audit.every((record) => record.start && record.end), JSON.stringify(audit))
  assert.ok(audit.every((record) => Math.abs(record.distance - record.delta) <= .02), JSON.stringify(audit))
  assert.ok(audit.every((record) => record.speed > 0 && record.dwell >= .12 && record.dwell <= .24), JSON.stringify(audit))
  assert.ok(audit.every((record) => record.role && record.zone), JSON.stringify(audit))
})
