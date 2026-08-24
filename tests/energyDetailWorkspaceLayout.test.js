import assert from 'node:assert/strict'
import test from 'node:test'

test('keeps the secondary campus viewport at homepage height with tabs above it', async () => {
  const module = await import('../src/energyDetailWorkspaceLayout.js').catch(() => ({}))
  assert.equal(typeof module.resolveEnergyDetailWorkspaceLayout, 'function', 'energy detail workspace layout resolver is missing')

  const layout = module.resolveEnergyDetailWorkspaceLayout()
  assert.deepEqual(layout.scene, { top: 153, height: 516, bottom: 669 })
  assert.deepEqual(layout.tabs, { top: 99, height: 44, bottom: 143 })
  assert.ok(layout.tabs.bottom < layout.scene.top)
})

test('stacks secondary data below the full-height campus without leaving the canvas', async () => {
  const module = await import('../src/energyDetailWorkspaceLayout.js').catch(() => ({}))
  assert.equal(typeof module.resolveEnergyDetailWorkspaceLayout, 'function', 'energy detail workspace layout resolver is missing')
  const { resolveEnergyDetailWorkspaceLayout } = module
  const layout = resolveEnergyDetailWorkspaceLayout()

  assert.equal(layout.metrics.top, layout.scene.bottom)
  assert.equal(layout.diagnostics.top, layout.metrics.bottom)
  assert.equal(layout.comparison, undefined)
  assert.ok(layout.footer.top >= layout.diagnostics.bottom)
  assert.equal(layout.footer.height, 245)
  assert.ok(layout.footer.bottom <= 1080)
})

test('aligns left and right analysis columns with the middle diagnostics baseline', async () => {
  const { resolveEnergyDetailWorkspaceLayout } = await import('../src/energyDetailWorkspaceLayout.js')
  const layout = resolveEnergyDetailWorkspaceLayout()

  assert.deepEqual(layout.leftZone, { top: 204, height: 611, bottom: 815 })
  assert.deepEqual(layout.rightZone, layout.leftZone)
  assert.equal(layout.leftZone.bottom, layout.diagnostics.bottom)
})

test('describes a proportional center backdrop instead of fixed side insets', async () => {
  const { resolveEnergyDetailWorkspaceLayout } = await import('../src/energyDetailWorkspaceLayout.js')
  const layout = resolveEnergyDetailWorkspaceLayout()

  assert.deepEqual(layout.centerBackdrop, { widthPercent: 57.2, height: 551 })
})

test('uses narrower secondary side rails and a wider campus workspace', async () => {
  const { resolveEnergyDetailWorkspaceLayout } = await import('../src/energyDetailWorkspaceLayout.js')
  const layout = resolveEnergyDetailWorkspaceLayout()

  assert.deepEqual(layout.horizontal, {
    sideWidth: 380,
    centerLeft: 399,
    centerWidth: 1066,
  })
})

test('keeps secondary scene controls in a compact bottom-right dock', async () => {
  const { resolveEnergyDetailWorkspaceLayout } = await import('../src/energyDetailWorkspaceLayout.js')
  const layout = resolveEnergyDetailWorkspaceLayout()

  assert.deepEqual(layout.sceneControls, {
    lightingRight: 76,
    lightingBottom: 16,
    resetRight: 16,
    resetBottom: 16,
    trafficRight: 16,
    trafficBottom: 88,
    hintLeft: 18,
    hintBottom: 18,
  })
})
