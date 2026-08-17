import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildingRegistry } from '../../src/scene/buildingRegistry.js'

const BLENDER = '/Applications/Blender.app/Contents/MacOS/Blender'
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
  'VEHICLE__gate-shuttle__root',
]

test('Blender generator exports an editable scene with the complete GLB node contract', () => {
  const output = mkdtempSync(join(tmpdir(), 'factory-campus-graybox-'))
  const blendPath = join(output, 'factory-campus-graybox.blend')
  const glbPath = join(output, 'factory-campus-graybox.glb')
  const generated = spawnSync(BLENDER, [
    '--background', '--python', GENERATOR, '--',
    '--blend-output', blendPath,
    '--glb-output', glbPath,
  ], { encoding: 'utf8', timeout: 180_000 })

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
    timeout: 180_000,
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
  ], { encoding: 'utf8', timeout: 180_000 })

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
    "motion={k:bpy.data.objects['VEHICLE__gate-shuttle__root'].get(k) for k in ['motionPath','motionDistance','motionSpeed']}",
    "world=list(bpy.context.scene.world.color)",
    "layout={'site':list(site.dimensions),'main':list(main.dimensions),'rootScale':list(root.scale),'camera':list(camera.location),'admin':list(admin.matrix_world.translation),'east':list(east.matrix_world.translation),'rear':list(rear.matrix_world.translation),'world':world,'hasForest':'ENV__forest-backdrop' in bpy.data.objects,'bounds':bounds,'parkingBays':parkingBays,'motion':motion}",
    `open(${JSON.stringify(layoutPath)},'w').write(json.dumps(layout))`,
  ].join(';')
  const inspected = spawnSync(BLENDER, [blendPath, '--background', '--python-expr', inspectExpression], {
    encoding: 'utf8',
    timeout: 180_000,
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
  ], { encoding: 'utf8', timeout: 180_000 })

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
    timeout: 180_000,
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

test('Blender GLB exports an interactive floor hierarchy without changing the approved layout', () => {
  const output = mkdtempSync(join(tmpdir(), 'factory-campus-floors-'))
  const blendPath = join(output, 'factory-campus-floors.blend')
  const glbPath = join(output, 'factory-campus-floors.glb')
  const generated = spawnSync(BLENDER, [
    '--background', '--python', GENERATOR, '--',
    '--blend-output', blendPath,
    '--glb-output', glbPath,
  ], { encoding: 'utf8', timeout: 180_000 })

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
    timeout: 180_000,
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
