import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { dashboardData } from '../src/data/dashboard.js'

test('renders operator-visible water summary, districts, health and warning', async () => {
  const module = await import('../src/components/HomepageTelemetry.js').catch(() => ({}))
  assert.equal(typeof module.WaterTelemetry, 'function', 'WaterTelemetry is missing')
  const markup = renderToStaticMarkup(createElement(module.WaterTelemetry, { data: dashboardData.water }))

  for (const label of ['今日用水', '实时流量', '平均压力', '漏损率', '一区', '二区', '三区', '在线水表', '告警']) {
    assert.match(markup, new RegExp(label))
  }
  assert.match(markup, /38/)
  assert.match(markup, /40/)
  assert.match(markup, /二区压力接近高限/)
  assert.match(markup, /夜间基流/)
  assert.match(markup, /漏损异常/)
  assert.equal((markup.match(/class="telemetry-kpi__comparisons"/g) ?? []).length, 4)
  assert.match(markup, /class="comparison comparison--[^ ]+ homepage-comparison"/)
  assert.match(markup, /<em class="comparison comparison--good homepage-comparison"><span class="comparison-label">较昨日<\/span><b>-5\.1%<\/b><\/em>/)
  assert.match(markup, /较昨日/)
  assert.match(markup, /环比上月/)
})

test('renders operator-visible power summary, transformers, tariff and quality', async () => {
  const module = await import('../src/components/HomepageTelemetry.js').catch(() => ({}))
  assert.equal(typeof module.PowerTelemetry, 'function', 'PowerTelemetry is missing')
  const markup = renderToStaticMarkup(createElement(module.PowerTelemetry, { data: dashboardData.power }))

  for (const label of ['实时负荷', '最大需量', '功率因数', '频率', '1#主变（高炉）', '2#主变（双螺杆挤出机）', '3#主变（空压机）', '尖时段', '平时段', '谷时段', 'THD']) {
    assert.match(markup, new RegExp(label))
  }
  assert.match(markup, /92\.1/)
  assert.match(markup, /2\.8/)
  assert.equal((markup.match(/class="telemetry-kpi__comparisons"/g) ?? []).length, 4)
  assert.doesNotMatch(markup, /<em class="comparison--(?:good|warning)">较昨日/)
  assert.match(markup, /较昨日/)
  assert.match(markup, /环比上月/)
})

test('fills the water panel terminal with network efficiency signals and a water identity mark', async () => {
  const { WaterTelemetry } = await import('../src/components/HomepageTelemetry.js')
  const markup = renderToStaticMarkup(createElement(WaterTelemetry, { data: dashboardData.water }))

  assert.match(markup, /aria-label="水资源运行终端"/)
  assert.match(markup, /管网健康/)
  assert.match(markup, /夜间基流/)
  assert.match(markup, /单位水耗/)
  assert.match(markup, /95\.0/)
  assert.match(markup, /18\.4/)
  assert.match(markup, /2\.81/)
  assert.equal((markup.match(/class="resource-terminal__signal"/g) ?? []).length, 2)
})

test('fills the power panel terminal with availability signals and a power identity mark', async () => {
  const { PowerTelemetry } = await import('../src/components/HomepageTelemetry.js')
  const markup = renderToStaticMarkup(createElement(PowerTelemetry, { data: dashboardData.power }))

  assert.match(markup, /aria-label="电力资源运行终端"/)
  assert.match(markup, /供电可用率/)
  assert.match(markup, /在线电表/)
  assert.match(markup, /需量利用率/)
  assert.match(markup, /99\.98/)
  assert.match(markup, /64/)
  assert.match(markup, /85\.3/)
  assert.equal((markup.match(/class="resource-terminal__signal"/g) ?? []).length, 3)
  assert.match(markup, /配电系统运行态/)
  assert.match(markup, /稳定供电/)
  assert.match(markup, /3 台主变在线/)
})

test('groups water and power secondary readings into consistent instrument frames', async () => {
  const { WaterTelemetry, PowerTelemetry } = await import('../src/components/HomepageTelemetry.js')
  const water = renderToStaticMarkup(createElement(WaterTelemetry, { data: dashboardData.water }))
  const power = renderToStaticMarkup(createElement(PowerTelemetry, { data: dashboardData.power }))

  assert.match(water, /role="group" aria-label="水资源管网状态"/)
  assert.match(power, /role="group" aria-label="电力资源经济与质量"/)
})

test('reserves a Windows-safe final row for the power terminal comparisons', async () => {
  const module = await import('../src/homepagePanelLayout.js').catch(() => ({}))
  assert.equal(typeof module.resolvePowerPanelRows, 'function', 'power panel row resolver is missing')

  const layout = module.resolvePowerPanelRows(754)

  assert.deepEqual(layout.rows, [104, 238, 116, 100, 164])
  assert.equal(layout.gap, 8)
  assert.ok(layout.rows.at(-1) >= 150, 'terminal row must absorb Windows fallback font metrics')
  assert.equal(layout.rows.reduce((sum, row) => sum + row, 0) + layout.gap * 4, 754)
})
