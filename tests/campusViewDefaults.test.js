import assert from 'node:assert/strict'
import test from 'node:test'

test('opens the campus in evening mode without unsolicited camera orbit', async () => {
  const module = await import('../src/scene/campusViewDefaults.js').catch(() => ({}))

  assert.equal(module.DEFAULT_CAMPUS_LIGHTING_MODE, 'evening')
  assert.equal(typeof module.deriveCampusOrbitPolicy, 'function')
  assert.deepEqual(module.deriveCampusOrbitPolicy({ reducedMotion: false }), {
    autoRotate: false,
    enableDamping: true,
    dampingFactor: 0.055,
  })
  assert.deepEqual(module.deriveCampusOrbitPolicy({ reducedMotion: true }), {
    autoRotate: false,
    enableDamping: false,
    dampingFactor: 0,
  })
})
