import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'

test('creates a close oblique camera pose aimed inside the selected floor', async () => {
  const module = await import('../src/scene/floorCamera.js').catch(() => ({}))
  assert.equal(typeof module.createFloorCameraPose, 'function', 'floor camera pose helper is missing')

  const pose = module.createFloorCameraPose({
    floorWorldPosition: [10, 4, -6],
    buildingSize: [12, 3.6, 6],
  })

  assert.deepEqual(pose.target.map((value) => Number(value.toFixed(3))), [10.36, 4.432, -5.52])
  assert.deepEqual(pose.position.map((value) => Number(value.toFixed(3))), [7.39, 5.728, -10.92])
  assert.equal(pose.duration, 1050)
})

test('keeps small floor inspection views outside the near clipping zone', async () => {
  const { createFloorCameraPose } = await import('../src/scene/floorCamera.js')
  const pose = createFloorCameraPose({ floorWorldPosition: [0, 0, 0], buildingSize: [1, .5, .8] })

  assert.deepEqual(pose.target, [.03, .18, .064])
  assert.deepEqual(pose.position.map((value) => Number(value.toFixed(3))), [-.96, .98, -1.736])
})

test('pulls farther back for a wide production hall without changing its target bias', async () => {
  const { createFloorCameraPose } = await import('../src/scene/floorCamera.js')
  const pose = createFloorCameraPose({ floorWorldPosition: [0, 0, 0], buildingSize: [15, 3.4, 6.2] })

  assert.deepEqual(pose.target.map((value) => Number(value.toFixed(3))), [.45, .408, .496])
  assert.deepEqual(pose.position.map((value) => Number(value.toFixed(3))), [-3.263, 1.632, -6.254])
})

test('anchors the inspection camera to floor content instead of the floor root origin', async () => {
  const module = await import('../src/scene/floorCamera.js')
  assert.equal(typeof module.getFloorInspectionAnchor, 'function', 'floor content anchor helper is missing')
  const building = new THREE.Group()
  building.position.set(9.5, 0, -11.3)
  const floor = new THREE.Group()
  floor.position.y = 1.25
  floor.userData.contentCenterY = 1.267
  building.add(floor)

  assert.deepEqual(module.getFloorInspectionAnchor(floor).map((value) => Number(value.toFixed(3))), [9.5, 2.517, -11.3])
})
