import assert from 'node:assert/strict'
import test from 'node:test'

test('temporarily suspends an open energy detail while campus focus is active', async () => {
  const module = await import('../src/dashboardPresentation.js').catch(() => ({}))
  assert.equal(typeof module.resolveDashboardPresentation, 'function')
  const detail = { resource: 'water', tab: '管网' }

  assert.deepEqual(module.resolveDashboardPresentation(false, detail), {
    showEnergyDetail: true,
    hasEnergyDetailClass: true,
  })
  assert.deepEqual(module.resolveDashboardPresentation(true, detail), {
    showEnergyDetail: false,
    hasEnergyDetailClass: false,
  })
  assert.deepEqual(detail, { resource: 'water', tab: '管网' })
})
