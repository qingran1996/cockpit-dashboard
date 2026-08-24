import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('renders an accessible start command before the campus tour is active', async () => {
  const module = await import('../src/components/CampusTourControl.js').catch(() => ({}))
  assert.equal(typeof module.CampusTourControl, 'function', 'campus tour control is missing')
  const markup = renderToStaticMarkup(createElement(module.CampusTourControl, {
    state: { active: false, playing: false, index: 0, progress: 0 },
    onStart: () => {},
  }))
  assert.match(markup, /aria-label="启动厂区自动漫游"/)
  assert.match(markup, /厂区漫游/)
  assert.match(markup, /ROUTE INSPECTION/)
})

test('renders station progress and complete playback commands during a tour', async () => {
  const module = await import('../src/components/CampusTourControl.js').catch(() => ({}))
  const markup = renderToStaticMarkup(createElement(module.CampusTourControl, {
    state: { active: true, playing: true, index: 2, progress: .42 },
    onToggle: () => {},
    onPrevious: () => {},
    onNext: () => {},
    onExit: () => {},
  }))
  assert.match(markup, /aria-label="厂区自动漫游"/)
  assert.match(markup, /主生产区/)
  assert.match(markup, /03 [/] 07/)
  assert.match(markup, /aria-label="上一漫游站点"/)
  assert.match(markup, /aria-label="暂停厂区漫游"/)
  assert.match(markup, /aria-label="下一漫游站点"/)
  assert.match(markup, /aria-label="退出厂区漫游"/)
  assert.match(markup, /--tour-progress:42%/)
})
