import assert from 'node:assert/strict'
import test from 'node:test'

test('provides APS filters, KPI totals, schedule rows and analytics datasets', async () => {
  const module = await import('../src/data/apsDashboardData.js').catch(() => ({}))
  const data = module.apsDashboardData

  assert.equal(data?.filters.length, 4)
  assert.equal(data?.kpis.length, 5)
  assert.equal(data?.schedule.length, 10)
  assert.deepEqual(Object.keys(data?.schedule[0] ?? {}), [
    'workshop', 'machine', 'product', 'batch', 'quantity', 'start', 'end', 'status', 'startHour', 'durationHours',
  ])
  assert.equal(data?.deviations.length, 2)
  assert.equal(data?.forecast.labels.length, 7)
  assert.equal(data?.ranking.length, 5)
})

test('provides four forecast series and plan-versus-actual resource rows', async () => {
  const module = await import('../src/data/apsDashboardData.js').catch(() => ({}))

  assert.equal(module.apsChartOptions?.forecast.series.length, 4)
  assert.deepEqual(module.apsDashboardData?.planActual.map(({ label }) => label), ['用水量', '用电量', '蒸汽量', '综合能耗'])
})
