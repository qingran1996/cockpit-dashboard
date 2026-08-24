import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'

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

test('formal campus reuses repeated assets within the render budget', () => {
  const gltf = readGlbJson(MODEL_PATH)
  const meshCount = (gltf.meshes ?? []).length
  const materialCount = (gltf.materials ?? []).length
  const campusRoot = (gltf.nodes ?? []).find(({ name }) => name === 'FactoryCampusGraybox')
  const visibilityTiers = (gltf.nodes ?? []).reduce((counts, node) => {
    const tier = node.extras?.visibilityTier
    if (tier) counts[tier] = (counts[tier] ?? 0) + 1
    return counts
  }, {})

  assert.ok(meshCount <= 3800, `expected at most 3800 exported meshes, received ${meshCount}`)
  assert.ok(materialCount <= 100, `expected at most 100 exported materials, received ${materialCount}`)
  assert.ok(statSync(MODEL_PATH).size <= 32 * 1024 * 1024, 'formal campus exceeds the 32 MiB reuse target')
  assert.equal(campusRoot?.extras?.assetEfficiencyPass, 'geometry-signature-v1')
  assert.ok((visibilityTiers.near ?? 0) >= 100, `expected near-detail visibility tags, received ${visibilityTiers.near ?? 0}`)
  assert.ok((visibilityTiers.mid ?? 0) >= 40, `expected mid-detail visibility tags, received ${visibilityTiers.mid ?? 0}`)
})

test('hero buildings expose distinct functional silhouettes', () => {
  const gltf = readGlbJson(MODEL_PATH)
  const nodes = gltf.nodes ?? []
  const identityRoots = nodes.filter(({ name }) => name?.startsWith('IDENTITY__'))
  const roles = new Set(identityRoots.map((node) => node.extras?.identityRole).filter(Boolean))

  for (const role of ['administration-arrival', 'production-monitor', 'warehouse-logistics', 'utility-process']) {
    assert.ok(roles.has(role), `missing building identity role ${role}`)
  }
  for (const rootName of ['IDENTITY__administration', 'IDENTITY__main-production-hall', 'IDENTITY__front-warehouse', 'IDENTITY__far-east-utility']) {
    const root = nodes.find(({ name }) => name === rootName)
    assert.ok(root?.extras?.functionalZone, `missing functional zone on ${rootName}`)
    assert.ok(['hero', 'primary'].includes(root.extras.identityTier), `missing identity tier on ${rootName}`)
  }
  for (const detailName of [
    'IDENTITY__administration__two-story-lobby',
    'IDENTITY__administration__canopy-soffit',
    'IDENTITY__administration__side-service-entry',
    'IDENTITY__main-production-hall__monitor-shell',
    'IDENTITY__main-production-hall__monitor-clerestory-front',
    'IDENTITY__front-warehouse__dispatch-pod',
    'IDENTITY__front-warehouse__dock-canopy-01',
    'IDENTITY__far-east-utility__louver-tower',
    'IDENTITY__far-east-utility__cable-tray',
    'IDENTITY__far-east-utility__exhaust-stack-01',
  ]) {
    assert.ok(nodes.some(({ name }) => name === detailName), `missing silhouette detail ${detailName}`)
  }
  assert.ok(nodes.filter(({ name }) => name?.startsWith('IDENTITY__administration__forecourt-step-')).length >= 3)
  assert.ok(nodes.filter(({ name }) => name?.startsWith('IDENTITY__front-warehouse__dock-seal-')).length >= 3)
  assert.ok(nodes.filter(({ name }) => name?.startsWith('IDENTITY__far-east-utility__louver-blade-')).length >= 6)
})

