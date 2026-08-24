import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { energyDetailData } from '../src/data/dashboard.js'

test('renders a non-modal water detail sidecar with operational content', async () => {
  const module = await import('../src/components/EnergyDetailSidecar.js').catch(() => ({}))
  assert.equal(typeof module.EnergyDetailSidecar, 'function', 'energy detail sidecar is missing')

  const markup = renderToStaticMarkup(createElement(module.EnergyDetailSidecar, {
    resource: 'water',
    detail: energyDetailData.water,
    activeTab: '总览',
    onTabChange: () => {},
    onClose: () => {},
  }))

  assert.match(markup, /role="dialog"/)
  assert.match(markup, /aria-modal="false"/)
  assert.match(markup, /水资源详情/)
  assert.match(markup, /aria-label="返回能源首页"/)
  assert.match(markup, /<header class="energy-detail__header">[\s\S]*class="energy-detail__return-action energy-detail__header-action"[\s\S]*<\/header><nav/)
  assert.doesNotMatch(markup, /class="energy-detail__return-rail"/)
  assert.doesNotMatch(markup, />×</)
  assert.match(markup, /role="tablist"/)
  assert.match(markup, /aria-selected="true"[^>]*>总览/)
  assert.match(markup, /986\.2/)
  assert.match(markup, /m³\/h/)
  assert.match(markup, /24小时用水流量/)
  assert.match(markup, /二区压力接近高限/)
  assert.match(markup, /链路健康/)
  assert.match(markup, /在线节点/)
  assert.match(markup, /data-network-summary="true"/)
  assert.match(markup, /告警事件流/)
  assert.equal((markup.match(/data-side-echart=/g) ?? []).length, 3)
  for (const kind of ['breakdown', 'network', 'alarms']) {
    assert.match(markup, new RegExp(`data-side-echart="${kind}"`))
  }
  assert.match(markup, /趋势摘要/)
  assert.match(markup, /峰值/)
  assert.match(markup, /平均/)
  assert.match(markup, /运行诊断/)
  assert.match(markup, /供水可用率/)
  assert.match(markup, /46%/)
  assert.match(markup, /处置闭环/)
  assert.match(markup, /分区用能排行/)
  assert.match(markup, /设备健康/)
  assert.match(markup, /七日用水预测/)
  assert.equal((markup.match(/data-footer-echart=/g) ?? []).length, 4)
  for (const kind of ['ranking', 'closure', 'health', 'forecast']) {
    assert.match(markup, new RegExp(`data-footer-echart="${kind}"`))
  }
  assert.doesNotMatch(markup, /运行对标/)
})

test('renders resource-specific power and steam tabs and units', async () => {
  const module = await import('../src/components/EnergyDetailSidecar.js').catch(() => ({}))
  assert.equal(typeof module.EnergyDetailSidecar, 'function', 'energy detail sidecar is missing')

  const powerMarkup = renderToStaticMarkup(createElement(module.EnergyDetailSidecar, {
    resource: 'power', detail: energyDetailData.power, activeTab: '电能质量', onTabChange: () => {}, onClose: () => {},
  }))
  assert.match(powerMarkup, /电力资源详情/)
  assert.match(powerMarkup, /aria-selected="true"[^>]*>电能质量/)
  assert.match(powerMarkup, /2\.8/)
  assert.match(powerMarkup, /%/)
  assert.match(powerMarkup, /2#主变负载率偏高/)
  assert.match(powerMarkup, /电压谐波频谱/)
  assert.match(powerMarkup, /电压总谐波/)
  assert.match(powerMarkup, /data-chart-kind="bar"/)

  const steamMarkup = renderToStaticMarkup(createElement(module.EnergyDetailSidecar, {
    resource: 'steam', detail: energyDetailData.steam, activeTab: '锅炉', onTabChange: () => {}, onClose: () => {},
  }))
  assert.match(steamMarkup, /蒸汽资源详情/)
  assert.match(steamMarkup, /aria-selected="true"[^>]*>锅炉/)
  assert.match(steamMarkup, /运行锅炉/)
  assert.match(steamMarkup, /t\/h/)
  assert.match(steamMarkup, /锅炉负荷分配/)
  assert.match(steamMarkup, /4#锅炉进入热备用/)
})

test('changes visible metrics chart and context when a power tab changes', async () => {
  const { EnergyDetailSidecar } = await import('../src/components/EnergyDetailSidecar.js')
  const render = (activeTab) => renderToStaticMarkup(createElement(EnergyDetailSidecar, {
    resource: 'power', detail: energyDetailData.power, activeTab, onTabChange: () => {}, onClose: () => {},
  }))

  const overview = render('总览')
  const demand = render('需量')
  assert.match(overview, /24小时综合负荷/)
  assert.match(overview, /实时负荷/)
  assert.match(demand, /需量控制过程/)
  assert.match(demand, /当前需量/)
  assert.match(demand, /合同需量控制/)
  assert.notEqual(overview, demand)
})

test('keeps aligned analysis and operations zones visible while tabs change focus', async () => {
  const { EnergyDetailSidecar } = await import('../src/components/EnergyDetailSidecar.js')

  const alarmMarkup = renderToStaticMarkup(createElement(EnergyDetailSidecar, {
    resource: 'water', detail: energyDetailData.water, activeTab: '告警', onTabChange: () => {}, onClose: () => {},
  }))
  assert.match(alarmMarkup, /data-focus-zone="alarms"/)
  assert.match(alarmMarkup, /data-zone="analysis"/)
  assert.match(alarmMarkup, /告警时段分布/)
  assert.match(alarmMarkup, /data-zone="operations"/)
  assert.match(alarmMarkup, /供水管网状态/)
  assert.match(alarmMarkup, /二区压力接近高限/)
  assert.doesNotMatch(alarmMarkup, /data-zone="comparison"/)

  const networkMarkup = renderToStaticMarkup(createElement(EnergyDetailSidecar, {
    resource: 'steam', detail: energyDetailData.steam, activeTab: '管网', onTabChange: () => {}, onClose: () => {},
  }))
  assert.match(networkMarkup, /data-focus-zone="network"/)
  assert.match(networkMarkup, /蒸汽管网状态/)
  assert.match(networkMarkup, /管网压力与温降/)
  assert.doesNotMatch(networkMarkup, /运行对标/)
})

test('keeps water power and steam directly switchable inside the dense detail workspace', async () => {
  const { EnergyDetailSidecar } = await import('../src/components/EnergyDetailSidecar.js')
  const markup = renderToStaticMarkup(createElement(EnergyDetailSidecar, {
    resource: 'water',
    detail: energyDetailData.water,
    activeTab: '总览',
    onTabChange: () => {},
    onResourceChange: () => {},
    onClose: () => {},
  }))

  assert.equal((markup.match(/data-resource-switch=/g) ?? []).length, 3)
  assert.match(markup, /aria-label="切换到水资源详情"[^>]*aria-pressed="true"/)
  assert.match(markup, /aria-label="切换到电力资源详情"[^>]*aria-pressed="false"/)
  assert.match(markup, /aria-label="切换到蒸汽资源详情"[^>]*aria-pressed="false"/)
})
