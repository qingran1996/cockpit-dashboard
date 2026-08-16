import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {
  factoryCampusById,
  factoryCampusReferenceFrame,
  factoryCampusRegistry,
} from '../src/scene/factoryCampusRegistry.js'
import { createIndustrialScene } from '../src/scene/sceneFactory.js'
import { factoryCampusInitialView } from '../src/scene/sceneMath.js'

test('defines the reference factory campus landmarks', () => {
  assert.equal(factoryCampusRegistry.length, 12)
  assert.equal(new Set(factoryCampusRegistry.map(({ id }) => id)).size, factoryCampusRegistry.length)
  const ids = new Set(factoryCampusRegistry.map(({ id }) => id))
  for (const id of [
    'main-production-hall',
    'central-processing-hall',
    'rear-high-bay',
    'north-east-workshop',
    'right-warehouse',
    'right-utility',
    'front-utility-annex',
    'administration',
    'gatehouse',
  ]) {
    assert.ok(ids.has(id), `missing ${id}`)
  }
})

test('campus landmarks preserve the reference front-to-back hierarchy', () => {
  const main = factoryCampusById.get('main-production-hall')
  const central = factoryCampusById.get('central-processing-hall')
  const rear = factoryCampusById.get('rear-high-bay')
  const front = factoryCampusById.get('front-warehouse')
  const admin = factoryCampusById.get('administration')
  const gatehouse = factoryCampusById.get('gatehouse')

  assert.ok(rear.position[2] < central.position[2])
  assert.ok(central.position[2] < main.position[2])
  assert.ok(main.position[2] < front.position[2])
  assert.ok(front.position[2] < admin.position[2])
  assert.ok(main.size[0] >= 13 && main.position[0] < -6)
  assert.ok(gatehouse.position[0] < admin.position[0] && gatehouse.position[2] > admin.position[2])

  const mainToCentralGap = (main.position[2] - main.size[2] / 2)
    - (central.position[2] + central.size[2] / 2)
  const centralToRearGap = (central.position[2] - central.size[2] / 2)
    - (rear.position[2] + rear.size[2] / 2)
  assert.ok(mainToCentralGap >= .8)
  assert.ok(centralToRearGap >= .5)
})

test('east-side buildings form four separated depth bands', () => {
  const ids = ['north-east-workshop', 'east-process-hall', 'right-warehouse', 'front-utility-annex']
  const buildings = ids.map((id) => factoryCampusById.get(id))
  assert.ok(buildings.every((building) => building.position[0] > 5))
  const depths = buildings.map((building) => building.position[2]).sort((a, b) => a - b)
  assert.ok(depths[1] - depths[0] >= 2)
  assert.ok(depths[2] - depths[1] >= 2)
  assert.ok(depths[3] - depths[2] >= 2)
})

test('independent building footprints do not overlap', () => {
  for (let leftIndex = 0; leftIndex < factoryCampusRegistry.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < factoryCampusRegistry.length; rightIndex += 1) {
      const left = factoryCampusRegistry[leftIndex]
      const right = factoryCampusRegistry[rightIndex]
      const overlapX = Math.min(
        left.position[0] + left.size[0] / 2,
        right.position[0] + right.size[0] / 2,
      ) - Math.max(
        left.position[0] - left.size[0] / 2,
        right.position[0] - right.size[0] / 2,
      )
      const overlapZ = Math.min(
        left.position[2] + left.size[2] / 2,
        right.position[2] + right.size[2] / 2,
      ) - Math.max(
        left.position[2] - left.size[2] / 2,
        right.position[2] - right.size[2] / 2,
      )
      assert.ok(
        overlapX <= .05 || overlapZ <= .05,
        `${left.id} overlaps ${right.id}`,
      )
    }
  }
})

test('roof centres project onto the measured reference-image landmarks', () => {
  const { width, height, roofCenters, tolerancePixels } = factoryCampusReferenceFrame
  const camera = new THREE.PerspectiveCamera(factoryCampusInitialView.fov, width / height, .1, 120)
  camera.position.set(...factoryCampusInitialView.position)
  camera.lookAt(...factoryCampusInitialView.target)
  camera.updateMatrixWorld()
  camera.updateProjectionMatrix()

  for (const building of factoryCampusRegistry) {
    const projected = new THREE.Vector3(
      building.position[0],
      building.size[1] + .1 - 1.2,
      building.position[2],
    ).project(camera)
    const pixel = [
      (projected.x + 1) * width / 2,
      (1 - projected.y) * height / 2,
    ]
    const target = roofCenters[building.id]
    assert.ok(target, `missing measured roof centre for ${building.id}`)
    assert.ok(
      Math.hypot(pixel[0] - target[0], pixel[1] - target[1]) <= tolerancePixels,
      `${building.id} projects to ${pixel.map(Math.round)} instead of ${target}`,
    )
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
