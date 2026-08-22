import assert from 'node:assert/strict'
import test from 'node:test'
import { energyDetailData } from '../src/data/dashboard.js'

test('builds four distinct ECharts visualizations for the operations footer', async () => {
  const module = await import('../src/components/EnergyFooterECharts.js').catch(() => ({}))
  assert.equal(typeof module.buildEnergyFooterChartOption, 'function', 'footer ECharts option builder is missing')

  const expectedSeries = {
    ranking: 'bar',
    closure: 'pie',
    health: 'radar',
    forecast: 'line',
  }
  for (const [kind, seriesType] of Object.entries(expectedSeries)) {
    const option = module.buildEnergyFooterChartOption(kind, energyDetailData.water, 'cyan')
    assert.ok(option.series.some((series) => series.type === seriesType), `${kind} must use a ${seriesType} series`)
    assert.equal(option.animationDuration, 900)
    if (kind === 'health') assert.equal(option.radar.splitNumber, 5, 'health radar should use readable 20-point rings')
    if (kind === 'closure') assert.deepEqual(option.series[0].center, ['50%', '52%'], 'closure donut should be centered')
  }
})

test('waits for a measurable chart host before initializing ECharts', async () => {
  const module = await import('../src/components/EnergyFooterECharts.js').catch(() => ({}))
  assert.equal(typeof module.hasRenderableChartSize, 'function')
  assert.equal(module.hasRenderableChartSize({ clientWidth: 0, clientHeight: 203 }), false)
  assert.equal(module.hasRenderableChartSize({ clientWidth: 280, clientHeight: 0 }), false)
  assert.equal(module.hasRenderableChartSize({ clientWidth: 280, clientHeight: 203 }), true)
})
