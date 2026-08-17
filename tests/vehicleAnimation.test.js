import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'

test('moves the gate shuttle through the full lane and reverses its heading', async () => {
  const module = await import('../src/scene/vehicleAnimation.js').catch(() => ({}))
  assert.equal(typeof module.updateVehicleAnimations, 'function', 'vehicle animation updater is missing')
  const vehicle = new THREE.Group()
  vehicle.position.z = -20
  const item = { kind: 'vehicle', object: vehicle, baseZ: -20, distance: 10, speed: .1 }

  module.updateVehicleAnimations([item], 2.5, false)
  assert.equal(Math.round(vehicle.position.z * 100) / 100, -15)
  assert.equal(Math.round(vehicle.rotation.y * 100) / 100, 0)

  module.updateVehicleAnimations([item], 7.5, false)
  assert.equal(Math.round(vehicle.position.z * 100) / 100, -15)
  assert.equal(Math.round(vehicle.rotation.y * 100) / 100, 3.14)
})
