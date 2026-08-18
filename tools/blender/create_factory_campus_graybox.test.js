import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildingRegistry } from '../../src/scene/buildingRegistry.js'

const BLENDER = '/Applications/Blender.app/Contents/MacOS/Blender'
const BLENDER_TIMEOUT = 300_000
const GENERATOR = new URL('./create_factory_campus_graybox.py', import.meta.url).pathname
const REQUIRED_SCENE_DETAILS = [
  'SITE__outer-boulevard',
  'SITE__entry-plaza',
  'ADMIN__glass-bay-01',
  'PARKING__solar-panel-01',
  'COURT__hoop-left',
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
  'VEHICLE__gate-shuttle__root',
  'PATROL__campus-01',
]

test('Blender generator exports an editable scene with the complete GLB node contract', () => {
  const output = mkdtempSync(join(tmpdir(), 'factory-campus-graybox-'))
  const blendPath = join(output, 'factory-campus-graybox.blend')
  const glbPath = join(output, 'factory-campus-graybox.glb')
  const generated = spawnSync(BLENDER, [
    '--background', '--python', GENERATOR, '--',
    '--blend-output', blendPath,
    '--glb-output', glbPath,
  ], { encoding: 'utf8', timeout: BLENDER_TIMEOUT })

  assert.equal(generated.status, 0, generated.stderr || generated.stdout)
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
  const output = mkdtempSync(join(tmpdir(), 'factory-campus-layout-'))
  const blendPath = join(output, 'factory-campus-layout.blend')
  const glbPath = join(output, 'factory-campus-layout.glb')
  const generated = spawnSync(BLENDER, [
    '--background', '--python', GENERATOR, '--',
    '--blend-output', blendPath,
    '--glb-output', glbPath,
  ], { encoding: 'utf8', timeout: BLENDER_TIMEOUT })

  assert.equal(generated.status, 0, generated.stderr || generated.stdout)

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
    "siteNames=['ROAD_DETAIL__inner-curb-01','ROAD_DETAIL__crosswalk-01-01','ROAD_DETAIL__stop-line-01','ROAD_DETAIL__direction-arrow-01-stem','ROAD_DETAIL__drain-channel-01','PEDESTRIAN__walkway-01','PARKING__wheel-stop-01','LANDSCAPE__rain-garden-01','LANDSCAPE__rain-garden-grass-01-01','LANDSCAPE__shrub-mass-01','LANDSCAPE__inner-tree-trunk-01','LANDSCAPE__inner-tree-crown-01','LANDSCAPE__tree-grate-01']",
    "siteObjects={name:{'dimensions':list(bpy.data.objects[name].dimensions),'location':list(bpy.data.objects[name].matrix_world.translation),'parent':bpy.data.objects[name].parent.name if bpy.data.objects[name].parent else None,'material':bpy.data.objects[name].data.materials[0].name} for name in siteNames if name in bpy.data.objects}",
    "siteCounts={'curbs':sum(1 for o in bpy.data.objects if o.name.startswith('ROAD_DETAIL__inner-curb-')),'crosswalkStripes':sum(1 for o in bpy.data.objects if o.name.startswith('ROAD_DETAIL__crosswalk-')),'wheelStops':sum(1 for o in bpy.data.objects if o.name.startswith('PARKING__wheel-stop-')),'rainGardens':sum(1 for o in bpy.data.objects if o.name.startswith('LANDSCAPE__rain-garden-') and '-grass-' not in o.name),'grassClumps':sum(1 for o in bpy.data.objects if o.name.startswith('LANDSCAPE__rain-garden-grass-')),'shrubs':sum(1 for o in bpy.data.objects if o.name.startswith('LANDSCAPE__shrub-mass-')),'innerTrees':sum(1 for o in bpy.data.objects if o.name.startswith('LANDSCAPE__inner-tree-trunk-'))}",
    "siteMaterials={name:{'roughness':next(n for n in bpy.data.materials[name].node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Roughness'].default_value,'color':list(bpy.data.materials[name].diffuse_color)} for name in ['MAT__safety-yellow','MAT__bioswale-soil','MAT__ornamental-grass','MAT__shrub-deep'] if name in bpy.data.materials}",
    "gateBlockingTrees=[o.name for o in bpy.data.objects if o.name.startswith('TREE__trunk-') and 16.5 <= o.matrix_world.translation.x <= 24.5 and o.matrix_world.translation.y >= 17.4]",
    "forestCrowns=[o for o in bpy.data.objects if o.name.startswith('ENV__tree-crown-')]",
    "forestTrunks=[o for o in bpy.data.objects if o.name.startswith('ENV__tree-trunk-')]",
    "forestMetrics={'boundsX':[min(o.matrix_world.translation.x for o in forestCrowns),max(o.matrix_world.translation.x for o in forestCrowns)],'rearCount':sum(1 for o in forestCrowns if o.matrix_world.translation.y <= -21),'westCount':sum(1 for o in forestCrowns if o.matrix_world.translation.x <= -31 and -20 <= o.matrix_world.translation.y <= 17),'eastCount':sum(1 for o in forestCrowns if o.matrix_world.translation.x >= 31 and -20 <= o.matrix_world.translation.y <= 17),'uniqueCrownMeshes':len(set(o.data.name for o in forestCrowns)),'uniqueTrunkMeshes':len(set(o.data.name for o in forestTrunks))}",
    "apron=bpy.data.objects.get('ENV__landscape-apron')",
    "apronDimensions=list(apron.dimensions) if apron else None",
    "motion={k:bpy.data.objects['VEHICLE__gate-shuttle__root'].get(k) for k in ['motionPath','motionDistance','motionSpeed']}",
    "world=list(bpy.context.scene.world.color)",
    "layout={'site':list(site.dimensions),'main':list(main.dimensions),'rootScale':list(root.scale),'camera':list(camera.location),'admin':list(admin.matrix_world.translation),'east':list(east.matrix_world.translation),'rear':list(rear.matrix_world.translation),'world':world,'hasForest':'ENV__forest-backdrop' in bpy.data.objects,'bounds':bounds,'parkingBays':parkingBays,'siteObjects':siteObjects,'siteCounts':siteCounts,'siteMaterials':siteMaterials,'gateBlockingTrees':gateBlockingTrees,'forestMetrics':forestMetrics,'apronDimensions':apronDimensions,'motion':motion}",
    `open(${JSON.stringify(layoutPath)},'w').write(json.dumps(layout))`,
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: BLENDER_TIMEOUT,
  })

  assert.equal(inspected.status, 0, inspected.stderr || inspected.stdout)
  const layout = JSON.parse(readFileSync(layoutPath, 'utf8'))
  assert.ok(layout.site[0] >= 54 && layout.site[1] >= 38, `site is not expanded enough: ${layout.site}`)
  assert.ok(layout.main[0] >= 14 && layout.main[0] / layout.main[1] >= 2.2, `main hall lacks horizontal dominance: ${layout.main}`)
  assert.ok(layout.camera[0] < -45 && layout.camera[1] > 45, `camera is not pulled back over the expanded front-left site: ${layout.camera}`)
  assert.ok(layout.rootScale.every(value => value > 0), `negative root scale breaks Eevee after reloading: ${layout.rootScale}`)
  assert.ok(layout.admin[0] - layout.east[0] >= 22, `east service zone is not visually separated to the right of the administration frontage`)
  assert.ok(layout.rear[1] <= -8, `rear high-bay lacks depth separation: ${layout.rear}`)
  assert.ok(layout.world.reduce((sum, value) => sum + value, 0) / 3 >= 0.35, `world is too dark to create aerial depth: ${layout.world}`)
  assert.equal(layout.hasForest, true, 'missing forest backdrop for depth cues')
  assert.ok(layout.parkingBays >= 10, `parking lot needs at least ten marked bays: ${layout.parkingBays}`)
  assert.deepEqual(layout.gateBlockingTrees, [], 'gate entrance must keep a clear vehicle and sightline corridor')
  assert.ok(layout.apronDimensions?.[0] >= 72 && layout.apronDimensions?.[1] >= 56, `landscape apron must extend beyond the campus ground: ${layout.apronDimensions}`)
  assert.ok(layout.forestMetrics.boundsX[0] >= -37 && layout.forestMetrics.boundsX[1] <= 37, `background forest must stay centered over its terrain: ${layout.forestMetrics.boundsX}`)
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

