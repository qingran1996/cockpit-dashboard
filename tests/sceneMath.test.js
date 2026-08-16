import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {
  cameraLimits,
  clampPixelRatio,
  factoryCampusFogDensity,
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
  assert.ok(cameraLimits.farPlane >= 180)
})

test('expanded overview remains readable through the scene fog', () => {
  const distance = Math.hypot(
    factoryCampusInitialView.position[0] - factoryCampusInitialView.target[0],
    factoryCampusInitialView.position[1] - factoryCampusInitialView.target[1],
    factoryCampusInitialView.position[2] - factoryCampusInitialView.target[2],
  )
  const transmittance = Math.exp(-(factoryCampusFogDensity ** 2) * (distance ** 2))
  assert.ok(factoryCampusFogDensity <= .013)
  assert.ok(transmittance >= .28)
})

test('factory campus opens from an elevated reference-like overview', () => {
  assert.deepEqual(factoryCampusInitialView.position, [28, 56, 85])
  assert.deepEqual(factoryCampusInitialView.target, [0, .6, 12])
  assert.equal(factoryCampusInitialView.fov, 39)
  assert.ok(cameraLimits.maxDistance >= 100)

  const sideToFrontRatio = factoryCampusInitialView.position[0]
    / factoryCampusInitialView.position[2]
  assert.ok(sideToFrontRatio >= .3 && sideToFrontRatio <= .36)
})

test('expanded campus and external transport footprint fit inside the opening overview', () => {
  const camera = new THREE.PerspectiveCamera(factoryCampusInitialView.fov, 16 / 9, .1, 200)
  camera.position.set(...factoryCampusInitialView.position)
  camera.lookAt(...factoryCampusInitialView.target)
  camera.updateMatrixWorld()
  camera.updateProjectionMatrix()

  for (const [x, z] of [[-43, -35], [43, -35], [-43, 35], [43, 35]]) {
    const projected = new THREE.Vector3(x, 0, z).project(camera)
    assert.ok(Math.abs(projected.x) <= 1.05, `site corner ${x},${z} is clipped horizontally`)
    assert.ok(Math.abs(projected.y) <= 1.05, `site corner ${x},${z} is clipped vertically`)
  }
})
