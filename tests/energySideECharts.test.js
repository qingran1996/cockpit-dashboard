import assert from 'node:assert/strict'
import test from 'node:test'
import { energyDetailData } from '../src/data/dashboard.js'

test('builds a luminous rose chart for secondary resource breakdowns', async () => {
  const module = await import('../src/components/EnergySideECharts.js').catch(() => ({}))
  assert.equal(typeof module.buildEnergySideChartOption, 'function', 'secondary ECharts builder is missing')

  const option = module.buildEnergySideChartOption('breakdown', energyDetailData.water, 'cyan')
  assert.equal(option.animationDuration, 900)
  assert.equal(option.series[0].type, 'pie')
  assert.equal(option.series[0].roseType, 'radius')
  assert.equal(option.series[0].data.length, energyDetailData.water.breakdown.length)
})

test('builds a fixed graph topology for every network node', async () => {
  const { buildEnergySideChartOption } = await import('../src/components/EnergySideECharts.js')
  const option = buildEnergySideChartOption('network', energyDetailData.power, 'cyan')

  assert.equal(option.series[0].type, 'graph')
  assert.equal(option.series[0].layout, 'none')
  assert.equal(option.series[0].data.length, energyDetailData.power.network.length)
  assert.equal(option.series[0].links.length, energyDetailData.power.network.length - 1)
})

test('builds a time-based scatter chart for every alarm event', async () => {
  const { buildEnergySideChartOption } = await import('../src/components/EnergySideECharts.js')
  const option = buildEnergySideChartOption('alarms', energyDetailData.steam, 'orange')

  assert.equal(option.series[0].type, 'scatter')
  assert.equal(option.series[0].data.length, energyDetailData.steam.alarms.length)
  assert.equal(option.xAxis.type, 'value')
  assert.equal(option.yAxis.type, 'category')
})
