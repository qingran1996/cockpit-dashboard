import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import * as THREE from 'three'

test('creates a GLTFLoader for the September 6 campus GLB', async () => {
  const module = await import('../src/scene/plantV068Asset.js').catch(() => ({}))

  assert.equal(module.PLANT_V068_MODEL_URL, '/models/0906.glb')
  assert.equal(typeof module.createPlantV068Loader, 'function')
  const loader = module.createPlantV068Loader()
  assert.equal(loader.constructor.name, 'GLTFLoader')
  assert.ok(loader.meshoptDecoder, 'EXT_meshopt_compression requires a decoder')
  assert.equal(typeof loader.meshoptDecoder.decodeGltfBuffer, 'function')
})

test('preserves v068 Y-up coordinates, embedded PBR textures, and prepares practical shadows', async () => {
  const module = await import('../src/scene/plantV068Asset.js').catch(() => ({}))
  assert.equal(typeof module.preparePlantV068Model, 'function')
  const root = new THREE.Group()
  root.position.set(7, 3, -11)
  root.rotation.set(.1, .2, .3)
  const texture = new THREE.Texture()
  const opaqueMaterial = new THREE.MeshStandardMaterial({ map: texture })
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 12), opaqueMaterial)
  mesh.name = 'main-process-vessel'
  root.add(mesh)

  const prepared = module.preparePlantV068Model(root)

  assert.equal(prepared.root, root)
  assert.deepEqual(root.position.toArray(), [7, 3, -11])
  assert.deepEqual(root.rotation.toArray().slice(0, 3), [.1, .2, .3])
  assert.equal(mesh.material.map, texture, 'embedded WebP-backed textures must not be replaced')
  assert.equal(mesh.receiveShadow, true)
  assert.equal(mesh.castShadow, true)
  assert.equal(mesh.material.userData.environmentIntensityCap, .46)
  assert.equal(root.userData.assetSource, 'campus-lightweight-glb')
  assert.deepEqual(prepared.interactiveObjects, [])
  assert.deepEqual(prepared.animatedObjects, [])
})

test('loads the September 6 campus at its authored metre scale and coordinates', async () => {
  const module = await import('../src/scene/plantV068Asset.js').catch(() => ({}))
  assert.equal(typeof module.loadPlantV068Model, 'function')
  const root = new THREE.Group()
  root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()))
  const progress = []
  let requestedUrl = null
  const loader = {
    loadAsync: async (url, onProgress) => {
      requestedUrl = url
      onProgress({ loaded: 18, total: 72, lengthComputable: true })
      onProgress({ loaded: 72, total: 72, lengthComputable: true })
      return { scene: root }
    },
  }

  const prepared = await module.loadPlantV068Model({ loader, onProgress: (value) => progress.push(value) })

  assert.equal(requestedUrl, '/models/0906.glb')
  assert.deepEqual(progress, [25, 100])
  assert.equal(prepared.root, root)
  assert.deepEqual(root.scale.toArray(), [1, 1, 1])
  assert.deepEqual(root.position.toArray(), [0, 0, 0])
  assert.deepEqual(root.rotation.toArray().slice(0, 3), [0, 0, 0])
})

test('keeps tiled concrete ground behind overlays and out of the shadow caster pass', async () => {
  const module = await import('../src/scene/plantV068Asset.js').catch(() => ({}))
  const material = new THREE.MeshStandardMaterial()
  material.name = 'MI_Floor_Concrete_01a'
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), material)
  const root = new THREE.Group()
  root.add(floor)

  module.preparePlantV068Model(root)

  assert.equal(floor.receiveShadow, true)
  assert.equal(floor.castShadow, false)
  assert.equal(material.polygonOffset, true)
  assert.equal(material.polygonOffsetFactor, 1)
  assert.equal(material.polygonOffsetUnits, 1)
})

test('translates unsupported embedded WebP failures into an actionable message', async () => {
  const module = await import('../src/scene/plantV068Asset.js').catch(() => ({}))
  const loader = {
    loadAsync: async () => { throw new Error('THREE.GLTFLoader: WebP required by asset but unsupported.') },
  }

  await assert.rejects(
    () => module.loadPlantV068Model({ loader }),
    /浏览器不支持模型内嵌的 WebP 贴图/,
  )
})

test('ships the delivered September 6 campus binary as a valid GLB at the public route', async () => {
  const bytes = await readFile(new URL('../public/models/0906.glb', import.meta.url))

  assert.equal(bytes.toString('ascii', 0, 4), 'glTF')
  assert.equal(bytes.readUInt32LE(4), 2)
  assert.ok(bytes.byteLength > 80_000_000)
})
