import assert from 'node:assert/strict'
import test from 'node:test'
import { energyDetailData } from '../src/data/dashboard.js'

test('resolves distinct operational data for every power detail tab', async () => {
  const module = await import('../src/energyDetailTabView.js').catch(() => ({}))
  assert.equal(typeof module.resolveEnergyTabView, 'function', 'tab view resolver is missing')

  const views = energyDetailData.power.tabs.map((tab) => module.resolveEnergyTabView(energyDetailData.power, tab))
  assert.deepEqual(views.map((view) => view.chart.title), [
    '24小时综合负荷',
    '实时负荷与预测',
    '需量控制过程',
    '电压谐波频谱',
    '关键设备健康度',
  ])
  assert.deepEqual(views.map((view) => view.metrics[0].label), [
    '实时负荷',
    '当前负荷',
    '当前需量',
    '电压总谐波',
    '在线设备',
  ])
  assert.equal(new Set(views.map((view) => view.context.title)).size, 5)
})

test('covers every declared water and steam tab and falls back to overview', async () => {
  const { resolveEnergyTabView } = await import('../src/energyDetailTabView.js')

  for (const resource of ['water', 'steam']) {
    const detail = energyDetailData[resource]
    for (const tab of detail.tabs) {
      const view = resolveEnergyTabView(detail, tab)
      assert.equal(view.chart.labels.length, view.chart.values.length)
      assert.equal(view.metrics.length, 4)
      assert.equal(view.diagnostics.length, 6)
    }
    assert.equal(resolveEnergyTabView(detail, '未知').chart.title, resolveEnergyTabView(detail, '总览').chart.title)
  }
})
