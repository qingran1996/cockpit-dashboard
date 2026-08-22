import assert from 'node:assert/strict'
import test from 'node:test'

test('hides only the top corner ornaments on the three primary resource panels', async () => {
  const module = await import('../src/components/techCornerPolicy.js').catch(() => ({}))
  assert.equal(typeof module.resolveTechCornerPolicy, 'function', 'tech corner policy is missing')

  for (const className of ['water-panel', 'power-panel', 'steam-panel']) {
    assert.equal(module.resolveTechCornerPolicy(className), 'tech-panel--hide-top-corners')
  }
  assert.equal(module.resolveTechCornerPolicy('energy-detail-panel'), '')
})
