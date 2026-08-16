import test from 'node:test'
import assert from 'node:assert/strict'
import { factoryCampusById, factoryCampusRegistry } from '../src/scene/factoryCampusRegistry.js'
import { createIndustrialScene } from '../src/scene/sceneFactory.js'

test('defines the reference factory campus landmarks', () => {
  assert.ok(factoryCampusRegistry.length >= 9)
  assert.equal(new Set(factoryCampusRegistry.map(({ id }) => id)).size, factoryCampusRegistry.length)
  const ids = new Set(factoryCampusRegistry.map(({ id }) => id))
  for (const id of ['main-production-hall', 'central-processing-hall', 'rear-high-bay', 'right-warehouse', 'right-utility', 'administration']) {
    assert.ok(ids.has(id), `missing ${id}`)
  }
})

test('every campus building has interaction and geometry data', () => {
  const roofTypes = new Set(['flat', 'shallow', 'stepped'])
  for (const record of factoryCampusRegistry) {
    assert.ok(record.id && record.name && record.type && record.status)
    assert.equal(record.position.length, 3)
    assert.equal(record.size.length, 3)
    assert.ok(record.size.every((value) => value > 0))
    assert.ok(record.levels >= 1)
    assert.ok(roofTypes.has(record.roofType))
    assert.ok(['cyan', 'blue', 'neutral'].includes(record.accent))
    assert.equal(factoryCampusById.get(record.id), record)
  }
})

test('industrial scene exposes only the reconstructed campus buildings', () => {
  const park = createIndustrialScene()
  try {
    assert.equal(park.interactiveObjects.length, factoryCampusRegistry.length)
    assert.deepEqual(
      new Set(park.interactiveObjects.map((object) => object.userData.buildingId)),
      new Set(factoryCampusRegistry.map(({ id }) => id)),
    )
  } finally {
    park.dispose()
  }
})
