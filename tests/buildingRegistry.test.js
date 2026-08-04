import test from 'node:test'
import assert from 'node:assert/strict'
import { buildingById, buildingRegistry } from '../src/scene/buildingRegistry.js'

test('defines a complete industrial park', () => {
  assert.ok(buildingRegistry.length >= 12)
  assert.equal(new Set(buildingRegistry.map(({ id }) => id)).size, buildingRegistry.length)
  assert.ok(buildingRegistry.some(({ tone }) => tone === 'cyan'))
  assert.ok(buildingRegistry.some(({ tone }) => tone === 'orange'))
})

test('every building has interaction data and a known model', () => {
  const models = new Set(['tank', 'waterTower', 'factory', 'chimney', 'office', 'controlCenter'])
  for (const record of buildingRegistry) {
    assert.ok(record.id && record.name && record.type && record.status)
    assert.equal(record.position.length, 3)
    assert.ok(models.has(record.model))
    assert.equal(buildingById.get(record.id), record)
  }
})
