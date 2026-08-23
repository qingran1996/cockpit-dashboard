import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('renders an accessible campus-only view toggle in both states', async () => {
  const module = await import('../src/components/CampusFocusToggle.js').catch(() => ({}))
  assert.equal(typeof module.CampusFocusToggle, 'function', 'campus focus toggle is missing')

  const normalMarkup = renderToStaticMarkup(createElement(module.CampusFocusToggle, {
    active: false,
    onToggle: () => {},
  }))
  assert.match(normalMarkup, /aria-pressed="false"/)
  assert.match(normalMarkup, /aria-label="只看中间厂区建模"/)
  assert.match(normalMarkup, /专注厂区/)
  assert.match(normalMarkup, /CAMPUS VIEW/)

  const focusMarkup = renderToStaticMarkup(createElement(module.CampusFocusToggle, {
    active: true,
    onToggle: () => {},
  }))
  assert.match(focusMarkup, /aria-pressed="true"/)
  assert.match(focusMarkup, /aria-label="恢复全部监控面板"/)
  assert.match(focusMarkup, /恢复面板/)
  assert.match(focusMarkup, /FOCUS VIEW/)
})

test('focus controls retain a safe inset when the campus fills the design canvas', async () => {
  const { resolveCampusFocusViewport } = await import('../src/scene/campusViewDefaults.js').catch(() => ({}))
  assert.equal(typeof resolveCampusFocusViewport, 'function')
  const layout = resolveCampusFocusViewport(1512, 731)
  assert.deepEqual(layout.scene, { left: 0, top: 0, width: 1920, height: 1080 })
  assert.deepEqual(layout.controls, { top: 42, right: 42 })
})
