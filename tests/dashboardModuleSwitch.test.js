import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('renders the energy dashboard with an available APS and raw-material dropdown', async () => {
  const module = await import('../src/components/DashboardModuleSwitch.js').catch(() => ({}))
  assert.equal(typeof module.DashboardModuleSwitch, 'function', 'DashboardModuleSwitch is missing')

  const markup = renderToStaticMarkup(createElement(module.DashboardModuleSwitch, {
    activeModule: 'energy',
  }))

  assert.match(markup, /aria-label="业务看板切换"/)
  assert.match(markup, /能源驾驶舱/)
  assert.match(markup, /APS排产能耗/)
  assert.match(markup, /原材料价格/)
  assert.match(markup, /aria-current="page"/)
  assert.match(markup, /aria-haspopup="menu"/)
  assert.doesNotMatch(markup, /data-module="aps"[^>]*disabled/)
  assert.match(markup, /<span class="dashboard-module-switch__border-flow" aria-hidden="true"><\/span>/)
  assert.match(markup, /<button[^>]*dashboard-module-switch__home[^>]*>[\s\S]*dashboard-module-switch__home-content[\s\S]*dashboard-module-switch__icon[\s\S]*能源驾驶舱<\/span><\/span><\/button>/)
  assert.match(markup, /dashboard-module-switch__trigger-label">APS排产能耗<\/span>/)
  assert.match(markup, /dashboard-module-switch__dropdown[\s\S]*dashboard-module-switch__trigger/)
})

test('switches among the three supported business dashboards', async () => {
  const module = await import('../src/dashboardModuleState.js').catch(() => ({}))
  assert.deepEqual(module.DASHBOARD_MODULES?.map(({ id }) => id), ['energy', 'aps', 'materials'])
  assert.equal(module.resolveDashboardModule?.('energy', { type: 'select', module: 'aps' }), 'aps')
  assert.equal(module.resolveDashboardModule?.('aps', { type: 'select', module: 'materials' }), 'materials')
  assert.equal(module.resolveDashboardModule?.('materials', { type: 'select', module: 'unknown' }), 'materials')
})

test('groups APS and raw materials behind one business dropdown trigger', async () => {
  const { DashboardModuleSwitch } = await import('../src/components/DashboardModuleSwitch.js')
  const apsMarkup = renderToStaticMarkup(createElement(DashboardModuleSwitch, { activeModule: 'aps' }))
  const materialsMarkup = renderToStaticMarkup(createElement(DashboardModuleSwitch, { activeModule: 'materials' }))

  assert.equal((apsMarkup.match(/dashboard-module-switch__item/g) ?? []).length, 2)
  assert.doesNotMatch(apsMarkup, /dashboard-module-switch__aps/)
  assert.match(apsMarkup, /dashboard-module-switch__trigger is-active[^>]*data-module="aps"[^>]*aria-current="page"[^>]*>[\s\S]*APS排产能耗/)
  assert.match(materialsMarkup, /dashboard-module-switch__trigger is-active[^>]*data-module="materials"[^>]*aria-current="page"[^>]*>[\s\S]*原材料价格/)
  assert.match(materialsMarkup, /role="menu"[\s\S]*data-module="aps"[\s\S]*data-module="materials"/)
})

test('keeps both viewport energy buses visible on APS and raw-material dashboards', async () => {
  for (const activeModule of ['energy', 'aps', 'materials']) {
    const module = await import('../src/dashboardModuleState.js').catch(() => ({}))
    assert.equal(module.shouldRenderDashboardSideRails?.(activeModule), true, `${activeModule} lost its viewport buses`)
  }
})

test('wraps each selected dashboard in a keyed transition stage', async () => {
  const module = await import('../src/components/DashboardModuleStage.js').catch(() => ({}))
  assert.equal(typeof module.DashboardModuleStage, 'function', 'DashboardModuleStage is missing')

  const markup = renderToStaticMarkup(createElement(module.DashboardModuleStage, {
    module: 'aps',
  }, createElement('span', null, '排产内容')))

  assert.match(markup, /class="dashboard-module-stage dashboard-module-stage--aps"/)
  assert.match(markup, /排产内容/)
})

test('uses a clean center-scale transition without molecular particles', async () => {
  const { DashboardModuleStage } = await import('../src/components/DashboardModuleStage.js')
  const markup = renderToStaticMarkup(createElement(DashboardModuleStage, {
    module: 'materials',
  }, createElement('span', null, '行情内容')))

  assert.match(markup, /data-effect="center-scale"/)
  assert.doesNotMatch(markup, /dashboard-molecular-burst/)
  assert.doesNotMatch(markup, /dashboard-molecule/)
})
