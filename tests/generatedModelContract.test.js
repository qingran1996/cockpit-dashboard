import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const MODEL_PATH = process.env.GENERATED_MODEL_PATH || new URL('../public/models/factory-campus-graybox.glb', import.meta.url)
const BUILDING_IDS = [
  'main-production-hall', 'central-processing-hall', 'rear-high-bay', 'north-east-workshop',
  'east-process-hall', 'far-east-utility', 'east-warehouse', 'front-warehouse',
  'front-utility-annex', 'laboratory', 'administration', 'gatehouse',
]

function readGlbJson(path) {
  const buffer = readFileSync(path)
  assert.equal(buffer.toString('utf8', 0, 4), 'glTF')
  const jsonLength = buffer.readUInt32LE(12)
  const jsonType = buffer.toString('utf8', 16, 20)
  assert.equal(jsonType, 'JSON')
  return JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength))
}

function nodeDimensions(gltf, nodeName) {
  const node = (gltf.nodes || []).find(({ name }) => name === nodeName)
  assert.ok(node?.mesh !== undefined, `missing mesh node ${nodeName}`)
  const primitive = gltf.meshes[node.mesh].primitives[0]
  const accessor = gltf.accessors[primitive.attributes.POSITION]
  const scale = node.scale || [1, 1, 1]
  return accessor.max.map((value, index) => (value - accessor.min[index]) * Math.abs(scale[index]))
}

test('generated GLB carries tactile facade joints and pressed battens', () => {
  const gltf = readGlbJson(MODEL_PATH)
  const names = (gltf.nodes || []).map(({ name }) => name || '')
  const materials = new Map((gltf.materials || []).map((material) => [material.name, material]))
  const shadowJoints = names.filter((name) => name.includes('__front-shadow-joint-') || name.includes('__side-shadow-joint-'))
  const pressedBattens = names.filter((name) => name.includes('__pressed-batten-'))
  const jointMaterial = materials.get('MAT__facade-shadow-joint')

  assert.ok(shadowJoints.length >= 45, `expected repeated physical facade shadow joints, received ${shadowJoints.length}`)
  assert.ok(pressedBattens.length >= 24, `expected horizontal pressed battens on every building, received ${pressedBattens.length}`)
  assert.ok(jointMaterial, 'missing MAT__facade-shadow-joint')
  const jointColor = jointMaterial.pbrMetallicRoughness.baseColorFactor.slice(0, 3)
  assert.ok(jointColor.reduce((sum, value) => sum + value, 0) / 3 <= .18, `facade joints are too pale: ${jointColor}`)
  assert.ok(jointMaterial.pbrMetallicRoughness.roughnessFactor >= .68, 'facade joints need a matte recessed-metal response')
})

test('generated GLB keeps only one physical facade-joint system', () => {
  const gltf = readGlbJson(MODEL_PATH)
  const names = (gltf.nodes || []).map(({ name }) => name || '')
  const legacyJoints = names.filter((name) => name.startsWith('DETAIL__facade-joint-'))

  assert.deepEqual(legacyJoints, [], `legacy facade joints overlap the cladding joints: ${legacyJoints.length}`)
  assert.ok(names.some((name) => name.includes('__front-shadow-joint-')), 'physical cladding joints must remain')
})

test('generated GLB bounds architectural normal strength to prevent camera shimmer', () => {
  const gltf = readGlbJson(MODEL_PATH)
  const materials = new Map((gltf.materials || []).map((material) => [material.name, material]))
  const limits = new Map([
    ['MAT__factory-wall', .14],
    ['MAT__warehouse-wall', .14],
    ['MAT__roof', .16],
  ])

  for (const [name, limit] of limits) {
    const material = materials.get(name)
    assert.ok(material?.normalTexture, `${name} must retain a normal map`)
    assert.ok(material.normalTexture.scale <= limit, `${name} normal scale ${material.normalTexture.scale} exceeds ${limit}`)
  }
})

test('generated GLB presents a grand administration landmark', () => {
  const gltf = readGlbJson(MODEL_PATH)
  const names = (gltf.nodes || []).map(({ name }) => name || '')
  const materials = new Set((gltf.materials || []).map(({ name }) => name))

  assert.ok(names.includes('ADMIN__grand-atrium'))
  assert.ok(names.includes('ADMIN__grand-canopy'))
  assert.ok(names.includes('ADMIN__crown-band'))
  assert.ok(names.filter((name) => name.startsWith('ADMIN__portico-column-')).length >= 4)
  assert.ok(materials.has('MAT__architectural-bronze'))
})

test('generated GLB contains enlarged basketball and fenced tennis courts', () => {
  const gltf = readGlbJson(MODEL_PATH)
  const names = (gltf.nodes || []).map(({ name }) => name || '')
  const basketballPlan = nodeDimensions(gltf, 'COURT__surface').sort((left, right) => right - left)
  const basketballRoot = gltf.nodes.find(({ name }) => name === 'SITE__basketball-court')
  const tennisRoot = gltf.nodes.find(({ name }) => name === 'SITE__tennis-court')

  assert.ok(basketballPlan[0] >= 8.7 && basketballPlan[1] >= 5.1, `basketball court remains undersized: ${basketballPlan}`)
  for (const required of ['SITE__tennis-court', 'TENNIS__surface', 'TENNIS__net', 'TENNIS__net-post-left', 'TENNIS__net-post-right', 'BASKET__gate', 'BASKET__gate-leaf', 'TENNIS__gate', 'TENNIS__gate-leaf']) {
    assert.ok(names.includes(required), `missing ${required}`)
  }
  assert.ok(basketballRoot.translation[0] >= 22 && basketballRoot.translation[0] <= 28, `basketball court is not in the upper-left open parcel: ${basketballRoot.translation}`)
  assert.ok(basketballRoot.translation[2] >= 18, `basketball court must sit behind the rear internal road: ${basketballRoot.translation}`)
  assert.ok(tennisRoot.translation[0] >= 10 && tennisRoot.translation[0] <= 16, `tennis court is not in the upper-left open parcel: ${tennisRoot.translation}`)
  assert.ok(tennisRoot.translation[2] >= 18, `tennis court must sit behind the rear internal road: ${tennisRoot.translation}`)
  assert.ok(names.filter((name) => name.startsWith('TENNIS__fence-run-')).length >= 4)
  const tennisPlan = nodeDimensions(gltf, 'TENNIS__surface').sort((left, right) => right - left)
  assert.ok(tennisPlan[0] >= 8.3 && tennisPlan[1] >= 4.3, `tennis court remains undersized: ${tennisPlan}`)
})