test('campus boundary dissolves through layered horizon and planting', () => {
  const gltf = readGlbJson(MODEL_PATH)
  const nodes = gltf.nodes ?? []
  const horizonRoot = nodes.find(({ name }) => name === 'SITE__horizon-transition')
  const heroRoot = nodes.find(({ name }) => name === 'VEGETATION__hero-specimens')
  const horizon = nodes.filter((node) => node.extras?.horizonRole)
  const heroes = nodes.filter((node) => node.extras?.landscapeRole === 'hero-tree')
  const horizonRoles = new Set(horizon.map((node) => node.extras.horizonRole))
  const outerHorizon = horizon.filter((node) => {
    const [x = 0, , z = 0] = node.translation ?? []
    return Math.hypot(x, z) >= 50
  })

  assert.equal(horizonRoot?.extras?.landscapeSystem, 'layered-horizon-transition')
  assert.equal(heroRoot?.extras?.landscapeSystem, 'hierarchical-hero-planting')
  assert.ok(horizon.length >= 12, `expected at least 12 horizon transition pieces, received ${horizon.length}`)
  assert.ok(outerHorizon.length >= 12, `horizon pieces remain inside the campus board: ${outerHorizon.length}/${horizon.length}`)
  assert.ok(heroes.length >= 8, `expected at least 8 hero trees, received ${heroes.length}`)
  for (const role of ['meadow-island', 'scrub-island', 'drainage-island', 'forest-floor-island']) {
    assert.ok(horizonRoles.has(role), `missing horizon role ${role}`)
  }
  for (const hero of heroes) {
    assert.ok(['pedestrian-buffer', 'sports-buffer', 'parking-buffer', 'administration-buffer'].includes(hero.extras?.clearanceClass), `invalid hero-tree clearance on ${hero.name}`)
    assert.ok(['near', 'mid'].includes(hero.extras?.vegetationTier), `hero tree must remain readable at near or mid tier: ${hero.name}`)
  }
})

test('campus ground materials use broad low-frequency PBR separation', () => {
  const gltf = readGlbJson(MODEL_PATH)
  const groundMaterials = (gltf.materials ?? []).filter((material) => material.extras?.groundMaterialRole)
  const required = new Set(['new-asphalt', 'loading-concrete', 'walkway', 'lawn', 'bare-soil', 'mulch'])

  for (const material of groundMaterials) {
    required.delete(material.extras.groundMaterialRole)
    assert.ok(material.extras.groundTileSize >= 3.2 && material.extras.groundTileSize <= 5, `${material.name} has high-frequency tiling ${material.extras.groundTileSize}`)
    assert.ok((material.normalTexture?.scale ?? 0) <= .12, `${material.name} normal scale is too strong: ${material.normalTexture?.scale}`)
  }
  assert.deepEqual([...required], [], `missing ground PBR roles: ${[...required]}`)
})

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

test('generated GLB exposes animated robot workcells and local process piping', () => {
  const gltf = readGlbJson(MODEL_PATH)
  const nodes = gltf.nodes || []
  const byName = new Map(nodes.map((node) => [node.name, node]))
  const workcellNames = [
    'ROBOT_CELL__main-production-hall__L01__assembly-01',
    'ROBOT_CELL__main-production-hall__L01__assembly-02',
    'ROBOT_CELL__front-warehouse__L01__palletizer-01',
  ]

  for (const name of workcellNames) {
    const workcell = byName.get(name)
    assert.ok(workcell, `missing ${name}`)
    assert.equal(workcell.extras?.motionPath, 'robot-work-cycle')
    assert.ok(workcell.extras?.motionSpeed > 0, `${name} needs a positive work-cycle speed`)
  }

  const jointRoles = new Set(nodes.map((node) => node.extras?.robotJointRole).filter(Boolean))
  for (const role of ['turntable', 'shoulder', 'elbow', 'wrist', 'gripper-left', 'gripper-right', 'payload']) {
    assert.ok(jointRoles.has(role), `missing articulated robot joint role ${role}`)
  }

  assert.ok(nodes.filter((node) => node.extras?.equipmentRole === 'workcell-conveyor').length >= 3)
  assert.ok(nodes.filter((node) => node.extras?.equipmentRole === 'robot-safety-fence').length >= 6)
  assert.ok(nodes.filter((node) => node.extras?.layerRole === 'local-process-pipe').length >= 4)
  assert.equal(nodes.some((node) => ['SITE__water-network', 'SITE__power-network', 'SITE__steam-network', 'SITE__gas-network'].includes(node.name)), false)
})
