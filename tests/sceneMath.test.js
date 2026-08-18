import test from 'node:test'
import assert from 'node:assert/strict'
import { cameraLimits, clampPixelRatio, normalizePointer } from '../src/scene/sceneMath.js'

test('normalizes the center of a canvas to zero', () => {
  assert.deepEqual(normalizePointer(150, 100, { left: 50, top: 50, width: 200, height: 100 }), { x: 0, y: 0 })
})

test('normalizes the top left of a canvas to negative and positive one', () => {
  assert.deepEqual(normalizePointer(50, 50, { left: 50, top: 50, width: 200, height: 100 }), { x: -1, y: 1 })
})

test('caps renderer pixel ratio at two', () => {
  assert.equal(clampPixelRatio(3), 2)
  assert.equal(clampPixelRatio(1.5), 1.5)
})

test('camera limits preserve an isometric viewing range', () => {
  assert.ok(cameraLimits.minDistance < cameraLimits.maxDistance)
  assert.ok(cameraLimits.minPolarAngle < cameraLimits.maxPolarAngle)
})

test('opening view observes the expanded campus from the reference front-left direction', async () => {
  const module = await import('../src/scene/sceneMath.js')
  assert.ok(module.initialCameraView, 'initial camera preset is missing')
  const [x, y, z] = module.initialCameraView.position
  const distance = Math.hypot(x, y, z)
  assert.ok(x < 0 && z < 0, `opening camera is reversed: ${module.initialCameraView.position}`)
  assert.ok(distance >= 63, `opening camera does not leave a dashboard-safe perimeter margin: ${distance}`)
  assert.ok(module.cameraLimits.maxDistance > distance, 'orbit controls cannot preserve the opening distance')
  assert.ok(module.initialCameraView.fogDensity <= .014, 'expanded site is obscured by the old close-range fog')
  assert.ok(module.initialCameraView.exposure >= 1.5, 'front-left view needs enough exposure to read road and parking details')
})
