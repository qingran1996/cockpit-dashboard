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
  const [, targetY, targetZ] = module.initialCameraView.target
  const horizontalDistance = Math.hypot(x, z - targetZ)
  assert.ok(x < 0 && z < 0, `opening camera is reversed: ${module.initialCameraView.position}`)
  assert.ok(distance >= 76 && distance <= 84, `opening camera should present a closer hero composition: ${distance}`)
  assert.ok((y - targetY) / horizontalDistance <= .40, `opening camera remains too top-down: ${module.initialCameraView.position}`)
  assert.ok(module.cameraLimits.maxDistance > distance, 'orbit controls cannot preserve the opening distance')
  assert.ok(module.initialCameraView.fogDensity <= .006, 'expanded site is obscured by the old close-range fog')
  assert.ok(module.initialCameraView.exposure >= 1.82, 'front-left view needs enough exposure to read rear walls and parking details')
})

test('focus view moves closer and aims lower so the campus fills the tall viewport', async () => {
  const module = await import('../src/scene/sceneMath.js')
  assert.ok(module.focusCameraView, 'focus camera preset is missing')
  const openingDistance = Math.hypot(...module.initialCameraView.position)
  const focusDistance = Math.hypot(...module.focusCameraView.position)
  assert.ok(focusDistance < openingDistance, `focus camera did not move closer: ${focusDistance}`)
  assert.ok(focusDistance >= 70 && focusDistance <= 78)
  assert.ok(module.focusCameraView.target[1] < module.initialCameraView.target[1], 'focus camera must aim lower into the site apron')
})
