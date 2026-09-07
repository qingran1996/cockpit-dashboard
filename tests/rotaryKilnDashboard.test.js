import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as THREE from 'three'

test('maps the rotary kiln route to its standalone equipment surface', async () => {
  const module = await import('../src/appSurface.js').catch(() => ({}))

  assert.equal(module.resolveAppSurface('/rotary-kiln'), 'rotary-kiln')
  assert.equal(module.resolveAppSurface('/rotary-kiln/'), 'rotary-kiln')
})

test('provides dense rotary kiln telemetry and trend contracts', async () => {
  const module = await import('../src/data/rotaryKilnData.js').catch(() => ({}))

  assert.equal(module.rotaryKilnData?.kpis.length, 6, 'six headline KPIs are required')
  assert.deepEqual(
    module.rotaryKilnData?.temperatureZones.map((zone) => zone.label),
    ['窑尾预热', '过渡带', '煅烧带', '烧成带', '窑头冷却'],
  )
  assert.equal(module.rotaryKilnData?.temperatureTrend.series.length, 3)
  assert.deepEqual(
    module.rotaryKilnData?.temperatureTrend.series.map((series) => series.data.length),
    [24, 24, 24],
  )
  assert.equal(module.rotaryKilnData?.alarms.length, 3)
  assert.equal(module.rotaryKilnData?.health.length, 5)
})

test('renders the kiln panel as a standalone, information-dense viewport', async () => {
  const module = await import('../src/components/RotaryKilnDashboard.js').catch(() => ({}))

  assert.equal(typeof module.RotaryKilnDashboard, 'function', 'rotary kiln dashboard view is missing')

  const markup = renderToStaticMarkup(createElement(module.RotaryKilnDashboard))
  assert.match(markup, /class="rotary-kiln-dashboard(?:\s|")/)
  assert.match(markup, />回转窑运行监测</)
  assert.match(markup, />温度场监测</)
  assert.match(markup, />燃烧与供风</)
  assert.match(markup, />设备健康度</)
  assert.match(markup, /aria-label="回转窑温度与压力趋势"/)
  assert.match(markup, /aria-label="回转窑能耗趋势"/)
  assert.doesNotMatch(markup, /dashboard-shell|industrial-scene|<canvas/)
})

test('fits the hzy GLB into the kiln viewport without changing its proportions', async () => {
  const module = await import('../src/scene/rotaryKilnAsset.js').catch(() => ({}))

  assert.equal(module.ROTARY_KILN_MODEL_URL, '/models/hzy.glb')
  assert.equal(typeof module.prepareRotaryKilnModel, 'function', 'rotary kiln GLB preparation is missing')

  const root = new THREE.Group()
  root.add(new THREE.Mesh(new THREE.BoxGeometry(2, 4, 1), new THREE.MeshStandardMaterial()))
  const prepared = module.prepareRotaryKilnModel(root, { maxDimension: 6 })
  const bounds = new THREE.Box3().setFromObject(prepared)
  const size = bounds.getSize(new THREE.Vector3())
  const center = bounds.getCenter(new THREE.Vector3())

  assert.ok(Math.abs(Math.max(size.x, size.y, size.z) - 6) < 0.0001)
  assert.ok(center.length() < 0.0001)
  assert.equal(prepared.userData.assetSource, 'hzy-glb')
  assert.equal(prepared.children[0].castShadow, true)
})

test('mounts the hzy model viewport in place of the CSS kiln illustration', async () => {
  const { RotaryKilnDashboard } = await import('../src/components/RotaryKilnDashboard.js')
  const ModelStub = ({ modelUrl, ariaLabel }) => createElement('div', { className: 'model-stub', 'data-model-url': modelUrl, 'aria-label': ariaLabel })

  const markup = renderToStaticMarkup(createElement(RotaryKilnDashboard, { ModelComponent: ModelStub }))

  assert.match(markup, /data-model-url="\/models\/hzy\.glb"/)
  assert.match(markup, /aria-label="回转窑三维设备模型"/)
  assert.doesNotMatch(markup, /rk-kiln-machine|rk-kiln-segment/)
})
