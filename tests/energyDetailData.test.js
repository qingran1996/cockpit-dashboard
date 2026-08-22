import assert from 'node:assert/strict'
import test from 'node:test'

test('defines complete second-level detail content for water power and steam', async () => {
  const module = await import('../src/data/dashboard.js')
  const details = module.energyDetailData

  assert.ok(details, 'expected an exported energyDetailData contract')
  assert.deepEqual(Object.keys(details), ['water', 'power', 'steam'])

  for (const key of Object.keys(details)) {
    const detail = details[key]
    assert.ok(detail.title)
    assert.match(detail.tone, /^(cyan|orange)$/)
    assert.ok(detail.tabs.length >= 4)
    assert.equal(detail.metrics.length, 4)
    assert.ok(detail.metrics.every((metric) => metric.label && metric.value && metric.unit !== undefined))
    assert.ok(detail.trend.labels.length >= 8)
    assert.equal(detail.trend.current.length, detail.trend.labels.length)
    assert.equal(detail.trend.previous.length, detail.trend.labels.length)
    assert.ok(detail.breakdown.length >= 3)
    assert.ok(detail.network.length >= 3)
    assert.ok(detail.alarms.length >= 1)
    assert.ok(detail.workOrders.length >= 3)
    assert.ok(detail.workOrders.every((item) => item.title && item.owner && item.deadline && item.status))
    assert.equal(detail.health.length, 4)
    assert.ok(detail.health.every((item) => item.label && item.value && Number.isFinite(item.percent) && item.status))
    assert.equal(detail.forecast.values.length, 7)
    assert.ok(detail.forecast.title && detail.forecast.unit && detail.forecast.summary.length >= 3)
    assert.ok(detail.benchmarks.length >= 4)
    assert.ok(detail.benchmarks.every((item) => item.label && item.current && item.reference && item.status))
    assert.equal(detail.diagnostics.length, 6)
    assert.ok(detail.diagnostics.every((item) => item.label && item.value && item.status))
  }
})

test('uses resource-specific operational tabs and units', async () => {
  const { energyDetailData } = await import('../src/data/dashboard.js')

  assert.ok(energyDetailData.water.tabs.includes('管网'))
  assert.ok(energyDetailData.power.tabs.includes('电能质量'))
  assert.ok(energyDetailData.steam.tabs.includes('锅炉'))
  assert.equal(energyDetailData.water.metrics[1].unit, 'm³/h')
  assert.equal(energyDetailData.power.metrics[0].unit, 'MW')
  assert.equal(energyDetailData.steam.metrics[0].unit, 't/h')
  assert.equal(energyDetailData.water.forecast.title, '七日用水预测')
  assert.equal(energyDetailData.power.forecast.title, '七日负荷预测')
  assert.equal(energyDetailData.steam.forecast.title, '七日用汽预测')
})
