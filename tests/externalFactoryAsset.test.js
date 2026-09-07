import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'

test('normalizes the Blender-exported 0827 FBX without applying the old CAD axis conversion', async () => {
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
  assert.ok(Math.abs(size.y - 40) < 1e-6)
  assert.ok(Math.abs(size.z - 20) < 1e-6)
  assert.ok(Math.abs(bounds.min.y) < 1e-6)
  assert.ok(Math.abs(center.x) < 1e-6)
  assert.ok(Math.abs(center.z) < 1e-6)
  assert.equal(prepared.root.userData.assetSource, 'external-fbx-0827')
  assert.deepEqual(prepared.interactiveObjects, [])
  assert.deepEqual(prepared.animatedObjects, [])
})

test('loads the 0827 FBX from the public model route', async () => {
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

  assert.equal(requestedUrl, '/models/0827.fbx')
  assert.equal(prepared.root, root)
})

test('creates an FBX loader for the 0827 factory asset', async () => {
  const { createExternalFactoryLoader } = await import('../src/scene/externalFactoryAsset.js')
  assert.equal(createExternalFactoryLoader().constructor.name, 'FBXLoader')
})

test('upgrades reviewed ART materials with deterministic Web PBR micro-surfaces', async () => {
  const { prepareExternalFactoryModel } = await import('../src/scene/externalFactoryAsset.js')
  const root = new THREE.Group()
  const galvanized = new THREE.MeshStandardMaterial({ name: 'ART__galvanized-steel' })
  const stainless = new THREE.MeshStandardMaterial({ name: 'ART__stainless-brushed' })
  const concrete = new THREE.MeshStandardMaterial({ name: 'ART__concrete-oil-stained' })
  root.add(
    new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), galvanized),
    new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), stainless),
    new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), concrete),
  )

  prepareExternalFactoryModel(root, { maxDimension: 10 })

  assert.equal(galvanized.metalness, 0.76)
  assert.equal(galvanized.roughness, 0.38)
  assert.equal(stainless.metalness, 0.88)
  assert.equal(stainless.roughness, 0.24)
  assert.equal(concrete.metalness, 0)
  assert.equal(concrete.roughness, 0.88)
  for (const material of [galvanized, stainless, concrete]) {
    assert.equal(material.roughnessMap?.isDataTexture, true)
    assert.equal(material.roughnessMap.wrapS, THREE.RepeatWrapping)
    assert.equal(material.roughnessMap.wrapT, THREE.RepeatWrapping)
    assert.equal(material.userData.industrialLookdevV4, true)
  }
  assert.notEqual(galvanized.roughnessMap, stainless.roughnessMap)
})

test('preserves Blender-exported PBR textures instead of replacing them with Web fallback noise', async () => {
  const { prepareExternalFactoryModel } = await import('../src/scene/externalFactoryAsset.js')
  const root = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({ name: 'ART__stainless-brushed' })
  const exportedBaseColor = new THREE.Texture()
  const exportedRoughness = new THREE.Texture()
  const exportedNormal = new THREE.Texture()
  material.map = exportedBaseColor
  material.roughnessMap = exportedRoughness
  material.normalMap = exportedNormal
  root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material))

  prepareExternalFactoryModel(root, { maxDimension: 10 })

  assert.equal(material.map, exportedBaseColor)
  assert.equal(material.roughnessMap, exportedRoughness)
  assert.equal(material.normalMap, exportedNormal)
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
  const groundMaterial = new THREE.MeshStandardMaterial({ name: 'ART__concrete-oil-stained' })
  const reviewedGround = new THREE.Mesh(new THREE.BoxGeometry(260, 260, 1), groundMaterial)
  reviewedGround.name = 'ART__industrial-ground'
  root.add(assembly, support, datumPlane, envelope, reviewedGround)

  const prepared = prepareExternalFactoryModel(root, { maxDimension: 44 })

  assert.equal(datumPlane.visible, false)
  assert.equal(envelope.visible, false)
  assert.equal(assembly.visible, true)
  assert.equal(support.visible, true)
  assert.equal(reviewedGround.visible, true)
  assert.deepEqual(prepared.root.userData.presentationHiddenObjects.sort(), ['datum-plane', 'envelope'])

  const bounds = new THREE.Box3()
  for (const mesh of [assembly, support, reviewedGround]) bounds.expandByObject(mesh)
  const size = bounds.getSize(new THREE.Vector3())
  assert.ok(Math.abs(Math.max(size.x, size.y, size.z) - 44) < 1e-6)
})

