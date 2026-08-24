import assert from 'node:assert/strict'
import test from 'node:test'

test('provides a safe ordered inspection route around the complete campus', async () => {
  const module = await import('../src/scene/campusTour.js').catch(() => ({}))
  assert.ok(Array.isArray(module.CAMPUS_TOUR_STOPS), 'campus tour stops are missing')
  assert.deepEqual(module.CAMPUS_TOUR_STOPS.map(({ id }) => id), [
    'gate', 'administration', 'production', 'processing', 'utilities', 'warehouse', 'overview',
  ])
  assert.equal(new Set(module.CAMPUS_TOUR_STOPS.map(({ id }) => id)).size, 7)
  for (const stop of module.CAMPUS_TOUR_STOPS) {
    assert.ok(stop.label && stop.caption)
    assert.equal(stop.position.length, 3)
    assert.equal(stop.target.length, 3)
    assert.ok(stop.position.every(Number.isFinite))
    assert.ok(stop.target.every(Number.isFinite))
    assert.ok(stop.position[1] >= 10, `${stop.id} camera must clear roofs and site furniture`)
    assert.ok(stop.transitionMs >= 1200 && stop.holdMs >= 1800)
  }
})

test('wraps previous and next tour commands across the route boundary', async () => {
  const module = await import('../src/scene/campusTour.js').catch(() => ({}))
  assert.equal(typeof module.normalizeCampusTourIndex, 'function', 'tour index normalizer is missing')
  assert.equal(module.normalizeCampusTourIndex(-1), 6)
  assert.equal(module.normalizeCampusTourIndex(7), 0)
  assert.equal(module.resolveCampusTourStop(8).id, 'administration')
})
