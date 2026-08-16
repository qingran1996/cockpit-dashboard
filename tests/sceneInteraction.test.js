import test from 'node:test'
import assert from 'node:assert/strict'
import * as sceneMath from '../src/scene/sceneMath.js'
import { campusSite } from '../src/scene/factoryCampusFactory.js'
import { factoryCampusRegistry } from '../src/scene/factoryCampusRegistry.js'

test('building focus view moves near the selected building and aims at its centre', () => {
  assert.equal(typeof sceneMath.getBuildingFocusView, 'function')
  if (typeof sceneMath.getBuildingFocusView !== 'function') return

  const view = sceneMath.getBuildingFocusView({
    position: [10, 0, -4],
    size: [8, 4, 6],
  })
  assert.deepEqual(view.target, [10, .6, -4])
  const distance = Math.hypot(
    view.position[0] - view.target[0],
    view.position[1] - view.target[1],
    view.position[2] - view.target[2],
  )
  assert.ok(distance >= 10 && distance <= 18)
  assert.ok(view.position[1] > view.target[1])
  assert.ok(view.position[2] > view.target[2])
})

test('first person forward movement follows yaw in the horizontal plane', () => {
  assert.equal(typeof sceneMath.moveFirstPerson, 'function')
  if (typeof sceneMath.moveFirstPerson !== 'function') return

  const next = sceneMath.moveFirstPerson(
    [0, .45, 10],
    0,
    { forward: 1, strafe: 0 },
    2,
    [],
    { width: 70, depth: 54 },
  )
  assert.deepEqual(next, [0, .45, 8])
})

test('first person movement stays inside the fence and outside buildings', () => {
  assert.equal(typeof sceneMath.moveFirstPerson, 'function')
  if (typeof sceneMath.moveFirstPerson !== 'function') return

  const bounded = sceneMath.moveFirstPerson(
    [33.8, .45, 0],
    0,
    { forward: 0, strafe: 1 },
    3,
    [],
    { width: 70, depth: 54 },
  )
  assert.deepEqual(bounded, [34, .45, 0])

  const blocked = sceneMath.moveFirstPerson(
    [0, .45, 3],
    0,
    { forward: 1, strafe: 0 },
    2,
    [{ position: [0, 0, 0], size: [4, 3, 4] }],
    { width: 70, depth: 54 },
  )
  assert.deepEqual(blocked, [0, .45, 3])

  assert.equal(
    sceneMath.isFirstPersonPositionClear(
      [3, .45, 0],
      [{ position: [0, 0, 0], size: [4, 3, 4] }],
      { width: 70, depth: 54 },
    ),
    false,
    'camera keeps a comfortable body radius away from walls',
  )
})

test('first person spawn is a clear point just inside the main entrance', () => {
  assert.equal(typeof sceneMath.isFirstPersonPositionClear, 'function')
  assert.ok(sceneMath.factoryCampusFirstPersonSpawn)
  if (typeof sceneMath.isFirstPersonPositionClear !== 'function') return

  assert.deepEqual(sceneMath.factoryCampusFirstPersonSpawn.position, [-10.5, .45, 23.8])
  assert.equal(
    sceneMath.isFirstPersonPositionClear(
      sceneMath.factoryCampusFirstPersonSpawn.position,
      factoryCampusRegistry,
      campusSite,
    ),
    true,
  )
})

test('first person look target follows yaw and pitch', () => {
  assert.equal(typeof sceneMath.getFirstPersonLookTarget, 'function')
  if (typeof sceneMath.getFirstPersonLookTarget !== 'function') return

  assert.deepEqual(sceneMath.getFirstPersonLookTarget([1, 2, 3], 0, 0), [1, 2, 2])
  const right = sceneMath.getFirstPersonLookTarget([1, 2, 3], Math.PI / 2, 0)
  assert.ok(Math.abs(right[0] - 2) < 1e-9)
  assert.ok(Math.abs(right[1] - 2) < 1e-9)
  assert.ok(Math.abs(right[2] - 3) < 1e-9)
})

test('first person pointer look follows natural mouse direction', () => {
  assert.equal(typeof sceneMath.updateFirstPersonLook, 'function')
  if (typeof sceneMath.updateFirstPersonLook !== 'function') return

  const right = sceneMath.updateFirstPersonLook(0, 0, 100, 0)
  assert.ok(right.yaw > 0, 'moving the mouse right turns the person right')
  const up = sceneMath.updateFirstPersonLook(0, 0, 0, -100)
  assert.ok(up.pitch > 0, 'moving the mouse up makes the person look up')
  const clamped = sceneMath.updateFirstPersonLook(0, 0, 0, -100000)
  assert.equal(clamped.pitch, 1.05)
})

test('walking pose adds human head and arm motion only while moving', () => {
  assert.equal(typeof sceneMath.getFirstPersonWalkPose, 'function')
  if (typeof sceneMath.getFirstPersonWalkPose !== 'function') return

  assert.deepEqual(sceneMath.getFirstPersonWalkPose(1, false, false), {
    headBob: 0,
    bodySway: 0,
    armSwing: 0,
  })
  const walking = sceneMath.getFirstPersonWalkPose(.2, true, false)
  assert.ok(walking.headBob > 0 && walking.headBob <= .06)
  assert.ok(Math.abs(walking.bodySway) <= .025)
  assert.ok(Math.abs(walking.armSwing) > .1 && Math.abs(walking.armSwing) <= .36)
  const running = sceneMath.getFirstPersonWalkPose(.2, true, true)
  assert.ok(running.headBob > walking.headBob)
})