test('hides the Blender helper Cube bundled in the 0827 FBX presentation', async () => {
  const { prepareExternalFactoryModel } = await import('../src/scene/externalFactoryAsset.js')
  const root = new THREE.Group()
  const assembly = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 8), new THREE.MeshStandardMaterial())
  assembly.name = 'assembly'
  const exportCollection = new THREE.Group()
  const helperCube = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), new THREE.MeshStandardMaterial())
  helperCube.name = 'Cube'
  helperCube.position.set(0, 0, -100)
  exportCollection.add(helperCube)
  root.add(assembly, exportCollection)

  const prepared = prepareExternalFactoryModel(root, { maxDimension: 40 })
  const bounds = new THREE.Box3().setFromObject(assembly)
  const size = bounds.getSize(new THREE.Vector3())

  assert.equal(helperCube.visible, false)
  assert.ok(prepared.root.userData.presentationHiddenObjects.includes('Cube'))
  assert.ok(Math.abs(Math.max(size.x, size.y, size.z) - 40) < 1e-6)
})

test('keeps ordinary thin factory platforms from the 0827 FBX visible', async () => {
  const { prepareExternalFactoryModel } = await import('../src/scene/externalFactoryAsset.js')
  const root = new THREE.Group()
  const assembly = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 8), new THREE.MeshStandardMaterial())
  assembly.name = 'assembly'
  const platform = new THREE.Mesh(new THREE.BoxGeometry(18, 12, 0.2), new THREE.MeshStandardMaterial())
  platform.name = 'platform-steel-plate'
  root.add(assembly, platform)

  prepareExternalFactoryModel(root, { maxDimension: 40 })

  assert.equal(platform.visible, true)
})

test('converts every 0827 FBX material family into a valid PBR surface', async () => {
  const { prepareExternalFactoryModel } = await import('../src/scene/externalFactoryAsset.js')
  const expected = [
    ['V2_BeadBlasted_Steel', 0x747d80, 0.72, 0.58],
    ['V2_Polished_Process_Pipe', 0xa6adb0, 0.9, 0.24],
    ['V2_Satin_Process_Equipment', 0x858e91, 0.78, 0.4],
    ['V2_Safety_Gold', 0xd99108, 0.08, 0.5],
    ['DT_Safety_Yellow', 0xeda30b, 0.05, 0.54],
    ['V2_Deep_Teal_Powdercoat', 0x0d5555, 0.1, 0.52],
    ['V2_Warm_Grey_Enclosure', 0x89867f, 0.08, 0.6],
    ['V2_Dark_AntiSlip_Deck', 0x343a3d, 0.28, 0.8],
    ['DT_Epoxy_Floor', 0x666762, 0, 0.84],
    ['V2_Emergency_Red', 0x98150f, 0.04, 0.48],
  ]
  const root = new THREE.Group()
  const meshes = expected.map(([name], index) => {
    const material = new THREE.MeshPhongMaterial({ name })
    material.map = new THREE.Texture()
    material.normalMap = new THREE.Texture()
    material.map.image = { complete: true, naturalWidth: 0, naturalHeight: 0 }
    material.normalMap.image = { complete: true, naturalWidth: 0, naturalHeight: 0 }
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material)
    mesh.name = `equipment-${index}`
    mesh.position.x = index * 2
    root.add(mesh)
    return mesh
  })

  prepareExternalFactoryModel(root, { maxDimension: 20 })

  expected.forEach(([name, color, metalness, roughness], index) => {
    const material = meshes[index].material
    assert.equal(material.type, 'MeshStandardMaterial', name)
    assert.equal(material.name, name)
    assert.equal(material.color.getHex(), color)
    assert.equal(material.metalness, metalness)
    assert.equal(material.roughness, roughness)
    assert.equal(material.map, null, `${name} must discard an image-less base-color map`)
    assert.equal(material.normalMap, null, `${name} must discard an image-less normal map`)
    assert.equal(material.roughnessMap?.isDataTexture, true)
    assert.equal(material.userData.externalFbxPbr, true)
  })
})
