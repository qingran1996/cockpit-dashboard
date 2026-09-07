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

test('renders the Web factory on the campus surface and reserves the Unity viewport for its overlay', async () => {
  const module = await import('../src/appSurface.js').catch(() => ({}))

  assert.equal(typeof module.resolveCenterStage, 'function', 'center stage resolver is missing')
  assert.deepEqual(module.resolveCenterStage('campus'), {
    renderFactoryModel: true,
    renderUnityViewport: false,
  })
  assert.deepEqual(module.resolveCenterStage('unity-overlay'), {
    renderFactoryModel: false,
    renderUnityViewport: true,
  })
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

test('removes decorative side buses only from the full-screen Unity surface', async () => {
  const module = await import('../src/dashboardModuleState.js').catch(() => ({}))

  assert.equal(module.shouldRenderDashboardSideRails('energy', 'campus'), true)
  assert.equal(module.shouldRenderDashboardSideRails('energy', 'unity-overlay'), false)
})

test('stretches the Unity overlay to every viewport edge without letterboxing', async () => {
  const module = await import('../src/appSurface.js').catch(() => ({}))

  assert.equal(typeof module.resolveSurfaceTransform, 'function', 'surface transform resolver is missing')
  assert.equal(
    module.resolveSurfaceTransform('unity-overlay', {
      scale: 1,
      left: 320,
      top: 0,
      viewportWidth: 2560,
      viewportHeight: 1080,
    }),
    'translate(0px, 0px) scale(1.3333333333333333, 1)',
  )
  assert.equal(
    module.resolveSurfaceTransform('campus', {
      scale: 1,
      left: 320,
      top: 0,
      viewportWidth: 2560,
      viewportHeight: 1080,
    }),
    'translate(320px, 0px) scale(1)',
  )
})
