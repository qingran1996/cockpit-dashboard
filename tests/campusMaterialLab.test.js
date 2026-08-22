import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'

function pbrMaterial(name, family, color = 0xffffff) {
  const material = new THREE.MeshStandardMaterial({ color, roughness: .65, metalness: .05 })
  material.name = name
  material.userData.architecturalPbrFamily = family
  material.map = new THREE.Texture()
  material.normalMap = new THREE.Texture()
  material.roughnessMap = new THREE.Texture()
  material.aoMap = new THREE.Texture()
  material.normalScale.set(.12, .12)
  material.aoMapIntensity = .78
  material.envMapIntensity = .72
  return material
}

function mesh(name, material, buildingId = null) {
  const object = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material)
  object.name = name
  if (buildingId) object.userData.buildingId = buildingId
  return object
}

function fixture() {
  const root = new THREE.Group()
  const buildingA = new THREE.Group()
  const buildingB = new THREE.Group()
  buildingA.userData.buildingId = 'building-a'
  buildingB.userData.buildingId = 'building-b'
  const originalA = pbrMaterial('MAT__factory-wall', 'industrial-coated-metal')
  const originalB = pbrMaterial('MAT__factory-panel-light', 'industrial-coated-metal')
  const facadeA = mesh('FACADE__building-a', originalA, 'building-a')
  const facadeB = mesh('FACADE__building-b', originalB, 'building-b')
  buildingA.add(facadeA)
  buildingB.add(facadeB)
  root.add(buildingA, buildingB)

  const templates = {
    warehouse: pbrMaterial('MAT__warehouse-wall', 'warehouse-sandwich-panel', 0xf0e8d8),
    limestone: pbrMaterial('MAT__admin-stone', 'administration-limestone', 0xeee4d2),
    concrete: pbrMaterial('MAT__wall-plinth', 'architectural-concrete', 0xc3c7c5),
    roof: pbrMaterial('MAT__roof', 'galvanized-roof', 0xe4e7e8),
  }
  Object.values(templates).forEach((material, index) => root.add(mesh(`TEMPLATE__${index}`, material)))
  return { root, facadeA, facadeB, originalA, originalB, templates }
}

test('applies an isolated embedded PBR family to one building and restores the exact original', async () => {
  const module = await import('../src/scene/campusMaterialLab.js').catch(() => ({}))
  assert.equal(typeof module.createCampusMaterialController, 'function', 'campus material controller is missing')
  const { root, facadeA, facadeB, originalA, originalB, templates } = fixture()
  const controller = module.createCampusMaterialController(root)

  const applied = controller.apply('building-a', 'facade', {
    family: 'warehouse-sandwich-panel',
    tint: '#ddeeff',
    roughness: .6,
    normalStrength: .2,
    aoIntensity: .9,
    textureScale: 1.4,
    environmentIntensity: .5,
  })

  assert.equal(applied, true)
  assert.notEqual(facadeA.material, templates.warehouse)
  assert.notEqual(facadeA.material.map, templates.warehouse.map)
  assert.equal(facadeA.material.color.getHex(), 0xddeeff)
  assert.equal(facadeA.material.roughness, .6)
  assert.equal(facadeA.material.normalScale.x, .2)
  assert.equal(facadeA.material.aoMapIntensity, .9)
  assert.equal(facadeA.material.map.repeat.x, 1.4)
  assert.equal(facadeA.material.envMapIntensity, .5)
  assert.equal(facadeB.material, originalB, 'editing one building must not mutate another building')

  assert.equal(controller.reset('building-a', 'facade'), true)
  assert.equal(facadeA.material, originalA)
  assert.equal(facadeB.material, originalB)
})

test('enforces construction-scope material choices and bounded commissioning values', async () => {
  const module = await import('../src/scene/campusMaterialLab.js').catch(() => ({}))
  const { root, facadeA, originalA } = fixture()
  const controller = module.createCampusMaterialController(root)

  assert.equal(controller.apply('building-a', 'roof', { family: 'administration-limestone' }), false)
  assert.equal(facadeA.material, originalA)

  assert.equal(controller.apply('building-a', 'facade', {
    family: 'industrial-coated-metal',
    tint: 'invalid',
    roughness: 9,
    normalStrength: -2,
    aoIntensity: 5,
    textureScale: 10,
    environmentIntensity: -1,
  }), true)
  assert.equal(facadeA.material.color.getHex(), 0xffffff)
  assert.equal(facadeA.material.roughness, .9)
  assert.equal(facadeA.material.normalScale.x, 0)
  assert.equal(facadeA.material.aoMapIntensity, 1.2)
  assert.equal(facadeA.material.map.repeat.x, 3)
  assert.equal(facadeA.material.envMapIntensity, 0)
})

test('provides building-aware defaults and real five-family sample metadata', async () => {
  const module = await import('../src/scene/campusMaterialLab.js').catch(() => ({}))
  assert.equal(typeof module.createBuildingMaterialSettings, 'function', 'material settings factory is missing')
  assert.equal(module.CAMPUS_MATERIAL_FAMILIES?.length, 5)
  assert.deepEqual(module.CAMPUS_MATERIAL_SCOPES?.map((scope) => scope.id), ['facade', 'roof', 'plinth'])

  const warehouse = module.createBuildingMaterialSettings({ id: 'front-warehouse', model: 'factory' })
  const administration = module.createBuildingMaterialSettings({ id: 'administration', model: 'office' })
  assert.equal(warehouse.facade.family, 'warehouse-sandwich-panel')
  assert.equal(administration.facade.family, 'administration-limestone')
  assert.equal(warehouse.roof.family, 'galvanized-roof')
  assert.equal(warehouse.plinth.family, 'architectural-concrete')
})

test('updates one construction scope and resets parameters when its material family changes', async () => {
  const module = await import('../src/scene/campusMaterialLab.js').catch(() => ({}))
  assert.equal(typeof module.updateBuildingMaterialSettings, 'function', 'material settings updater is missing')
  const initial = module.createBuildingMaterialSettings({ id: 'main-production-hall', model: 'factory' })
  const concrete = module.updateBuildingMaterialSettings(initial, 'facade', { family: 'architectural-concrete' })
  assert.equal(concrete.facade.family, 'architectural-concrete')
  assert.equal(concrete.facade.roughness, .82)
  assert.equal(concrete.roof, initial.roof)

  const tuned = module.updateBuildingMaterialSettings(concrete, 'facade', { roughness: .57, textureScale: 1.8 })
  assert.equal(tuned.facade.roughness, .57)
  assert.equal(tuned.facade.textureScale, 1.8)
  assert.equal(tuned.plinth, initial.plinth)
})
