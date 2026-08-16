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
