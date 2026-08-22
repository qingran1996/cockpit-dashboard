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

test('moves route vehicles nose-first through blended corners and parks them when traffic pauses', async () => {
  const module = await import('../src/scene/vehicleAnimation.js').catch(() => ({}))
  assert.equal(typeof module.updateVehicleAnimations, 'function', 'vehicle animation updater is missing')
  const object = new THREE.Group()
  const item = {
    kind: 'route-vehicle',
    object,
    route: {
      loopMode: 'loop',
      dwellFraction: 0,
      points: [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(4, 0, 0),
        new THREE.Vector3(4, 0, 4),
      ],
    },
    speed: .1,
    phase: 0,
    basePosition: new THREE.Vector3(0, 0, 0),
    baseRotationY: .25,
  }

  module.updateVehicleAnimations([item], 5, false, true)
  assert.deepEqual(object.position.toArray().map((value) => Math.round(value * 100) / 100), [4, 0, 0])
  const worldForward = new THREE.Vector3(-1, 0, 0).applyQuaternion(object.quaternion)
  assert.deepEqual(worldForward.toArray().map((value) => Math.round(value * 100) / 100), [.71, 0, .71])

  module.updateVehicleAnimations([item], 7, false, false)
  assert.deepEqual(object.position.toArray(), [0, 0, 0])
  assert.equal(object.rotation.y, .25)

  module.updateVehicleAnimations([item], 7, true, true)
  assert.deepEqual(object.position.toArray(), [0, 0, 0])
  assert.equal(object.rotation.y, .25)
})

test('moves a yard forklift along its declared axis and parks it when traffic pauses', async () => {
  const { updateVehicleAnimations } = await import('../src/scene/vehicleAnimation.js')
  const forklift = new THREE.Group()
  forklift.position.set(2, .1, 3)
  const item = {
    kind: 'vehicle',
    object: forklift,
    motionPath: 'yard-shuttle',
    axis: 'x',
    baseX: 2,
    baseZ: 3,
    baseRotationY: 0,
    distance: 4,
    speed: .1,
    phase: 0,
  }

  updateVehicleAnimations([item], 2.1, false, true)
  assert.equal(Math.round(forklift.position.x * 100) / 100, 3.4)
  assert.equal(forklift.position.z, 3)

  updateVehicleAnimations([item], 7.5, false, true)
  assert.equal(Math.round(forklift.position.x * 100) / 100, 3.4)
  assert.equal(Math.round(forklift.rotation.y * 100) / 100, 3.14)

  updateVehicleAnimations([item], 5, false, false)
  assert.equal(forklift.position.x, 2)
  assert.equal(forklift.position.z, 3)
  assert.equal(forklift.rotation.y, 0)
})
