import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cameraLimits,
  clampPixelRatio,
  factoryCampusInitialView,
  normalizePointer,
} from '../src/scene/sceneMath.js'

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

test('factory campus opens from an elevated reference-like overview', () => {
  assert.deepEqual(factoryCampusInitialView.position, [23, 21, 27])
  assert.deepEqual(factoryCampusInitialView.target, [0, .6, -.5])
  assert.equal(factoryCampusInitialView.fov, 36)
})
