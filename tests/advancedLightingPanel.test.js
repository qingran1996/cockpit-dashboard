import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('renders a mode-aware four-group commissioning panel with real controls and reset actions', async () => {
  const panelModule = await import('../src/components/AdvancedLightingPanel.js').catch(() => ({}))
  const profileModule = await import('../src/scene/campusLightingProfiles.js')
  assert.equal(typeof panelModule.AdvancedLightingPanel, 'function', 'advanced lighting panel is missing')

  const markup = renderToStaticMarkup(createElement(panelModule.AdvancedLightingPanel, {
    open: true,
    mode: 'evening',
    profile: profileModule.createCampusLightingProfiles().evening,
    groups: profileModule.CAMPUS_LIGHTING_PARAMETER_GROUPS,
    activeGroup: 'solar',
    onClose: () => {},
    onGroupChange: () => {},
    onParameterChange: () => {},
    onResetMode: () => {},
    onResetAll: () => {},
  }))
  assert.match(markup, /光照参数/)
  assert.match(markup, /傍晚配置/)
  assert.match(markup, /role="tablist"/)
  assert.match(markup, /日光/)
  assert.match(markup, /环境/)
  assert.match(markup, /天空氛围/)
  assert.match(markup, /厂区灯具/)
  assert.match(markup, /aria-label="太阳主光"/)
  assert.match(markup, /type="range"/)
  assert.match(markup, /aria-label="太阳颜色"/)
  assert.match(markup, /type="color"/)
  assert.match(markup, /恢复当前模式/)
  assert.match(markup, /全部恢复/)
})

test('keeps the advanced panel hidden until the operator opens it', async () => {
  const panelModule = await import('../src/components/AdvancedLightingPanel.js').catch(() => ({}))
  const profileModule = await import('../src/scene/campusLightingProfiles.js')
  const markup = renderToStaticMarkup(createElement(panelModule.AdvancedLightingPanel, {
    open: false,
    mode: 'day',
    profile: profileModule.createCampusLightingProfiles().day,
    groups: profileModule.CAMPUS_LIGHTING_PARAMETER_GROUPS,
    activeGroup: 'environment',
  }))
  assert.match(markup, /hidden=""/)
})
