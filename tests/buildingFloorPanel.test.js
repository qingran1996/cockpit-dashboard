import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { buildingById } from '../src/scene/buildingRegistry.js'

test('renders an accessible industrial floor-section control for the selected building', async () => {
  const module = await import('../src/components/BuildingFloorPanel.js').catch(() => ({}))
  assert.equal(typeof module.BuildingFloorPanel, 'function', 'building floor panel is missing')
  const building = buildingById.get('administration')
  const markup = renderToStaticMarkup(createElement(module.BuildingFloorPanel, {
    building,
    exploded: true,
    focusedFloorId: 'L02',
    onToggleExploded: () => {},
    onSelectFloor: () => {},
    onClose: () => {},
  }))

  assert.match(markup, /综合管理中心/)
  assert.match(markup, /aria-label="楼层剖面"/)
  assert.match(markup, /L01/)
  assert.match(markup, /二层综合办公区/)
  assert.match(markup, /行政办公与协同空间/)
  assert.match(markup, /正在查看 L02 · 二层综合办公区/)
  assert.match(markup, /aria-label="进入 L02 二层综合办公区内部"/)
  assert.equal((markup.match(/aria-pressed=/g) ?? []).length, 4)
  assert.match(markup, /aria-pressed="true"[^>]*data-tone="cyan"/)
  assert.match(markup, /合拢楼层/)
  assert.match(markup, /关闭建筑分层详情/)
})
