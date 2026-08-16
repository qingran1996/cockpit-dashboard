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

test('industrial scene exposes a shared clickable and explodable part runtime', () => {
  const park = createIndustrialScene()
  try {
    const runtime = park.root.userData.sculptRuntime
    const requiredSystems = ['road-system', 'sports-system', 'pipe-rack-system', 'parking-system', 'landscape-system', 'perimeter-system']
    assert.equal(runtime.parts.length, factoryCampusRegistry.length + requiredSystems.length)
    assert.ok(runtime.parts.every(({ node }) => node))
    assert.ok(factoryCampusRegistry.every(({ id }) => runtime.nodes[id].userData.explodable))
    requiredSystems.forEach((id) => {
      const system = runtime.parts.find((part) => part.id === id)
      assert.ok(system, `missing runtime system ${id}`)
      assert.equal(system.selectable, false)
      assert.equal(system.explodable, false)
    })

    const first = runtime.nodes[factoryCampusRegistry[0].id]
    const base = first.position.clone()
    runtime.setExploded(1.25)
    assert.ok(first.position.distanceTo(base) > 0)
    runtime.resetExplosion()
    assert.ok(first.position.distanceTo(base) < 1e-9)
  } finally {
    park.dispose()
  }
})

test('industrial scene disposes unused per-building material clones', () => {
  const park = createIndustrialScene()
  const unusedMaterial = park.root.userData.sculptRuntime.nodes[
    factoryCampusRegistry[0].id
  ].userData.materialLibrary.adminStone
  let disposeCalls = 0
  unusedMaterial.dispose = () => { disposeCalls += 1 }

  park.dispose()
  assert.equal(disposeCalls, 1)
})
