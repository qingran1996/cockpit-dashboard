import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { buildingRegistry } from '../src/scene/buildingRegistry.js'
import { createIndustrialScene } from '../src/scene/sceneFactory.js'

function makeLoadedCampus() {
  const root = new THREE.Group()
  root.name = 'FactoryCampusGraybox'
  const building = new THREE.Group()
  building.name = 'BLDG__main-production-hall'
  building.userData.buildingId = 'main-production-hall'
  building.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()))
  const shuttle = new THREE.Group()
  shuttle.name = 'VEHICLE__gate-shuttle__root'
  root.add(building, shuttle)
  return { root, interactiveObjects: [building], animatedObjects: [{ kind: 'vehicle', object: shuttle, motionPath: 'gate-lane', distance: 10, speed: .09 }] }
}

test('uses a shadowless directional fill from the opposite side of the key light', () => {
  const park = createIndustrialScene({ loadCampus: async () => makeLoadedCampus() })
  const key = park.root.getObjectByName('CampusKey')
  const fill = park.root.getObjectByName('CampusShadowFill')
  const facadeAmbient = park.root.getObjectByName('CampusFacadeAmbient')

  assert.ok(key?.isDirectionalLight)
  assert.ok(fill?.isDirectionalLight)
  assert.ok(key.position.x * fill.position.x + key.position.z * fill.position.z < 0, `fill must oppose the key horizontally: key=${key.position.toArray()} fill=${fill.position.toArray()}`)
  assert.ok(fill.position.y > 0, 'fill must continue illuminating downward from above the campus')
  assert.equal(fill.castShadow, false)
  assert.ok(facadeAmbient?.isAmbientLight, 'campus needs an orientation-independent PBR facade fill')
  park.dispose()
})

test('replaces the procedural fallback only after a campus GLB resolves', async () => {
  const loaded = makeLoadedCampus()
  const park = createIndustrialScene({ loadCampus: async () => loaded })
  const interactiveReference = park.interactiveObjects

  assert.ok(park.root.getObjectByName('ProceduralFallback'))
  assert.equal(park.interactiveObjects.length, buildingRegistry.length)
  for (const building of park.interactiveObjects) {
    const record = buildingRegistry.find(({ id }) => id === building.userData.buildingId)
    assert.equal(building.userData.floorRoots.length, record.floors.length)
    assert.ok(building.userData.floorRoots.every(({ visible }) => visible === false))
  }

  const result = await park.ready

  assert.deepEqual(result, { source: 'glb' })
  assert.equal(park.root.getObjectByName('ProceduralFallback'), undefined)
  assert.equal(park.root.getObjectByName('FactoryCampusGraybox'), loaded.root)
  assert.equal(park.interactiveObjects, interactiveReference)
  assert.deepEqual(park.interactiveObjects, loaded.interactiveObjects)
  assert.equal(park.animated.length, 1)
  assert.equal(park.animated[0].kind, 'vehicle')
  assert.equal(park.animated[0].object, loaded.animatedObjects[0].object)
  park.dispose()
})

test('keeps the procedural fallback when campus loading fails', async () => {
  const failure = new Error('asset unavailable')
  const park = createIndustrialScene({ loadCampus: async () => { throw failure } })

  const result = await park.ready

  assert.equal(result.source, 'fallback')
  assert.equal(result.error, failure)
  assert.ok(park.root.getObjectByName('ProceduralFallback'))
  assert.equal(park.interactiveObjects.length, buildingRegistry.length)
  park.dispose()
})
