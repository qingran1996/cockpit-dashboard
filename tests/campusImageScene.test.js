import test from 'node:test'
import assert from 'node:assert/strict'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

globalThis.React = React

test('renders the supplied campus overview as the center-stage visual', async () => {
  const module = await import('../src/components/CampusImageScene.js').catch(() => ({}))

  assert.equal(typeof module.CampusImageScene, 'function', 'campus image scene is missing')

  const markup = renderToStaticMarkup(createElement(module.CampusImageScene))

  assert.match(markup, /class="industrial-scene is-campus-image"/)
  assert.match(markup, /src="\/images\/campus-overview\.jpg"/)
  assert.match(markup, /alt="张家港大塚化学厂区鸟瞰图"/)
  assert.doesNotMatch(markup, /canvas|交互式三维/)
})
