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
  const patrol = new THREE.Group()
  patrol.name = 'PATROL__campus-01'
  patrol.position.set(3, .1, -4)
  patrol.userData = { motionPath: 'site-patrol', motionAxis: 'z', motionDistance: 6, motionSpeed: .08, motionPhase: .2 }
  root.add(patrol)
  const barrier = new THREE.Group()
  barrier.name = 'GATE__barrier-inbound'
  barrier.userData = { motionPath: 'gate-barrier', motionAxis: 'z', motionSpeed: .09, closedAngle: 0, openAngle: -1.22 }
  root.add(barrier)
  const firstFloor = root.getObjectByName('FLOOR__main-production-hall__L01')
  const walker = new THREE.Group()
  walker.name = 'WALKER__main-production-hall__L01__01'
  walker.position.set(-2, .1, 0)
  walker.userData = { motionPath: 'floor-walk', motionDistance: 4, motionSpeed: .12, motionPhase: .25 }
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(.08, .24, .08), sharedMaterial)
  leftLeg.name = `${walker.name}__leg-left`
  const rightLeg = leftLeg.clone()
  rightLeg.name = `${walker.name}__leg-right`
  walker.add(leftLeg, rightLeg)
  if (firstFloor) firstFloor.add(walker)
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
  assert.equal(prepared.animatedObjects?.length, 4)
  const vehicle = prepared.animatedObjects.find(({ object }) => object.name === 'VEHICLE__gate-shuttle__root')
  assert.equal(vehicle.kind, 'vehicle')
  assert.equal(vehicle.motionPath, 'gate-lane')
  assert.equal(vehicle.distance, 10)
  assert.equal(vehicle.speed, .09)
  const person = prepared.animatedObjects.find(({ object }) => object.name === 'WALKER__main-production-hall__L01__01')
  assert.equal(person.kind, 'person')
  assert.equal(person.distance, 4)
  assert.equal(person.speed, .12)
  assert.equal(person.phase, .25)
  assert.equal(person.baseX, -2)
  assert.equal(person.baseY, .1)
  assert.equal(person.leftLeg?.name.endsWith('__leg-left'), true)
  assert.equal(person.rightLeg?.name.endsWith('__leg-right'), true)
  const patrol = prepared.animatedObjects.find(({ object }) => object.name === 'PATROL__campus-01')
  assert.equal(patrol.kind, 'person')
  assert.equal(patrol.axis, 'z')
  assert.equal(patrol.baseZ, -4)
  const gate = prepared.animatedObjects.find(({ object }) => object.name === 'GATE__barrier-inbound')
  assert.equal(gate.kind, 'gate')
  assert.equal(gate.axis, 'z')
  assert.equal(gate.speed, .09)
  assert.equal(gate.closedAngle, 0)
  assert.equal(gate.openAngle, -1.22)
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