test('Blender scene uses semi-realistic industrial materials and construction details', () => {
  const output = mkdtempSync(join(tmpdir(), 'factory-campus-realism-'))
  const blendPath = join(output, 'factory-campus-realism.blend')
  const glbPath = join(output, 'factory-campus-realism.glb')
  const generated = spawnSync(BLENDER, [
    '--background', '--python', GENERATOR, '--',
    '--blend-output', blendPath,
    '--glb-output', glbPath,
  ], { encoding: 'utf8', timeout: BLENDER_TIMEOUT })

  assert.equal(generated.status, 0, generated.stderr || generated.stdout)

  const realismPath = join(output, 'realism.json')
  const inspectExpression = [
    'import bpy,json',
    "details=['DETAIL__roof-rib-01','DETAIL__wall-plinth-01','DETAIL__gutter-01','DETAIL__downpipe-01','DETAIL__curb-01']",
    "props={name:{'roughness':s.inputs['Roughness'].default_value,'metallic':s.inputs['Metallic'].default_value,'transmission':s.inputs['Transmission Weight'].default_value,'coat':s.inputs['Coat Weight'].default_value} for name in ['MAT__roof','MAT__glass','MAT__asphalt','MAT__wall'] for s in [next(n for n in bpy.data.materials[name].node_tree.nodes if n.type=='BSDF_PRINCIPLED')]}",
    "result={'details':{name:name in bpy.data.objects for name in details},'roof':props['MAT__roof'],'glass':props['MAT__glass'],'asphalt':props['MAT__asphalt'],'wall':props['MAT__wall'],'camera':list(bpy.data.objects['ReferenceObliqueCamera'].location),'site':list(bpy.data.objects['SITE__ground'].dimensions)}",
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
  assert.ok(realism.roof.metallic >= 0.55 && realism.roof.roughness <= 0.46, `roof does not read as coated metal: ${JSON.stringify(realism.roof)}`)
  assert.ok(realism.glass.transmission >= 0.18 && realism.glass.coat >= 0.2, `glass lacks reflective depth: ${JSON.stringify(realism.glass)}`)
  assert.ok(realism.asphalt.roughness >= 0.9, `asphalt is too glossy: ${JSON.stringify(realism.asphalt)}`)
  assert.ok(realism.wall.roughness >= 0.58 && realism.wall.roughness <= 0.72, `painted wall finish is implausible: ${JSON.stringify(realism.wall)}`)
  assert.deepEqual(realism.camera, [-52, 54, 44], 'realism pass must preserve the expanded-site camera')
  assert.deepEqual(realism.site.map(value => Math.round(value * 100) / 100), [58, 42, 0.45], 'realism pass must preserve the expanded site dimensions')
})

test('representative buildings expose layered facade construction instead of flat wall stickers', () => {
  const output = mkdtempSync(join(tmpdir(), 'factory-campus-facades-'))
  const blendPath = join(output, 'factory-campus-facades.blend')
  const glbPath = join(output, 'factory-campus-facades.glb')
  const generated = spawnSync(BLENDER, [
    '--background', '--python', GENERATOR, '--',
    '--blend-output', blendPath,
    '--glb-output', glbPath,
  ], { encoding: 'utf8', timeout: BLENDER_TIMEOUT })

  assert.equal(generated.status, 0, generated.stderr || generated.stdout)

  const facadePath = join(output, 'facades.json')
  const inspectExpression = [
    'import bpy,json',
    "names=['MAIN__portal-frame-01','MAIN__loading-dock-platform','MAIN__sectional-door-frame-01','MAIN__wall-rib-front-01','MAIN__wall-rib-side-01','MAIN__clerestory-reveal-01','MAIN__clerestory-frame-top-01','MAIN__sectional-door-slat-01-01','MAIN__loading-canopy','MAIN__loading-canopy-bracket-01','MAIN__downpipe-01','MAIN__downpipe-stand-off-01-01','MAIN__safety-sign-loading','MAIN__exterior-light-01','ADMIN__window-reveal-01','ADMIN__window-frame-top-01','ADMIN__entrance-step-01','GATEHOUSE__window-reveal-01','GATEHOUSE__canopy-bracket-01','GATEHOUSE__bollard-01']",
    "objects={name:{'dimensions':list(bpy.data.objects[name].dimensions),'parent':bpy.data.objects[name].parent.name if bpy.data.objects[name].parent else None,'material':bpy.data.objects[name].data.materials[0].name} for name in names if name in bpy.data.objects}",
    "materials={name:{'roughness':next(n for n in bpy.data.materials[name].node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Roughness'].default_value,'metallic':next(n for n in bpy.data.materials[name].node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Metallic'].default_value} for name in ['MAT__facade-frame','MAT__wall-secondary','MAT__dock-rubber','MAT__wall-rib','MAT__safety-orange','MAT__luminaire'] if name in bpy.data.materials}",
    "counts={'frontRibs':sum(1 for o in bpy.data.objects if o.name.startswith('MAIN__wall-rib-front-')),'sideRibs':sum(1 for o in bpy.data.objects if o.name.startswith('MAIN__wall-rib-side-')),'doorSlats':sum(1 for o in bpy.data.objects if o.name.startswith('MAIN__sectional-door-slat-')),'clerestoryReveals':sum(1 for o in bpy.data.objects if o.name.startswith('MAIN__clerestory-reveal-'))}",
    "ids=['administration','main-production-hall','laboratory','gatehouse']",
    "constructed={id:{'frames':sum(1 for o in bpy.data.objects if o.name.startswith('FACADE__'+id+'__frame-')),'reveals':sum(1 for o in bpy.data.objects if o.name.startswith('FACADE__'+id+'__reveal-')),'gutters':sum(1 for o in bpy.data.objects if o.name.startswith('ROOF__'+id+'__gutter-')),'downpipes':sum(1 for o in bpy.data.objects if o.name.startswith('SERVICE__'+id+'__downpipe-')),'parent':bpy.data.objects.get('FACADE__'+id+'__frame-01').parent.name if bpy.data.objects.get('FACADE__'+id+'__frame-01') else None} for id in ids}",
    "result={'objects':objects,'materials':materials,'counts':counts,'constructed':constructed}",
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
  for (const [id, record] of Object.entries(facade.constructed)) {
    assert.ok(record.frames >= 2, `${id} needs a constructed facade frame rhythm`)
    assert.ok(record.reveals >= 2, `${id} needs recessed facade openings`)
    assert.ok(record.gutters >= 1, `${id} needs a roof gutter`)
    assert.ok(record.downpipes >= 2, `${id} needs paired downpipes`)
    assert.equal(record.parent, `BLDG__${id}`)
  }
})

test('every building exports constructed front and side wall cladding instead of a uniform white shell', () => {
  const output = mkdtempSync(join(tmpdir(), 'factory-campus-wall-cladding-'))
  const blendPath = join(output, 'factory-campus-wall-cladding.blend')
  const glbPath = join(output, 'factory-campus-wall-cladding.glb')
  const generated = spawnSync(BLENDER, [
    '--background', '--python', GENERATOR, '--',
    '--blend-output', blendPath,
    '--glb-output', glbPath,
  ], { encoding: 'utf8', timeout: BLENDER_TIMEOUT })

  assert.equal(generated.status, 0, generated.stderr || generated.stdout)

  const claddingPath = join(output, 'wall-cladding.json')
  const ids = buildingRegistry.map(({ id }) => id)
  const inspectExpression = [
    'import bpy,json',
    `ids=${JSON.stringify(ids)}`,
    "records={id:{'front':sum(1 for o in bpy.data.objects if o.name.startswith('CLADDING__'+id+'__front-panel-')),'side':sum(1 for o in bpy.data.objects if o.name.startswith('CLADDING__'+id+'__side-panel-')),'hasSkirt':'CLADDING__'+id+'__wall-skirt-front' in bpy.data.objects,'hasCorner':'CLADDING__'+id+'__corner-trim-left' in bpy.data.objects,'frontParent':bpy.data.objects.get('CLADDING__'+id+'__front-panel-01').parent.name if bpy.data.objects.get('CLADDING__'+id+'__front-panel-01') else None} for id in ids}",
    "mainMaterials=[bpy.data.objects[name].data.materials[0].name for name in ['CLADDING__main-production-hall__front-panel-01','CLADDING__main-production-hall__front-panel-02'] if name in bpy.data.objects]",
    "wallColor=list(bpy.data.materials['MAT__wall'].diffuse_color)",
    "materialNames=[name for name in ['MAT__wall-panel-light','MAT__wall-panel-mid','MAT__corner-flashing'] if name in bpy.data.materials]",
    "result={'records':records,'mainMaterials':mainMaterials,'wallColor':wallColor,'materialNames':materialNames}",
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
    assert.ok(record.side >= 2, `${id} needs modular visible-side wall panels`)
    assert.equal(record.hasSkirt, true, `${id} needs a durable lower wall skirt`)
    assert.equal(record.hasCorner, true, `${id} needs visible corner flashing`)
    assert.equal(record.frontParent, `BLDG__${id}`, `${id} cladding must follow the building exterior during floor explosion`)
  }
  assert.deepEqual(cladding.mainMaterials, ['MAT__wall-panel-light', 'MAT__wall-panel-mid'])
  assert.deepEqual(cladding.materialNames.sort(), ['MAT__corner-flashing', 'MAT__wall-panel-light', 'MAT__wall-panel-mid'])
  assert.ok(cladding.wallColor.slice(0, 3).reduce((sum, value) => sum + value, 0) / 3 <= 0.68, `base wall is still too white: ${cladding.wallColor}`)
})

test('Blender floors contain use-specific interiors and walking staff', () => {
  const output = mkdtempSync(join(tmpdir(), 'factory-campus-interiors-'))
  const blendPath = join(output, 'factory-campus-interiors.blend')
  const glbPath = join(output, 'factory-campus-interiors.glb')
  const generated = spawnSync(BLENDER, [
    '--background', '--python', GENERATOR, '--',
    '--blend-output', blendPath,
    '--glb-output', glbPath,
  ], { encoding: 'utf8', timeout: BLENDER_TIMEOUT })

  assert.equal(generated.status, 0, generated.stderr || generated.stdout)

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
  assert.deepEqual(interiors.gate, { motionPath: 'gate-barrier', motionAxis: 'z', motionSpeed: .09, closedAngle: 0, openAngle: -1.22 })
  for (const [name, zone] of Object.entries(interiors.zones)) {
    assert.equal(zone.exists, true, `missing functional interior zone ${name}`)
    assert.ok(zone.usage, `${name} needs explicit usage metadata`)
    assert.ok(zone.clearAisleWidth >= .55, `${name} needs at least .55 clear aisle width`)
  }
  assert.deepEqual(interiors.materials.sort(), ['MAT__hardhat', 'MAT__interior-equipment', 'MAT__interior-worktop', 'MAT__safety-vest', 'MAT__workwear'])
})

test('Blender GLB exports an interactive floor hierarchy without changing the approved layout', () => {
  const output = mkdtempSync(join(tmpdir(), 'factory-campus-floors-'))
  const blendPath = join(output, 'factory-campus-floors.blend')
  const glbPath = join(output, 'factory-campus-floors.glb')
  const generated = spawnSync(BLENDER, [
    '--background', '--python', GENERATOR, '--',
    '--blend-output', blendPath,
    '--glb-output', glbPath,
  ], { encoding: 'utf8', timeout: BLENDER_TIMEOUT })

  assert.equal(generated.status, 0, generated.stderr || generated.stdout)

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
  assert.deepEqual(hierarchy.site.map(value => Math.round(value * 100) / 100), [58, 42, 0.45])
})
