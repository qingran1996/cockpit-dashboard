import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'

function createBuilding(id, position) {
  const building = new THREE.Group()
  building.userData.buildingId = id
  building.position.copy(position)
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), new THREE.MeshBasicMaterial())
  building.add(mesh)
  return building
}

test('picks the nearest building proxy without traversing detailed descendants', async () => {
  const { createBuildingPickIndex } = await import('../src/scene/buildingPickIndex.js')
  const near = createBuilding('near', new THREE.Vector3(0, 0, 0))
  const far = createBuilding('far', new THREE.Vector3(0, 0, -10))
  const root = new THREE.Group()
  root.add(near, far)
  root.updateMatrixWorld(true)

  const index = createBuildingPickIndex([far, near])
  const raycaster = new THREE.Raycaster(new THREE.Vector3(0, 0, 10), new THREE.Vector3(0, 0, -1))

  assert.equal(index.pick(raycaster), near)
})

test('refreshes proxy bounds after the loaded building layout changes', async () => {
  const { createBuildingPickIndex } = await import('../src/scene/buildingPickIndex.js')
  const building = createBuilding('movable', new THREE.Vector3(20, 0, 0))
  building.updateMatrixWorld(true)
  const index = createBuildingPickIndex([building])
  const raycaster = new THREE.Raycaster(new THREE.Vector3(0, 0, 10), new THREE.Vector3(0, 0, -1))

  assert.equal(index.pick(raycaster), null)
  building.position.set(0, 0, 0)
  building.updateMatrixWorld(true)
  index.refresh()

  assert.equal(index.pick(raycaster), building)
})
