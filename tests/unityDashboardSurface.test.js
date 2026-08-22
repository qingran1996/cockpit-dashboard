import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('selects the transparent Unity dashboard only for its dedicated page', async () => {
  const module = await import('../src/appSurface.js').catch(() => ({}))

  assert.equal(typeof module.resolveAppSurface, 'function', 'app surface resolver is missing')
  assert.equal(module.resolveAppSurface('/'), 'campus')
  assert.equal(module.resolveAppSurface('/unity-dashboard'), 'unity-overlay')
  assert.equal(module.resolveAppSurface('/unity-dashboard/'), 'unity-overlay')
  assert.equal(module.resolveAppSurface('/energy-detail'), 'campus')
})

test('renders a transparent Unity viewport without mounting a web 3D canvas', async () => {
  const module = await import('../src/components/UnityViewport.js').catch(() => ({}))

  assert.equal(typeof module.UnityViewport, 'function', 'Unity viewport component is missing')
  const markup = renderToStaticMarkup(createElement(module.UnityViewport))

  assert.match(markup, /aria-label="Unity 厂区模型透明视口"/)
  assert.match(markup, /class="unity-viewport"/)
  assert.doesNotMatch(markup, /industrial-scene/)
  assert.doesNotMatch(markup, /<canvas/)
})
