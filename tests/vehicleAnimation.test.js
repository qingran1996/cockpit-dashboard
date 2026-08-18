import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'

test('holds the gate shuttle at recognition and reverses it on the return journey', async () => {
  const module = await import('../src/scene/vehicleAnimation.js').catch(() => ({}))
  assert.equal(typeof module.updateVehicleAnimations, 'function', 'vehicle animation updater is missing')
  const vehicle = new THREE.Group()
  vehicle.position.z = -20
  const item = { kind: 'vehicle', object: vehicle, baseZ: -20, distance: 10, speed: .1 }

  module.updateVehicleAnimations([item], 2.1, false)
  assert.equal(Math.round(vehicle.position.z * 100) / 100, -16.5)
  assert.equal(Math.round(vehicle.rotation.y * 100) / 100, 0)

  module.updateVehicleAnimations([item], 7.5, false)
  assert.equal(Math.round(vehicle.position.z * 100) / 100, -16.5)
  assert.equal(Math.round(vehicle.rotation.y * 100) / 100, 3.14)

  module.updateVehicleAnimations([item], 2.1, true)
  assert.equal(vehicle.position.z, -20)
  assert.equal(vehicle.rotation.y, 0)
})
