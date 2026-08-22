import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { buildingById } from '../src/scene/buildingRegistry.js'

test('renders a building-aware embedded PBR sample board with real commissioning controls', async () => {
  const componentModule = await import('../src/components/BuildingMaterialLab.js').catch(() => ({}))
  const materialModule = await import('../src/scene/campusMaterialLab.js')
  assert.equal(typeof componentModule.BuildingMaterialLab, 'function', 'building material laboratory is missing')

  const building = buildingById.get('administration')
  const settings = materialModule.createBuildingMaterialSettings(building)
  const markup = renderToStaticMarkup(createElement(componentModule.BuildingMaterialLab, {
    building,
    scope: 'facade',
    settings: settings.facade,
    onScopeChange: () => {},
    onFamilyChange: () => {},
    onParameterChange: () => {},
    onReset: () => {},
    onBack: () => {},
  }))

  assert.match(markup, /aria-label="建筑材质实验室"/)
  assert.match(markup, /综合管理中心/)
  assert.match(markup, /GLB EMBEDDED PBR/)
  assert.match(markup, /role="tablist"/)
  assert.match(markup, /墙面/)
  assert.match(markup, /屋面/)
  assert.match(markup, /勒脚/)
  assert.match(markup, /涂层金属板/)
  assert.match(markup, /仓库夹芯板/)
  assert.match(markup, /浅色石灰石/)
  assert.match(markup, /建筑混凝土/)
  assert.doesNotMatch(markup, /镀锌屋面板/, 'facade scope must hide roof-only materials')
  assert.match(markup, /Base Color/)
  assert.match(markup, /Normal/)
  assert.match(markup, /Roughness/)
  assert.match(markup, /AO/)
  assert.match(markup, /aria-label="材质色调"/)
  assert.match(markup, /aria-label="粗糙度"/)
  assert.match(markup, /aria-label="法线强度"/)
  assert.match(markup, /aria-label="AO 强度"/)
  assert.match(markup, /aria-label="纹理缩放"/)
  assert.match(markup, /aria-label="局部环境反射"/)
  assert.match(markup, /恢复墙面原材质/)
  assert.match(markup, /返回空间面板/)
})

test('shows only construction-compatible roof samples', async () => {
  const componentModule = await import('../src/components/BuildingMaterialLab.js').catch(() => ({}))
  const materialModule = await import('../src/scene/campusMaterialLab.js')
  const building = buildingById.get('main-production-hall')
  const markup = renderToStaticMarkup(createElement(componentModule.BuildingMaterialLab, {
    building,
    scope: 'roof',
    settings: materialModule.createBuildingMaterialSettings(building).roof,
  }))
  assert.match(markup, /镀锌屋面板/)
  assert.match(markup, /涂层金属板/)
  assert.doesNotMatch(markup, /仓库夹芯板/)
  assert.doesNotMatch(markup, /建筑混凝土/)
})
