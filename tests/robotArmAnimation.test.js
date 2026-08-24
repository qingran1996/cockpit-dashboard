import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'

function makeRobotItem() {
  const object = new THREE.Group()
  const turntable = new THREE.Group()
  const shoulder = new THREE.Group()
  const elbow = new THREE.Group()
  const wrist = new THREE.Group()
  const gripperLeft = new THREE.Group()
  const gripperRight = new THREE.Group()
  const payload = new THREE.Group()
  gripperLeft.position.x = -.07
  gripperRight.position.x = .07
  payload.position.y = .2
  return {
    kind: 'robot-arm', object, speed: .25, phase: 0,
    joints: { turntable, shoulder, elbow, wrist, gripperLeft, gripperRight, payload },
    basePose: {
      turntableY: .1, shoulderZ: .2, elbowZ: -.1, wristZ: .05,
      gripperLeftX: -.07, gripperRightX: .07, payloadY: .2,
    },
  }
}

test('articulates a robot through a visible pick-and-lift pose', async () => {
  const module = await import('../src/scene/robotArmAnimation.js').catch(() => ({}))
  assert.equal(typeof module.updateRobotArmAnimations, 'function', 'robot arm updater is missing')
  const item = makeRobotItem()

  module.updateRobotArmAnimations([item], 1, false)

  assert.equal(Math.round(item.joints.turntable.rotation.y * 100) / 100, .55)
  assert.equal(Math.round(item.joints.shoulder.rotation.z * 100) / 100, -.15)
  assert.equal(Math.round(item.joints.elbow.rotation.z * 100) / 100, .45)
  assert.equal(Math.round(item.joints.wrist.rotation.z * 100) / 100, -.2)
  assert.equal(Math.round(item.joints.gripperLeft.position.x * 1000) / 1000, -.045)
  assert.equal(Math.round(item.joints.gripperRight.position.x * 1000) / 1000, .045)
  assert.equal(Math.round(item.joints.payload.position.y * 100) / 100, .42)
})

test('restores every robot joint to its authored pose for reduced motion', async () => {
  const { updateRobotArmAnimations } = await import('../src/scene/robotArmAnimation.js')
  const item = makeRobotItem()
  item.joints.turntable.rotation.y = 2
  item.joints.shoulder.rotation.z = 2
  item.joints.elbow.rotation.z = 2
  item.joints.wrist.rotation.z = 2
  item.joints.gripperLeft.position.x = 2
  item.joints.gripperRight.position.x = 2
  item.joints.payload.position.y = 2

  updateRobotArmAnimations([item], 4, true)

  assert.equal(item.joints.turntable.rotation.y, .1)
  assert.equal(item.joints.shoulder.rotation.z, .2)
  assert.equal(item.joints.elbow.rotation.z, -.1)
  assert.equal(item.joints.wrist.rotation.z, .05)
  assert.equal(item.joints.gripperLeft.position.x, -.07)
  assert.equal(item.joints.gripperRight.position.x, .07)
  assert.equal(item.joints.payload.position.y, .2)
})
