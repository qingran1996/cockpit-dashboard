import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('renders the APS plan-energy dashboard required by section 7.1', async () => {
  const module = await import('../src/components/ApsDashboard.js').catch(() => ({}))
  assert.equal(typeof module.ApsDashboard, 'function', 'ApsDashboard is missing')
  const markup = renderToStaticMarkup(createElement(module.ApsDashboard))

  for (const label of [
    '今日排产批次', '计划产量', '预测综合能耗', '预计吨耗', '偏差告警',
    '排产概览', '产品单位能耗', 'APS排产计划', '计划与实际', '偏差预警',
    '未来7日能源预测', '车间×产品能耗排行',
  ]) assert.match(markup, new RegExp(label))

  assert.match(markup, /APS接口/)
  assert.equal((markup.match(/<select/g) ?? []).length, 3)
  assert.equal((markup.match(/type="date"/g) ?? []).length, 2)
  for (const option of ['TERRACESS', 'POTICON', '原料车间', '成型车间', '破碎机-01', '窑炉-01']) {
    assert.match(markup, new RegExp(`<option[^>]*>${option}</option>`))
  }
  assert.equal((markup.match(/class="aps-schedule-row"/g) ?? []).length, 10)
  assert.equal((markup.match(/class="aps-forecast-legend__item"/g) ?? []).length, 4)
})

test('renders the complete raw-material market and cost-link dashboard required by section 7.2', async () => {
  const module = await import('../src/components/MaterialPriceDashboard.js').catch(() => ({}))
  assert.equal(typeof module.MaterialPriceDashboard, 'function', 'MaterialPriceDashboard is missing')
  const markup = renderToStaticMarkup(createElement(module.MaterialPriceDashboard))

  for (const label of [
    '监测材料', '今日上涨', '今日下跌', '价格预警', '原料价格指数',
    '实时行情', '原材料价格趋势', '涨跌排行', '原材料实时报价', '成本影响分析',
  ]) assert.match(markup, new RegExp(label))
  assert.equal((markup.match(/<select/g) ?? []).length, 5)
  for (const option of ['PPS树脂', '玻璃纤维', 'ECR2400', '卓创资讯', '近7天', '近90天', '每小时']) {
    assert.match(markup, new RegExp(`<option[^>]*>${option}</option>`))
  }
  assert.equal((markup.match(/class="material-live-card material-live-card--/g) ?? []).length, 4)
  assert.equal((markup.match(/class="material-table-row material-table-row--/g) ?? []).length, 8)
  assert.equal((markup.match(/class="material-impact-row"/g) ?? []).length, 2)
})
