import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'

test('opens the gate around both shuttle crossings and closes it at route ends', async () => {
  const module = await import('../src/scene/gateAnimation.js').catch(() => ({}))
  assert.equal(typeof module.gateOpenAmount, 'function', 'gate open curve is missing')
  assert.equal(typeof module.updateGateAnimations, 'function', 'gate animation updater is missing')

  assert.equal(module.gateOpenAmount(0), 0)
  assert.equal(module.gateOpenAmount(.25), 1)
  assert.equal(module.gateOpenAmount(.5), 0)
  assert.equal(module.gateOpenAmount(.75), 1)

  const barrier = new THREE.Group()
  const item = {
    kind: 'gate', object: barrier, axis: 'z', speed: .1,
    closedAngle: 0, openAngle: -1.22, baseRotationZ: 0,
  }
  module.updateGateAnimations([item], 2.5, false)
  assert.equal(Math.round(barrier.rotation.z * 100) / 100, -1.22)
  module.updateGateAnimations([item], 5, false)
  assert.equal(barrier.rotation.z, 0)
  module.updateGateAnimations([item], 2.5, true)
  assert.equal(barrier.rotation.z, 0)
})
