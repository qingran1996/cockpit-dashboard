import test from 'node:test'
import assert from 'node:assert/strict'

test('holds the shuttle for recognition and clears the barrier before closing', async () => {
  const module = await import('../src/scene/gateTrafficCycle.js').catch(() => ({}))
  assert.equal(typeof module.sampleGateTrafficCycle, 'function', 'shared gate traffic sampler is missing')

  const waiting = module.sampleGateTrafficCycle(2.1, .1)
  assert.equal(waiting.phase, 'recognition-wait')
  assert.equal(waiting.waiting, true)

  const open = module.sampleGateTrafficCycle(2.7, .1)
  assert.equal(open.barrierOpen, 1)
  assert.equal(open.phase, 'crossing')

  const crossing = module.sampleGateTrafficCycle(3.2, .1)
  assert.ok(crossing.vehicleProgress > .4)
  assert.equal(crossing.barrierOpen, 1)

  const cleared = module.sampleGateTrafficCycle(4.4, .1)
  assert.equal(cleared.phase, 'clear-and-close')
  assert.equal(cleared.vehicleProgress, 1)

  const returning = module.sampleGateTrafficCycle(7.5, .1)
  assert.equal(returning.returning, true)
})