test('generated GLB exports the industrial process core and warehouse logistics system', () => {
  const gltf = readGlbJson(MODEL_PATH)
  const names = (gltf.nodes || []).map(({ name }) => name || '')
  const required = [
    'SITE__process-core',
    'PROCESS__tank-01',
    'PROCESS__cooling-cell-01',
    'PROCESS__scrubber-stack',
    'PROCESS__substation-transformer-01',
    'PROCESS__wastewater-basin',
    'PROCESS__network-connector-01',
    'PROCESS__substation-fence',
    'SITE__logistics-yard',
    'LOGISTICS__front-warehouse-apron',
    'LOGISTICS__dock-platform-01',
    'LOGISTICS__weighbridge',
    'VEHICLE__forklift-01',
    'LAB__curtain-wall',
    'LAB__recessed-entry-frame',
    'WAREHOUSE__loading-door-reveal-01',
    'UTILITY__louver-bank-01',
    'UTILITY__hazard-sign',
  ]

  for (const nodeName of required) {
    assert.ok(names.includes(nodeName), `missing ${nodeName}`)
  }
  assert.equal(names.filter((name) => /^PROCESS__tank-\d{2}$/.test(name)).length, 3)
  assert.equal(names.filter((name) => /^PROCESS__cooling-cell-\d{2}$/.test(name)).length, 2)
  assert.equal(names.filter((name) => /^LOGISTICS__dock-platform-\d{2}$/.test(name)).length, 3)
})

test('generated GLB exports operational routes and linked vehicles', () => {
  const gltf = readGlbJson(MODEL_PATH)
  const nodes = new Map((gltf.nodes || []).map((node) => [node.name, node]))
  const expected = {
    'warehouse-delivery': { vehicle: 'VEHICLE__delivery-truck__root', waypointCount: 7 },
    'maintenance-service': { vehicle: 'VEHICLE__maintenance-van__root', waypointCount: 6 },
    'fire-patrol': { vehicle: 'VEHICLE__fire-patrol__root', waypointCount: 9 },
  }

  for (const [routeId, record] of Object.entries(expected)) {
    const route = nodes.get(`ROUTE__${routeId}`)
    assert.ok(route, `missing ROUTE__${routeId}`)
    assert.equal(route.extras.routeId, routeId)
    assert.equal(route.extras.layerRole, 'vehicle-route')
    for (let order = 1; order <= record.waypointCount; order += 1) {
      const waypoint = nodes.get(`WAYPOINT__${routeId}__${String(order).padStart(2, '0')}`)
      assert.ok(waypoint, `missing waypoint ${routeId} ${order}`)
      assert.equal(waypoint.extras.routeId, routeId)
      assert.equal(waypoint.extras.waypointOrder, order)
    }
    const vehicle = nodes.get(record.vehicle)
    assert.ok(vehicle, `missing ${record.vehicle}`)
    assert.equal(vehicle.extras.motionPath, 'campus-route')
    assert.equal(vehicle.extras.linkedRoute, routeId)
    assert.ok(vehicle.extras.motionSpeed > 0)
  }
})

test('generated campus defines readable circulation wear and drainage without coplanar decals', () => {
  const gltf = readGlbJson(MODEL_PATH)
  const roles = (gltf.nodes || []).map((node) => node.extras?.groundDetailRole).filter(Boolean)

  assert.ok(roles.filter((role) => role === 'tire-wear').length >= 8, 'vehicle lanes need broad tire-wear cues')
  assert.ok(roles.filter((role) => role === 'drainage').length >= 8, 'service yards need readable drainage')
  assert.ok(roles.includes('service-yard'), 'campus needs a defined hardstand service yard')
})

test('generated campus softens the forest boundary with diverse ecological layers', () => {
  const gltf = readGlbJson(MODEL_PATH)
  const roles = (gltf.nodes || []).map((node) => node.extras?.ecologyTransitionRole).filter(Boolean)

  assert.ok(roles.filter((role) => role === 'forest-edge-shrub').length >= 18, 'forest edge needs irregular shrub massing')
  assert.ok(roles.filter((role) => role === 'meadow-transition').length >= 10, 'forest edge needs a meadow transition layer')
})

test('every interactive building has a credible rear service envelope', () => {
  const gltf = readGlbJson(MODEL_PATH)
  const nodes = gltf.nodes || []

  for (const id of BUILDING_IDS) {
    const roles = nodes
      .filter((node) => node.extras?.buildingId === id)
      .map((node) => node.extras?.serviceEnvelopeRole)
      .filter(Boolean)
    assert.ok(roles.includes('rear-service-door'), `${id} is missing a rear service door`)
    assert.ok(roles.includes('rear-ventilation'), `${id} is missing rear ventilation`)
    assert.ok(roles.includes('rear-service-pad'), `${id} is missing a protected rear service pad`)
  }
})
