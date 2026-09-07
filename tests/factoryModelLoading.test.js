import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('renders determinate GLB transfer progress while the factory asset is preparing', async () => {
  const module = await import('../src/components/FactoryModelLoading.js').catch(() => ({}))

  assert.equal(typeof module.FactoryModelLoading, 'function', 'factory loading indicator is missing')
  const markup = renderToStaticMarkup(createElement(module.FactoryModelLoading, { status: 'loading', progress: 64 }))

  assert.match(markup, /role="status"/)
  assert.match(markup, /aria-label="厂区模型正在加载"/)
  assert.match(markup, /industrial-scene__loader-ring--outer/)
  assert.match(markup, /industrial-scene__loader-ring--inner/)
  assert.match(markup, /industrial-scene__loader-ring--axis/)
  assert.match(markup, /industrial-scene__loader-core/)
  assert.match(markup, /64%/)
  assert.match(markup, /aria-valuenow="64"/)
  assert.equal((markup.match(/<i class="industrial-scene__loader-shockwave /g) ?? []).length, 2)
  assert.doesNotMatch(markup, /<svg|<ol/)
})

test('renders an actionable factory asset error instead of hiding the failure', async () => {
  const { FactoryModelLoading } = await import('../src/components/FactoryModelLoading.js')
  const markup = renderToStaticMarkup(createElement(FactoryModelLoading, {
    status: 'error',
    error: '浏览器不支持模型内嵌的 WebP 贴图',
  }))

  assert.match(markup, /role="alert"/)
  assert.match(markup, /WebP/)
  assert.match(markup, /重新加载/)
})

test('leaves the WebGL recovery message visible when the scene is unavailable', async () => {
  const module = await import('../src/components/FactoryModelLoading.js')
  const markup = renderToStaticMarkup(createElement(module.FactoryModelLoading, {
    status: 'loading',
    unavailable: true,
  }))

  assert.equal(markup, '')
})

test('removes concealed scene controls from interaction while the asset loads', async () => {
  const module = await import('../src/components/FactoryModelLoading.js')

  assert.equal(typeof module.resolveFactorySceneInterfaceProps, 'function')
  assert.deepEqual(module.resolveFactorySceneInterfaceProps('loading'), {
    inert: '',
    'aria-hidden': true,
  })
  assert.deepEqual(module.resolveFactorySceneInterfaceProps('ready'), {})
  assert.deepEqual(module.resolveFactorySceneInterfaceProps('error'), {})
})

test('uses an opaque loader base so the provisional WebGL scene cannot bleed through', async () => {
  const css = await readFile(new URL('../src/styles/index.css', import.meta.url), 'utf8')
  const loaderRule = css.match(/\.industrial-scene__loader\s*\{[\s\S]*?\n\}/)?.[0] ?? ''

  assert.match(loaderRule, /background:\s*rgb\(\d+,\s*\d+,\s*\d+\)/)
  assert.doesNotMatch(loaderRule, /background:[^;]*rgba\(/)
})
