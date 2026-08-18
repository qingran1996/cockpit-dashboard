import test from 'node:test'
import assert from 'node:assert/strict'

test('creates a close oblique camera pose aimed inside the selected floor', async () => {
  const module = await import('../src/scene/floorCamera.js').catch(() => ({}))
  assert.equal(typeof module.createFloorCameraPose, 'function', 'floor camera pose helper is missing')

  const pose = module.createFloorCameraPose({
    floorWorldPosition: [10, 4, -6],
    buildingSize: [12, 3.6, 6],
  })

  assert.deepEqual(pose.target.map((value) => Number(value.toFixed(3))), [10.36, 4.432, -5.52])
  assert.deepEqual(pose.position.map((value) => Number(value.toFixed(3))), [8.314, 5.44, -9.24])
  assert.equal(pose.duration, 1050)
})

test('keeps small floor inspection views outside the near clipping zone', async () => {
  const { createFloorCameraPose } = await import('../src/scene/floorCamera.js')
  const pose = createFloorCameraPose({ floorWorldPosition: [0, 0, 0], buildingSize: [1, .5, .8] })

  assert.deepEqual(pose.target, [.03, .18, .064])
  assert.deepEqual(pose.position.map((value) => Number(value.toFixed(3))), [-.96, .78, -1.736])
})
