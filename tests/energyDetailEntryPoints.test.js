import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { dashboardData } from '../src/data/dashboard.js'

test('renders a visible detail action for each resource panel header', async () => {
  const module = await import('../src/components/EnergyDetailEntryButton.js').catch(() => ({}))
  assert.equal(typeof module.EnergyDetailEntryButton, 'function', 'energy detail entry button is missing')

  for (const [resource, title] of [['water', '水资源'], ['power', '电力资源'], ['steam', '蒸汽资源']]) {
    const markup = renderToStaticMarkup(createElement(module.EnergyDetailEntryButton, { resource, title, onOpen: () => {} }))
    assert.match(markup, new RegExp(`aria-label="查看${title}详情"`))
    assert.match(markup, /运行详情/)
    assert.match(markup, /energy-detail-entry__rail/)
    assert.match(markup, /energy-detail-entry__arrow/)
  }
})

test('makes the first three bottom metrics detail buttons and keeps the last two as summaries', async () => {
  const module = await import('../src/components/BottomMetrics.js').catch(() => ({}))
  assert.equal(typeof module.BottomMetrics, 'function', 'interactive bottom metrics component is missing')

  const markup = renderToStaticMarkup(createElement(module.BottomMetrics, {
    metrics: dashboardData.bottomMetrics,
    onMetricClick: () => {},
  }))

  assert.equal((markup.match(/<button/g) ?? []).length, 3)
  assert.match(markup, /aria-label="查看水资源详情"/)
  assert.match(markup, /aria-label="查看电力资源详情"/)
  assert.match(markup, /aria-label="查看蒸汽资源详情"/)
  assert.match(markup, /<div class="bottom-metric bottom-metric--cyan"><i[^>]*>ϟ<\/i><div><span>综合能耗<\/span>/)
  assert.match(markup, /<div class="bottom-metric bottom-metric--warning"><i[^>]*>!<\/i><div><span>告警数量<\/span>/)
})
