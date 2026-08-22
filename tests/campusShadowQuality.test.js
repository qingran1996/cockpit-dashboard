import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'

test('configures enlarged-campus key shadows with a stable soft-shadow budget', async () => {
  const module = await import('../src/scene/campusShadowQuality.js').catch(() => ({}))
  assert.equal(typeof module.configureCampusShadowQuality, 'function', 'campus shadow-quality helper is missing')

  const root = new THREE.Group()
  const key = new THREE.DirectionalLight()
  key.name = 'CampusKey'
  root.add(key)
  const renderer = { shadowMap: { enabled: false, type: null } }

  module.configureCampusShadowQuality({ renderer, root })

  assert.equal(renderer.shadowMap.enabled, true)
  assert.equal(renderer.shadowMap.type, THREE.PCFSoftShadowMap)
  assert.ok(key.shadow.mapSize.width >= 4096)
  assert.equal(key.shadow.mapSize.height, key.shadow.mapSize.width)
  assert.equal(key.shadow.camera.left, -44)
  assert.equal(key.shadow.camera.right, 44)
  assert.equal(key.shadow.camera.top, 44)
  assert.equal(key.shadow.camera.bottom, -44)
  assert.equal(key.shadow.camera.near, .5)
  assert.equal(key.shadow.camera.far, 110)
  const worldUnitsPerTexel = (key.shadow.camera.right - key.shadow.camera.left) / key.shadow.mapSize.width
  assert.ok(worldUnitsPerTexel <= .025, `shadow texel footprint is too coarse for stable roof edges: ${worldUnitsPerTexel}`)
  assert.ok(key.shadow.bias >= -.00025 && key.shadow.bias <= -.0001)
  assert.ok(key.shadow.normalBias >= .04 && key.shadow.normalBias <= .05)
})

test('makes buildings cast onto campus receivers while microdetails stay out of the caster pass', async () => {
  const module = await import('../src/scene/campusShadowQuality.js').catch(() => ({}))
  assert.equal(typeof module.configureCampusMeshShadows, 'function', 'campus mesh-shadow policy is missing')

  const building = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
  building.name = 'main-production-hall__wall-shell'
  building.userData.buildingId = 'main-production-hall'
  const ground = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
  ground.name = 'SITE__ground'
  ground.userData.layerRole = 'site-ground'
  const micro = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
  micro.name = 'SURFACE_DETAIL__main-production-hall__streak-01-front'
  micro.userData.buildingId = 'main-production-hall'
  micro.userData.layerRole = 'facade-rain-streak'
  micro.userData.detailTier = 'micro'
  const transparentFence = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial({ transparent: true, opacity: .14 }),
  )
  transparentFence.name = 'BASKET__fence-run-south'
  const alphaFoliage = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial({ alphaTest: .45 }),
  )
  alphaFoliage.name = 'LANDSCAPE__inner-tree-crown-01'
  alphaFoliage.userData.buildingId = 'administration'
  alphaFoliage.userData.vegetationTier = 'near'
  const root = new THREE.Group()
  root.add(building, ground, micro, transparentFence, alphaFoliage)

  module.configureCampusMeshShadows(root)

  assert.deepEqual([building.castShadow, building.receiveShadow], [true, true])
  assert.deepEqual([ground.castShadow, ground.receiveShadow], [false, true])
  assert.deepEqual([micro.castShadow, micro.receiveShadow], [false, true])
  assert.deepEqual([transparentFence.castShadow, transparentFence.receiveShadow], [false, true])
  assert.deepEqual([alphaFoliage.castShadow, alphaFoliage.receiveShadow], [false, true], 'foliage must not enter the expensive caster pass')
})
