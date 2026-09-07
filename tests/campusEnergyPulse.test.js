import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('renders a dense six-signal homepage energy pulse without replacing the campus', async () => {
  const module = await import('../src/components/CampusEnergyPulse.js').catch(() => ({}))
  assert.equal(typeof module.CampusEnergyPulse, 'function', 'campus energy pulse is missing')

  const markup = renderToStaticMarkup(createElement(module.CampusEnergyPulse))
  assert.match(markup, /aria-label="园区实时能源脉冲"/)
  assert.equal((markup.match(/class="campus-energy-pulse__signal campus-energy-pulse__signal--/g) ?? []).length, 6)
  assert.match(markup, /实时水流量/)
  assert.match(markup, /实时电负荷/)
  assert.match(markup, /实时蒸汽流量/)
  assert.match(markup, /最大需量/)
  assert.match(markup, /在线仪表/)
  assert.match(markup, /活跃告警/)
  assert.equal((markup.match(/style="white-space:nowrap"/g) ?? []).length, 6)
})
