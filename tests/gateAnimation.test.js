import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'

test('uses the shared traffic cycle to open only after recognition and close after clearance', async () => {
  const module = await import('../src/scene/gateAnimation.js').catch(() => ({}))
  assert.equal(typeof module.gateOpenAmount, 'function', 'gate open curve is missing')
  assert.equal(typeof module.updateGateAnimations, 'function', 'gate animation updater is missing')

  assert.equal(module.gateOpenAmount(0), 0)
  assert.ok(module.gateOpenAmount(.25) > .75)
  assert.equal(module.gateOpenAmount(.5), 0)
  assert.ok(module.gateOpenAmount(.75) > .75)

  const barrier = new THREE.Group()
  const item = {
    kind: 'gate', object: barrier, axis: 'z', speed: .1,
    closedAngle: 0, openAngle: 1.22, baseRotationZ: 0,
  }
  module.updateGateAnimations([item], 2.7, false)
  assert.equal(Math.round(barrier.rotation.z * 100) / 100, 1.22)
  const raisedTip = new THREE.Vector3(1.21, 0, 0).applyEuler(barrier.rotation)
  assert.ok(raisedTip.y > 1, `barrier tip must lift upward, received y=${raisedTip.y}`)
  module.updateGateAnimations([item], 5, false)
  assert.equal(barrier.rotation.z, 0)
  module.updateGateAnimations([item], 2.5, true)
  assert.equal(barrier.rotation.z, 0)
})
