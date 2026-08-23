import test from 'node:test'
import assert from 'node:assert/strict'
import { buildingById, buildingRegistry, campusPlan } from '../src/scene/buildingRegistry.js'

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

test('hero building records declare matching functional identities', () => {
  const expected = new Map([
    ['administration', ['administration-arrival', 'administration', 'hero']],
    ['main-production-hall', ['production-monitor', 'production', 'hero']],
    ['front-warehouse', ['warehouse-logistics', 'warehouse', 'primary']],
    ['far-east-utility', ['utility-process', 'utilities', 'primary']],
  ])

  for (const record of buildingRegistry) {
    assert.ok(record.identityRole, `${record.id} must declare an identity role`)
    assert.ok(record.functionalZone, `${record.id} must declare a functional zone`)
    assert.ok(['hero', 'primary', 'supporting'].includes(record.identityTier), `${record.id} has an invalid identity tier`)
  }
  for (const [id, [identityRole, functionalZone, identityTier]] of expected) {
    const record = buildingById.get(id)
    assert.deepEqual(
      [record.identityRole, record.functionalZone, record.identityTier],
      [identityRole, functionalZone, identityTier],
      `${id} identity metadata does not match its Blender silhouette contract`,
    )
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

test('key campus buildings use credible vertical floor scale', () => {
  assert.ok(buildingById.get('administration').size[1] / 3 >= 1.35)
  assert.ok(buildingById.get('laboratory').size[1] / 3 >= 1.15)
  assert.ok(buildingById.get('rear-high-bay').size[1] >= 5)
  assert.ok(buildingById.get('gatehouse').size[1] >= 1.65)
})

test('campus plan doubles the footprint and supports larger landmark buildings', () => {
  assert.ok(campusPlan.width * campusPlan.depth >= 58 * 42 * 1.98)
  assert.equal(campusPlan.scale, Math.SQRT2)
  assert.deepEqual(buildingById.get('main-production-hall').size, [16.8, 3.8, 7])
  assert.deepEqual(buildingById.get('administration').size, [8.4, 6.2, 5.4])
  assert.ok(buildingById.get('administration').position[0] >= 13.4)
  assert.ok(buildingById.get('rear-high-bay').position[2] >= 18.3)
})

test('doubled site is occupied by visibly larger building footprints', () => {
  const previousFootprints = new Map([
    ['central-processing-hall', 11.5 * 4.5],
    ['rear-high-bay', 9.5 * 4],
    ['east-process-hall', 6 * 3.6],
    ['east-warehouse', 7 * 4],
    ['front-warehouse', 7.2 * 3],
    ['laboratory', 3.2 * 1.8],
  ])
  for (const [id, oldArea] of previousFootprints) {
    const [width, , depth] = buildingById.get(id).size
    assert.ok(width * depth >= oldArea * 1.22, `${id} needs at least 22% more footprint presence`)
  }
})
