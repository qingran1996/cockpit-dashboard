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

test('every building exposes ordered interactive floor-space metadata', () => {
  for (const record of buildingRegistry) {
    assert.ok(record.floors.length >= 2, `${record.id} must expose at least two levels`)
    assert.equal(new Set(record.floors.map(({ id }) => id)).size, record.floors.length)
    assert.deepEqual(
      record.floors.map(({ level }) => level),
      [...record.floors].map(({ level }) => level).sort((left, right) => left - right),
      `${record.id} levels must be ordered`,
    )
    for (const floor of record.floors) {
      assert.ok(floor.id && floor.name && floor.usage)
      assert.ok(['cyan', 'orange'].includes(floor.tone))
    }
  }

  assert.deepEqual(
    buildingById.get('administration').floors.map(({ id, name }) => ({ id, name })),
    [
      { id: 'L01', name: '一层接待服务区' },
      { id: 'L02', name: '二层综合办公区' },
      { id: 'L03', name: '三层会议指挥区' },
    ],
  )
})
