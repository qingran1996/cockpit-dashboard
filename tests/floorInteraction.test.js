import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'

function makeFloorBuilding() {
  const building = new THREE.Group()
  building.userData.buildingId = 'administration'
  const exterior = new THREE.Mesh(
    new THREE.BoxGeometry(4, 3, 3),
    new THREE.MeshStandardMaterial({ opacity: 1, transparent: false }),
  )
  exterior.userData.layerRole = 'exterior'
  building.add(exterior)

  const floors = ['L01', 'L02', 'L03'].map((floorId, index) => {
    const floor = new THREE.Group()
    floor.name = `FLOOR__administration__${floorId}`
    floor.userData = { buildingId: 'administration', floorId, level: index + 1, baseY: 0 }
    floor.visible = false
    floor.add(new THREE.Mesh(
      new THREE.BoxGeometry(3.4, .12, 2.4),
      new THREE.MeshStandardMaterial({ opacity: .62, transparent: true, depthWrite: true }),
    ))
    const volume = new THREE.Mesh(
      new THREE.BoxGeometry(3.1, .7, 2.1),
      new THREE.MeshStandardMaterial({ opacity: .38, transparent: true, depthWrite: false }),
    )
    volume.userData.layerRole = 'floor-volume'
    floor.add(volume)
    const interior = new THREE.Mesh(
      new THREE.BoxGeometry(.4, .3, .4),
      new THREE.MeshStandardMaterial({ opacity: 1, transparent: false, depthWrite: true }),
    )
    interior.userData.layerRole = 'interior-prop'
    floor.add(interior)
    building.add(floor)
    return floor
  })
  building.userData.floorRoots = floors
  building.userData.exteriorMeshes = [exterior]
  return { building, exterior, floors }
}

test('explodes every floor as one synchronized building section and restores it', async () => {
  const module = await import('../src/scene/floorInteraction.js').catch(() => ({}))
  assert.equal(typeof module.applyFloorView, 'function', 'floor presentation module is missing')
  assert.equal(typeof module.updateFloorAnimations, 'function', 'floor animation updater is missing')
  const { building, exterior, floors } = makeFloorBuilding()

  module.applyFloorView([building], { buildingId: 'administration', exploded: true })
  module.updateFloorAnimations([building], 1, true)

  assert.deepEqual(floors.map(({ visible }) => visible), [true, true, true])
  assert.deepEqual(floors.map(({ position }) => position.y), [0, .95, 1.9])
  assert.equal(exterior.material.transparent, true)
  assert.equal(exterior.material.opacity, .1)
  assert.equal(exterior.material.depthWrite, false)
  assert.deepEqual(floors.map((floor) => floor.children[0].material.opacity), [.86, .86, .86])
  assert.deepEqual(floors.map((floor) => floor.children[1].material.opacity), [.18, .18, .18])
  assert.deepEqual(floors.map((floor) => floor.children[2].material.opacity), [.98, .98, .98])

  module.applyFloorView([building], { buildingId: null, exploded: false })
  module.updateFloorAnimations([building], 1, true)

  assert.deepEqual(floors.map(({ visible }) => visible), [false, false, false])
  assert.deepEqual(floors.map(({ position }) => position.y), [0, 0, 0])
  assert.equal(exterior.material.transparent, false)
  assert.equal(exterior.material.opacity, 1)
  assert.equal(exterior.material.depthWrite, true)
})
