import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { dashboardData } from '../src/data/dashboard.js'

test('renders dense steam KPIs, boiler states, efficiency, cost and warning', async () => {
  const telemetry = await import('../src/components/HomepageTelemetry.js').catch(() => ({}))
  assert.equal(typeof telemetry.SteamTelemetry, 'function', 'SteamTelemetry is missing')
  const markup = renderToStaticMarkup(createElement(telemetry.SteamTelemetry, { data: dashboardData.steam }))

  for (const label of ['实时流量', '今日用汽量', '供汽压力', '供汽温度', '1#锅炉', '2#锅炉', '3#锅炉', '4#锅炉', '锅炉效率', '锅炉负荷', '单位成本', '管网末端压降偏高', '处置进度', '责任班组']) {
    assert.match(markup, new RegExp(label))
  }
  assert.match(markup, /68\.5%/)
  assert.match(markup, /0 \/ 2/)
  assert.match(markup, /动力运行/)
  assert.match(markup, /较昨日 <b>\+0\.03<\/b>/)
  assert.match(markup, /较昨日 <b>\+2<\/b>/)
  assert.match(markup, /较昨日 <b>\+8<\/b>/)
  assert.match(markup, /较昨日 -1/)
  assert.match(markup, /持续 12 分钟/)
})

test('keeps six homepage live signals and renders approved footer totals', async () => {
  const { CampusEnergyPulse } = await import('../src/components/CampusEnergyPulse.js')
  const { BottomMetrics } = await import('../src/components/BottomMetrics.js')
  const pulse = renderToStaticMarkup(createElement(CampusEnergyPulse))
  const footer = renderToStaticMarkup(createElement(BottomMetrics, { metrics: dashboardData.bottomMetrics }))

  assert.equal((pulse.match(/class="campus-energy-pulse__signal campus-energy-pulse__signal--/g) ?? []).length, 6)
  assert.equal((pulse.match(/class="campus-energy-pulse__signal-content"/g) ?? []).length, 6)
  assert.match(pulse, /活跃告警/)
  assert.match(footer, /<footer class="bottom-metrics" data-density="compact">/)
  for (const label of ['今日总用水', '今日总用电', '今日总蒸汽', '综合能耗', '告警数量']) {
    assert.match(footer, new RegExp(label))
  }
  assert.equal((footer.match(/class="bottom-metric__comparisons"/g) ?? []).length, 5)
  assert.equal((footer.match(/homepage-comparison/g) ?? []).length, 10)
  assert.match(footer, /较昨日/)
  assert.match(footer, /环比上月/)
})

test('groups steam trend and boiler readings in the shared instrument frame', async () => {
  const { SteamTelemetry } = await import('../src/components/HomepageTelemetry.js')
  const markup = renderToStaticMarkup(createElement(SteamTelemetry, { data: dashboardData.steam }))

  assert.match(markup, /role="group" aria-label="蒸汽运行分析"/)
})

test('keeps the compact steam panel aligned above the reduced footer', async () => {
  const module = await import('../src/homepagePanelLayout.js').catch(() => ({}))
  assert.equal(typeof module.resolveCompactSteamPanelLayout, 'function', 'compact steam layout resolver is missing')
  assert.deepEqual(module.resolveCompactSteamPanelLayout({ panelHeight: 314, titleHeight: 48, footerHeightReduction: 28, campusHeightGain: 24 }), {
    panelTop: 630,
    panelHeight: 294,
    processHeight: 227,
    chartHeight: 188,
    balanceHeight: 56,
  })
})

test('narrows homepage side rails and gives the released width to the campus', async () => {
  const module = await import('../src/homepagePanelLayout.js').catch(() => ({}))
  assert.equal(typeof module.resolveHomepagePanelLayout, 'function', 'homepage panel layout resolver is missing')
  assert.deepEqual(module.resolveHomepagePanelLayout(), {
    side: { outer: 20, top: 92, width: 392, height: 832, gap: 12 },
    center: { left: 424, width: 1072 },
    pulse: { left: 427, width: 1066 },
    focusToggleRight: 436,
    footer: { height: 96, bottom: 36 },
  })
})

test('organizes compact steam telemetry as a three-stage thermal process', async () => {
  const { SteamTelemetry } = await import('../src/components/HomepageTelemetry.js')
  const markup = renderToStaticMarkup(createElement(SteamTelemetry, { data: dashboardData.steam }))

  assert.match(markup, /data-steam-zone="flow"/)
  assert.match(markup, /data-steam-zone="boilers"/)
  assert.match(markup, /data-steam-zone="quality"/)
  assert.match(markup, /蒸汽趋势与流量/)
  assert.match(markup, /锅炉群状态/)
  assert.match(markup, /供汽质量与告警/)
  for (const label of ['锅炉出口', '用户端', '供需差', '热损失']) assert.match(markup, new RegExp(label))
})

test('renders the reference steam balance band and two-row alarm list', async () => {
  const { SteamTelemetry } = await import('../src/components/HomepageTelemetry.js')
  const markup = renderToStaticMarkup(createElement(SteamTelemetry, { data: dashboardData.steam }))

  assert.match(markup, /管网平衡数据/)
  assert.match(markup, /aria-label="蒸汽告警列表"/)
  assert.match(markup, /告警<span>2<\/span>/)
  assert.equal((markup.match(/class="steam-alert-row"/g) ?? []).length, 2)
})

test('shows the planned operating band and reference flow on the steam trend', async () => {
  const { chartOptions } = await import('../src/data/dashboard.js')
  const steamSeries = chartOptions.steamFlow.series[0]

  assert.deepEqual(steamSeries.markArea?.data, [[{ yAxis: 42 }, { yAxis: 55 }]])
  assert.deepEqual(steamSeries.markLine?.data, [{ yAxis: 50 }])
})

test('shows two operational comparisons for every live homepage signal', async () => {
  const { CampusEnergyPulse } = await import('../src/components/CampusEnergyPulse.js')
  const markup = renderToStaticMarkup(createElement(CampusEnergyPulse))

  assert.equal((markup.match(/class="campus-energy-pulse__comparisons"/g) ?? []).length, 6)
  assert.equal((markup.match(/homepage-comparison/g) ?? []).length, 12)
  assert.match(markup, /较昨日/)
  assert.match(markup, /环比上月/)
})
