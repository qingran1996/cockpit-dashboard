import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('renders live frame, draw, triangle, memory, and quality controls as a compact operator HUD', async () => {
  const module = await import('../src/components/FactorySceneTelemetry.js').catch(() => ({}))
  assert.equal(typeof module.FactorySceneTelemetry, 'function')
  const markup = renderToStaticMarkup(createElement(module.FactorySceneTelemetry, {
    quality: 'balanced',
    telemetry: { fps: 57.4, calls: 612, triangles: 3318910, geometries: 555, textures: 35, heapMb: 512 },
  }))

  assert.match(markup, /57\.4/)
  assert.match(markup, /612/)
  assert.match(markup, /3\.32M/)
  assert.match(markup, /512 MB/)
  assert.match(markup, /高画质/)
  assert.match(markup, /均衡/)
  assert.match(markup, /性能/)
  assert.match(markup, /aria-pressed="true"[^>]*>均衡</)
})
