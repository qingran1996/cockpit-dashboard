import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('renders the operating status header with the active campus lighting mode', async () => {
  const module = await import('../src/components/HomepageHeader.js').catch(() => ({}))
  assert.equal(typeof module.HomepageHeader, 'function', 'HomepageHeader is missing')
  const eveningMarkup = renderToStaticMarkup(createElement(module.HomepageHeader, {
    time: '2026-08-20 10:24:35',
    lightingMode: 'evening',
  }))
  const dayMarkup = renderToStaticMarkup(createElement(module.HomepageHeader, {
    time: '2026-08-20 10:24:35',
    lightingMode: 'day',
  }))

  assert.match(eveningMarkup, /系统在线/)
  assert.match(eveningMarkup, /数据更新时间：2026-08-20 10:24:35/)
  assert.match(eveningMarkup, /大塚综合数字孪生平台/)
  assert.doesNotMatch(eveningMarkup, /能源综合监控可视化平台/)
  assert.match(eveningMarkup, /aria-label="业务看板切换"/)
  assert.match(eveningMarkup, /能源驾驶舱/)
  assert.match(eveningMarkup, /APS排产能耗/)
  assert.match(eveningMarkup, /傍晚模式/)
  assert.match(eveningMarkup, /☾/)
  assert.match(dayMarkup, /日间模式/)
  assert.match(dayMarkup, /☀/)
})
