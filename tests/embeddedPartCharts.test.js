import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('maps the two UE chart routes to dedicated standalone surfaces', async () => {
  const module = await import('../src/appSurface.js').catch(() => ({}))

  assert.equal(module.resolveAppSurface('/test1'), 'part-1-chart')
  assert.equal(module.resolveAppSurface('/test1/'), 'part-1-chart')
  assert.equal(module.resolveAppSurface('/test2'), 'part-2-chart')
  assert.equal(module.resolveAppSurface('/test2/'), 'part-2-chart')
  assert.equal(module.resolveAppSurface('/not-a-chart'), 'campus')
})

test('provides distinct component telemetry contracts for both chart surfaces', async () => {
  const module = await import('../src/embeddedPartCharts.js').catch(() => ({}))

  assert.equal(typeof module.resolveEmbeddedPartChart, 'function', 'embedded chart resolver is missing')

  const part1 = module.resolveEmbeddedPartChart('part-1-chart')
  assert.equal(part1.title, '部件 1 · 实时运行趋势')
  assert.equal(part1.metric.value, '78.6')
  assert.equal(part1.metric.unit, '%')
  assert.equal(part1.chartAriaLabel, '部件 1 最近十二分钟运行负载趋势')
  assert.equal(part1.option.series[0].type, 'line')
  assert.equal(part1.option.series[0].data.length, 12)

  const part2 = module.resolveEmbeddedPartChart('part-2-chart')
  assert.equal(part2.title, '部件 2 · 工况数据对比')
  assert.equal(part2.metric.value, '92.4')
  assert.equal(part2.metric.unit, '%')
  assert.equal(part2.chartAriaLabel, '部件 2 六个监测点实际值与目标值对比')
  assert.deepEqual(part2.option.series.map((series) => series.type), ['bar', 'bar'])
  assert.deepEqual(part2.option.series.map((series) => series.data.length), [6, 6])

  assert.equal(module.resolveEmbeddedPartChart('campus'), null)
})

test('renders each UE chart as a standalone accessible viewport', async () => {
  const module = await import('../src/components/EmbeddedPartChartPage.js').catch(() => ({}))

  assert.equal(typeof module.EmbeddedPartChartPage, 'function', 'embedded chart page is missing')

  const part1Markup = renderToStaticMarkup(createElement(module.EmbeddedPartChartPage, { surfaceMode: 'part-1-chart' }))
  assert.match(part1Markup, /class="embedded-part-chart(?:\s|")/)
  assert.match(part1Markup, />部件 1 · 实时运行趋势</)
  assert.match(part1Markup, />78\.6</)
  assert.match(part1Markup, /aria-label="部件 1 最近十二分钟运行负载趋势"/)

  const part2Markup = renderToStaticMarkup(createElement(module.EmbeddedPartChartPage, { surfaceMode: 'part-2-chart' }))
  assert.match(part2Markup, />部件 2 · 工况数据对比</)
  assert.match(part2Markup, />92\.4</)
  assert.match(part2Markup, /aria-label="部件 2 六个监测点实际值与目标值对比"/)

  assert.doesNotMatch(`${part1Markup}${part2Markup}`, /dashboard-shell|industrial-scene|<canvas/)
})
