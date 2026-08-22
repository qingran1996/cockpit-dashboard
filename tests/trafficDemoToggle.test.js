import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('renders accessible live and paused campus traffic states', async () => {
  const module = await import('../src/components/TrafficDemoToggle.js').catch(() => ({}))
  assert.equal(typeof module.TrafficDemoToggle, 'function', 'traffic demo toggle is missing')

  const enabled = renderToStaticMarkup(createElement(module.TrafficDemoToggle, {
    active: true,
    onToggle: () => {},
  }))
  assert.match(enabled, /aria-pressed="true"/)
  assert.match(enabled, /aria-label="暂停交通演示"/)
  assert.match(enabled, /TRAFFIC LIVE/)
  assert.match(enabled, /交通运行中/)

  const paused = renderToStaticMarkup(createElement(module.TrafficDemoToggle, {
    active: false,
    onToggle: () => {},
  }))
  assert.match(paused, /aria-pressed="false"/)
  assert.match(paused, /aria-label="启动交通演示"/)
  assert.match(paused, /TRAFFIC PAUSED/)
  assert.match(paused, /交通已暂停/)
})
