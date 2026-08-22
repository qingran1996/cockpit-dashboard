import assert from 'node:assert/strict'
import test from 'node:test'

test('opens switches tabs and closes one energy detail at a time', async () => {
  const module = await import('../src/energyDetailState.js').catch(() => ({}))
  assert.equal(typeof module.resolveEnergyDetail, 'function', 'energy detail state resolver is missing')

  const water = module.resolveEnergyDetail(null, { type: 'open', resource: 'water' })
  assert.deepEqual(water, { resource: 'water', tab: '总览' })

  const waterNetwork = module.resolveEnergyDetail(water, { type: 'tab', tab: '管网' })
  assert.deepEqual(waterNetwork, { resource: 'water', tab: '管网' })

  const power = module.resolveEnergyDetail(waterNetwork, { type: 'open', resource: 'power' })
  assert.deepEqual(power, { resource: 'power', tab: '总览' })
  assert.equal(module.resolveEnergyDetail(power, { type: 'close' }), null)
  assert.equal(module.resolveEnergyDetail(power, { type: 'escape' }), null)
})

test('ignores unsupported energy keys and tab actions without an open detail', async () => {
  const module = await import('../src/energyDetailState.js').catch(() => ({}))
  assert.equal(typeof module.resolveEnergyDetail, 'function', 'energy detail state resolver is missing')

  assert.equal(module.resolveEnergyDetail(null, { type: 'open', resource: 'carbon' }), null)
  assert.equal(module.resolveEnergyDetail(null, { type: 'tab', tab: '告警' }), null)
  assert.deepEqual(
    module.resolveEnergyDetail({ resource: 'steam', tab: '总览' }, { type: 'tab', tab: '' }),
    { resource: 'steam', tab: '总览' },
  )
})
