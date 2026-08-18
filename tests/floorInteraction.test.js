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
  assert.deepEqual(floors.map(({ position }) => position.y), [0, 1.25, 2.5])
  assert.equal(exterior.material.transparent, true)
  assert.equal(exterior.material.opacity, .1)
  assert.equal(exterior.material.depthWrite, false)
  assert.deepEqual(floors.map((floor) => floor.children[0].material.opacity), [.86, .86, .86])
  assert.deepEqual(floors.map((floor) => floor.children[1].material.opacity), [.1, .1, .1])
  assert.deepEqual(floors.map((floor) => floor.children[2].material.opacity), [.98, .98, .98])

  module.applyFloorView([building], { buildingId: null, exploded: false })
  module.updateFloorAnimations([building], 1, true)

  assert.deepEqual(floors.map(({ visible }) => visible), [false, false, false])
  assert.deepEqual(floors.map(({ position }) => position.y), [0, 0, 0])
  assert.equal(exterior.material.transparent, false)
  assert.equal(exterior.material.opacity, 1)
  assert.equal(exterior.material.depthWrite, true)
})

test('isolates the focused floor from exterior walls and adjacent floor slabs', async () => {
  const { applyFloorView, updateFloorAnimations } = await import('../src/scene/floorInteraction.js')
  const { building, floors } = makeFloorBuilding()

  applyFloorView([building], {
    buildingId: 'administration',
    exploded: true,
    focusedFloorId: 'L02',
  })
  updateFloorAnimations([building], 1, true)

  assert.equal(floors[1].userData.focused, true)
  assert.equal(building.userData.exteriorMeshes[0].visible, false)
  assert.deepEqual(floors.map((floor) => floor.visible), [false, true, false])
  assert.equal(floors[1].children[1].visible, false)
  assert.equal(floors[1].children[2].material.opacity, .98)
  assert.deepEqual([floors[0].userData.adjacentToFocus, floors[2].userData.adjacentToFocus], [true, true])

  applyFloorView([building], { buildingId: 'administration', exploded: true, focusedFloorId: null })
  assert.equal(building.userData.exteriorMeshes[0].visible, true)
  assert.deepEqual(floors.map((floor) => floor.visible), [true, true, true])
  assert.equal(floors[1].children[1].visible, true)
  assert.deepEqual(floors.map((floor) => floor.children[2].material.opacity), [.98, .98, .98])
})

test('prepares a three-sided cutaway room that appears only for the focused floor', async () => {
  const { prepareBuildingFloors, applyFloorView } = await import('../src/scene/floorInteraction.js')
  const building = new THREE.Group()
  building.userData.buildingId = 'administration'
  const record = {
    id: 'administration',
    size: [5, 3.8, 3.5],
    floors: ['L01', 'L02', 'L03'].map((id, index) => ({ id, name: id, level: index + 1, tone: 'cyan' })),
  }
  for (const [index, floor] of record.floors.entries()) {
    const root = new THREE.Group()
    root.name = `FLOOR__administration__${floor.id}`
    const content = new THREE.Mesh(new THREE.BoxGeometry(1, .4, 1), new THREE.MeshStandardMaterial())
    content.position.y = index * 1.25 + .4
    root.add(content)
    building.add(root)
  }

  prepareBuildingFloors(building, record)
  const middle = building.userData.floorRoots[1]
  assert.equal(Number(middle.userData.contentCenterY.toFixed(3)), 1.65)
  assert.equal(middle.userData.cutaway.children.length, 3)
  assert.equal(middle.userData.cutaway.visible, false)
  assert.deepEqual(middle.userData.cutaway.children.map(({ geometry }) => [
    Number(geometry.parameters.width.toFixed(3)),
    Number(geometry.parameters.height.toFixed(3)),
    Number(geometry.parameters.depth.toFixed(3)),
  ]), [
    [4.1, .912, .06],
    [.06, .912, 2.52],
    [.06, .912, 2.52],
  ])

  applyFloorView([building], { buildingId: 'administration', exploded: true, focusedFloorId: 'L02' })
  assert.equal(middle.userData.cutaway.visible, true)
  assert.deepEqual(middle.userData.cutaway.children.map((wall) => wall.userData.layerRole), [
    'floor-cutaway', 'floor-cutaway', 'floor-cutaway',
  ])

  applyFloorView([building], { buildingId: 'administration', exploded: true, focusedFloorId: null })
  assert.equal(middle.userData.cutaway.visible, false)
})
