import assert from 'node:assert/strict'
import test from 'node:test'

test('opens the campus in day mode without unsolicited camera orbit', async () => {
  const module = await import('../src/scene/campusViewDefaults.js').catch(() => ({}))

  assert.equal(module.DEFAULT_CAMPUS_LIGHTING_MODE, 'day')
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

test('keeps the focused campus inside the real browser viewport without a lower letterbox band', async () => {
  const module = await import('../src/scene/campusViewDefaults.js').catch(() => ({}))
  assert.equal(typeof module.resolveCampusFocusViewport, 'function', 'focus viewport resolver is missing')

  for (const [width, height] of [[1512, 731], [1920, 1080], [2560, 1080]]) {
    const layout = module.resolveCampusFocusViewport(width, height)
    assert.equal(layout.scene.top, 0)
    assert.equal(layout.scene.height, 1080)
    assert.ok(layout.screen.left >= 0 && layout.screen.top >= 0)
    assert.ok(layout.screen.right <= width + .01 && layout.screen.bottom <= height + .01)
    assert.ok(Math.abs(layout.screen.bottom - height) < .01, `${width}x${height} must not leave a lower empty band`)
    assert.ok(layout.controls.top >= 32 && layout.controls.right >= 32)
  }
})
