import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'

test('normalizes the supplied FBX assembly into the campus viewport', async () => {
  const module = await import('../src/scene/externalFactoryAsset.js').catch(() => ({}))
  assert.equal(typeof module.prepareExternalFactoryModel, 'function', 'external FBX preparation is missing')

  const root = new THREE.Group()
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 40, 20), new THREE.MeshStandardMaterial())
  mesh.position.set(100, 20, -50)
  root.add(mesh)

  const prepared = module.prepareExternalFactoryModel(root, { maxDimension: 40 })
  const bounds = new THREE.Box3().setFromObject(prepared.root)
  const size = bounds.getSize(new THREE.Vector3())
  const center = bounds.getCenter(new THREE.Vector3())

  assert.ok(Math.abs(Math.max(size.x, size.y, size.z) - 40) < 1e-6)
  assert.ok(Math.abs(size.x - 10) < 1e-6)
  assert.ok(Math.abs(size.y - 20) < 1e-6)
  assert.ok(Math.abs(size.z - 40) < 1e-6)
  assert.ok(Math.abs(bounds.min.y) < 1e-6)
  assert.ok(Math.abs(center.x) < 1e-6)
  assert.ok(Math.abs(center.z) < 1e-6)
  assert.equal(prepared.root.userData.assetSource, 'external-fbx-20260824')
  assert.deepEqual(prepared.interactiveObjects, [])
  assert.deepEqual(prepared.animatedObjects, [])
})

test('loads the new branch FBX from the public model route', async () => {
  const module = await import('../src/scene/externalFactoryAsset.js').catch(() => ({}))
  assert.equal(typeof module.loadExternalFactoryModel, 'function', 'external FBX loader is missing')
  let requestedUrl = null
  const root = new THREE.Group()
  root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()))

  const prepared = await module.loadExternalFactoryModel({
    loadAsync: async (url) => {
      requestedUrl = url
      return root
    },
  })

  assert.equal(requestedUrl, '/models/20260824.fbx')
  assert.equal(prepared.root, root)
})

test('excludes oversized CAD envelope and datum plane from presentation framing', async () => {
  const { prepareExternalFactoryModel } = await import('../src/scene/externalFactoryAsset.js')
  const root = new THREE.Group()
  const assembly = new THREE.Mesh(new THREE.BoxGeometry(100, 220, 80), new THREE.MeshStandardMaterial())
  assembly.name = 'assembly'
  const support = new THREE.Mesh(new THREE.BoxGeometry(80, 180, 60), new THREE.MeshStandardMaterial())
  support.name = 'support'
  const datumPlane = new THREE.Mesh(new THREE.BoxGeometry(900, 900, 1), new THREE.MeshStandardMaterial())
  datumPlane.name = 'datum-plane'
  const envelope = new THREE.Mesh(new THREE.BoxGeometry(1000, 1000, 1000), new THREE.MeshStandardMaterial())
  envelope.name = 'envelope'
  root.add(assembly, support, datumPlane, envelope)

  const prepared = prepareExternalFactoryModel(root, { maxDimension: 44 })

  assert.equal(datumPlane.visible, false)
  assert.equal(envelope.visible, false)
  assert.equal(assembly.visible, true)
  assert.equal(support.visible, true)
  assert.deepEqual(prepared.root.userData.presentationHiddenObjects.sort(), ['datum-plane', 'envelope'])

  const bounds = new THREE.Box3()
  for (const mesh of [assembly, support]) bounds.expandByObject(mesh)
  const size = bounds.getSize(new THREE.Vector3())
  assert.ok(Math.abs(Math.max(size.x, size.y, size.z) - 44) < 1e-6)
})
