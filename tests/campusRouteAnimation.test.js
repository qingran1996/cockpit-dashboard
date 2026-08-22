import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'

test('samples loop and ping-pong traffic phases with destination dwell', async () => {
  const module = await import('../src/scene/campusRouteAnimation.js').catch(() => ({}))
  assert.equal(typeof module.sampleRouteCycle, 'function', 'route cycle sampler is missing')

  assert.deepEqual(module.sampleRouteCycle(0, .1, 0, 'ping-pong', .1), {
    progress: 0,
    returning: false,
    waiting: false,
  })
  assert.deepEqual(module.sampleRouteCycle(4.5, .1, 0, 'ping-pong', .1), {
    progress: 1,
    returning: false,
    waiting: true,
  })
  assert.equal(module.sampleRouteCycle(7.5, .1, 0, 'ping-pong', .1).returning, true)
  assert.equal(module.sampleRouteCycle(5, .1, 0, 'loop', 0).progress, .5)
  assert.equal(module.sampleRouteCycle(-5, .1, 0, 'loop', 0).progress, .5)
})

test('samples a polyline by physical distance and skips zero-length segments', async () => {
  const module = await import('../src/scene/campusRouteAnimation.js').catch(() => ({}))
  assert.equal(typeof module.samplePolyline, 'function', 'polyline sampler is missing')

  const sample = module.samplePolyline([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(10, 0, 0),
    new THREE.Vector3(10, 0, 5),
  ], 2 / 3)
  assert.deepEqual(sample.position.toArray(), [10, 0, 0])
  assert.deepEqual(sample.tangent.toArray(), [1, 0, 0])

  const duplicate = module.samplePolyline([
    new THREE.Vector3(2, 0, 1),
    new THREE.Vector3(2, 0, 1),
    new THREE.Vector3(2, 0, 5),
  ], .5)
  assert.deepEqual(duplicate.position.toArray(), [2, 0, 3])
  assert.deepEqual(duplicate.tangent.toArray(), [0, 0, 1])
  assert.throws(() => module.samplePolyline([new THREE.Vector3()], .5), /route requires at least two points/)
})

test('blends vehicle heading through a corner without moving it off the polyline', async () => {
  const module = await import('../src/scene/campusRouteAnimation.js').catch(() => ({}))
  assert.equal(typeof module.samplePolylineHeading, 'function', 'corner heading sampler is missing')
  const points = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(4, 0, 0),
    new THREE.Vector3(4, 0, 4),
  ]

  const heading = module.samplePolylineHeading(points, .5, 1.2)
  assert.deepEqual(heading.toArray().map((value) => Math.round(value * 100) / 100), [.71, 0, .71])
  assert.deepEqual(module.samplePolyline(points, .4375).position.toArray(), [3.5, 0, 0])
  assert.deepEqual(module.samplePolyline(points, .5).position.toArray(), [4, 0, 0])
  assert.deepEqual(module.samplePolyline(points, .5625).position.toArray(), [4, 0, .5])
})

test('samples purposeful task routes with inspection and reporting holds', async () => {
  const module = await import('../src/scene/campusRouteAnimation.js').catch(() => ({}))
  assert.equal(typeof module.sampleTaskRouteCycle, 'function', 'task route sampler is missing')

  assert.deepEqual(module.sampleTaskRouteCycle(0, .1, 0, .15), {
    progress: 0, returning: false, waiting: false, taskPhase: 'walking-to-task',
  })
  assert.deepEqual(module.sampleTaskRouteCycle(3.5, .1, 0, .15), {
    progress: 1, returning: false, waiting: true, taskPhase: 'inspecting',
  })
  assert.deepEqual(module.sampleTaskRouteCycle(5, .1, 0, .15), {
    progress: 1, returning: true, waiting: false, taskPhase: 'returning',
  })
  assert.deepEqual(module.sampleTaskRouteCycle(8.5, .1, 0, .15), {
    progress: 0, returning: true, waiting: true, taskPhase: 'reporting',
  })
})
