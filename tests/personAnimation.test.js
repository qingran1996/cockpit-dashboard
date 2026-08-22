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

test('moves a site patrol along a Z-axis route and restores its base pose', async () => {
  const { updatePersonAnimations } = await import('../src/scene/personAnimation.js')
  const person = new THREE.Group()
  person.position.set(2, .15, -3)
  const item = {
    kind: 'person', object: person, axis: 'z', baseX: 2, baseY: .15, baseZ: -3,
    baseRotationY: 0, distance: 6, speed: .1, phase: 0,
  }

  updatePersonAnimations([item], 2.5, false)
  assert.equal(person.position.x, 2)
  assert.equal(person.position.z, 0)
  assert.equal(Math.round(person.rotation.y * 100) / 100, 0)

  updatePersonAnimations([item], 7.5, false)
  assert.equal(person.position.z, 0)
  assert.equal(Math.round(person.rotation.y * 100) / 100, 3.14)

  updatePersonAnimations([item], 7.5, true)
  assert.equal(person.position.z, -3)
  assert.equal(person.rotation.y, 0)
})

test('holds a task-route operator still while inspecting equipment', async () => {
  const { updatePersonAnimations } = await import('../src/scene/personAnimation.js')
  const person = new THREE.Group()
  person.position.set(1, .2, 0)
  const leftLeg = new THREE.Group()
  const rightLeg = new THREE.Group()
  const item = {
    kind: 'person', object: person, motionPath: 'task-route', axis: 'x',
    baseX: 1, baseY: .2, baseZ: 0, baseRotationY: 0,
    distance: 3, speed: .1, phase: 0, dwellFraction: .15, leftLeg, rightLeg,
  }

  updatePersonAnimations([item], 3.5, false)
  assert.equal(person.position.x, 4)
  assert.equal(person.position.y, .2)
  assert.equal(leftLeg.rotation.x, 0)
  assert.equal(rightLeg.rotation.x, 0)
  assert.equal(item.taskPhase, 'inspecting')

  updatePersonAnimations([item], 5.5, false)
  assert.ok(person.position.x < 4)
  assert.equal(item.taskPhase, 'returning')
})
