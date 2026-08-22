import assert from 'node:assert/strict'
import test from 'node:test'

test('clamps invalid sunlight input before it reaches the lighting rig', async () => {
  const module = await import('../src/scene/campusSunlight.js').catch(() => ({}))
  assert.equal(typeof module.clampCampusSunlight, 'function', 'sunlight clamp helper is missing')

  assert.equal(module.clampCampusSunlight(180), 100)
  assert.equal(module.clampCampusSunlight(-20), 0)
  assert.equal(module.clampCampusSunlight('61'), 61)
  assert.equal(module.clampCampusSunlight(Number.NaN), 0)
})

test('remembers a separate sunlight percentage for day and evening', async () => {
  const module = await import('../src/scene/campusSunlight.js').catch(() => ({}))
  assert.equal(typeof module.updateCampusSunlight, 'function', 'per-mode sunlight updater is missing')

  const initial = { day: 78, evening: 42 }
  const eveningChanged = module.updateCampusSunlight(initial, 'evening', 61)
  assert.deepEqual(eveningChanged, { day: 78, evening: 61 })
  assert.deepEqual(initial, { day: 78, evening: 42 }, 'updates must not mutate React state')
  assert.equal(module.resolveCampusSunlight(eveningChanged, 'day'), 78)
  assert.equal(module.resolveCampusSunlight(eveningChanged, 'evening'), 61)
})
