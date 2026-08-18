import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'

test('walks a floor-local person with heading reversal and a two-leg gait', async () => {
  const module = await import('../src/scene/personAnimation.js').catch(() => ({}))
  assert.equal(typeof module.updatePersonAnimations, 'function', 'person animation updater is missing')

  const person = new THREE.Group()
  person.position.set(1, .2, 0)
  const leftLeg = new THREE.Group()
  const rightLeg = new THREE.Group()
  const item = {
    kind: 'person',
    object: person,
    baseX: 1,
    baseY: .2,
    baseRotationY: 0,
    distance: 4,
    speed: .1,
    phase: 0,
    leftLeg,
    rightLeg,
  }

  module.updatePersonAnimations([item], 1.25, false)
  assert.equal(Math.round(person.position.x * 100) / 100, 2)
  assert.equal(Math.round(person.position.y * 1000) / 1000, .225)
  assert.equal(Math.round(person.rotation.y * 100) / 100, 1.57)
  assert.equal(Math.round(leftLeg.rotation.x * 100) / 100, .45)
  assert.equal(Math.round(rightLeg.rotation.x * 100) / 100, -.45)

  module.updatePersonAnimations([item], 6.25, false)
  assert.equal(Math.round(person.position.x * 100) / 100, 4)
  assert.equal(Math.round(person.rotation.y * 100) / 100, -1.57)

  module.updatePersonAnimations([item], 6.25, true)
  assert.equal(person.position.x, 1)
  assert.equal(person.position.y, .2)
  assert.equal(person.rotation.y, 0)
  assert.equal(leftLeg.rotation.x, 0)
  assert.equal(rightLeg.rotation.x, 0)
})
