import test from 'node:test'
import assert from 'node:assert/strict'

test('places one warm inspection rig above the focused floor and switches it off cleanly', async () => {
  const module = await import('../src/scene/floorInspectionLighting.js').catch(() => ({}))
  assert.equal(typeof module.createFloorInspectionLighting, 'function', 'inspection lighting factory is missing')

  const lighting = module.createFloorInspectionLighting()
  lighting.update([2, 1.8, -4], true)

  assert.equal(lighting.group.visible, true)
  assert.equal(lighting.key.color.getHex(), 0xffd7a0)
  assert.deepEqual(lighting.group.position.toArray(), [2, 2.45, -4])
  assert.equal(lighting.key.intensity, 2.2)
  assert.equal(lighting.fill.intensity, .65)

  lighting.update([0, 0, 0], false)
  assert.equal(lighting.group.visible, false)
  assert.equal(lighting.key.intensity, 0)
  assert.equal(lighting.fill.intensity, 0)
})
