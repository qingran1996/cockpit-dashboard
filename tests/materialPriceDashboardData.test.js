import assert from 'node:assert/strict'
import test from 'node:test'

test('provides the eight-material live market, dual ranking and cost impact contract from the reference', async () => {
  const module = await import('../src/data/materialPriceDashboardData.js').catch(() => ({}))
  const data = module.materialPriceDashboardData

  assert.equal(data?.materials?.length, 8)
  assert.ok(data.materials.every((item) => item.price && item.unit && item.source && item.updatedAt))
  assert.equal(data.liveQuotes.length, 4)
  assert.equal(data.rankings.rising.length, 5)
  assert.equal(data.rankings.falling.length, 5)
  assert.equal(data.alerts.length, 2)
  assert.equal(data.costLinks.length, 2)
})

test('compares four normalized material price trends over thirty days', async () => {
  const module = await import('../src/data/materialPriceDashboardData.js').catch(() => ({}))
  const option = module.materialPriceChartOptions?.trend

  assert.equal(option?.series?.length, 4)
  assert.equal(option.yAxis.name, '价格指数')
  assert.ok(option.series.every((series) => series.data.length === 31))
})
