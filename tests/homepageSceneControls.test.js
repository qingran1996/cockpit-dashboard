import assert from 'node:assert/strict'
import test from 'node:test'

test('docks homepage scene controls along the model bottom edge', async () => {
  const module = await import('../src/homepagePanelLayout.js')
  assert.equal(typeof module.resolveHomepageSceneControlsLayout, 'function')
  assert.deepEqual(module.resolveHomepageSceneControlsLayout(), {
    lightingRight: 76,
    lightingBottom: 16,
    resetRight: 16,
    resetBottom: 16,
    trafficRight: 16,
    trafficBottom: 88,
    hintLeft: 18,
    hintBottom: 18,
  })
})
