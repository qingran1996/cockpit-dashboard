import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { buildingRegistry } from '../src/scene/buildingRegistry.js'
import { prepareFactoryCampusModel } from '../src/scene/factoryCampusAsset.js'

function makeCampus({ omitId = null } = {}) {
  const root = new THREE.Group()
  root.name = 'FactoryCampusGraybox'
  const sharedMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc })
  for (const record of buildingRegistry) {
    if (record.id === omitId) continue
    const building = new THREE.Group()
    building.name = record.nodeName
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      sharedMaterial,
    )
    building.add(mesh)
    for (const floor of record.floors) {
      const floorRoot = new THREE.Group()
      floorRoot.name = `FLOOR__${record.id}__${floor.id}`
      floorRoot.userData = { ...floor, buildingId: record.id, floorId: floor.id }
      floorRoot.add(new THREE.Mesh(new THREE.BoxGeometry(.8, .2, .8), sharedMaterial))
      building.add(floorRoot)
    }
    root.add(building)
  }
  const shuttle = new THREE.Group()
  shuttle.name = 'VEHICLE__gate-shuttle__root'
  shuttle.userData = { motionPath: 'gate-lane', motionDistance: 10, motionSpeed: .09 }
  root.add(shuttle)
  return root
}

test('maps every required GLB building node to one interactive building id', () => {
  const campus = makeCampus()
  const prepared = prepareFactoryCampusModel(campus)

  assert.equal(prepared.root, campus)
  assert.deepEqual(
    prepared.interactiveObjects.map(({ userData }) => userData.buildingId),
    buildingRegistry.map(({ id }) => id),
  )
  assert.equal(new Set(prepared.interactiveObjects).size, buildingRegistry.length)
  assert.equal(prepared.animatedObjects?.length, 1)
  assert.equal(prepared.animatedObjects?.[0].kind, 'vehicle')
  assert.equal(prepared.animatedObjects?.[0].object, campus.getObjectByName('VEHICLE__gate-shuttle__root'))
  assert.equal(prepared.animatedObjects?.[0].motionPath, 'gate-lane')
  assert.equal(prepared.animatedObjects?.[0].distance, 10)
  assert.equal(prepared.animatedObjects?.[0].speed, .09)
  const preparedMaterials = prepared.interactiveObjects.map((building) => building.children[0].material)
  assert.equal(new Set(preparedMaterials).size, buildingRegistry.length)
  for (const building of prepared.interactiveObjects) {
    assert.equal(building.userData.interactive, true)
    const record = buildingRegistry.find(({ id }) => id === building.userData.buildingId)
    assert.deepEqual(
      building.userData.floorRoots.map(({ userData }) => userData.floorId),
      record.floors.map(({ id }) => id),
    )
    assert.ok(building.userData.floorRoots.every(({ visible }) => visible === false))
    assert.equal(building.userData.exteriorMeshes.length, 1)
    building.traverse((object) => {
      if (!object.isMesh) return
      assert.equal(object.castShadow, true)
      assert.equal(object.receiveShadow, true)
    })
  }
})

test('rejects a GLB that omits a required building node', () => {
  const missing = buildingRegistry[0]
  const campus = makeCampus({ omitId: missing.id })

  assert.throws(
    () => prepareFactoryCampusModel(campus),
    new RegExp(`missing required building node: ${missing.nodeName}`),
  )
})
