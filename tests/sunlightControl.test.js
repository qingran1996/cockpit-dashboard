import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('renders an accessible sunlight instrument above the lighting modes', async () => {
  const module = await import('../src/components/SunlightControl.js').catch(() => ({}))
  assert.equal(typeof module.SunlightControl, 'function', 'sunlight control component is missing')

  const markup = renderToStaticMarkup(createElement(module.SunlightControl, {
    value: 42,
    mode: 'evening',
    onChange: () => {},
    onModeChange: () => {},
    advancedOpen: false,
    onAdvancedToggle: () => {},
  }))
  assert.match(markup, /aria-label="阳光强度"/)
  assert.match(markup, /type="range"/)
  assert.match(markup, /min="0"/)
  assert.match(markup, /max="100"/)
  assert.match(markup, /value="42"/)
  assert.match(markup, /42%/)
  assert.match(markup, /日间/)
  assert.match(markup, /傍晚/)
  assert.match(markup, /aria-pressed="false"/)
  assert.match(markup, /aria-pressed="true"/)
  assert.match(markup, /aria-label="打开高级光照参数"/)
  assert.match(markup, /aria-expanded="false"/)
})
