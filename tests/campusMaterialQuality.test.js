import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'

function texturedMaterial(name, options = {}) {
  const material = new THREE.MeshStandardMaterial(options)
  material.name = name
  material.map = new THREE.Texture()
  material.normalMap = new THREE.Texture()
  material.roughnessMap = new THREE.Texture()
  material.aoMap = new THREE.Texture()
  return material
}

test('normalizes PBR texture color spaces anisotropy and reflection ranges by material role', async () => {
  const module = await import('../src/scene/campusMaterialQuality.js').catch(() => ({}))
  assert.equal(typeof module.applyCampusMaterialQuality, 'function', 'campus material-quality applicator is missing')

  const facade = texturedMaterial('MAT__industrial-coated-metal')
  const ground = texturedMaterial('MAT__asphalt')
  const metal = texturedMaterial('MAT__pipe-structure', { metalness: .72 })
  const interior = texturedMaterial('MAT__interior-storage')
  const glass = new THREE.MeshPhysicalMaterial({ transmission: .52, transparent: true, opacity: .78 })
  glass.name = 'MAT__admin-glass'
  const root = new THREE.Group()
  for (const [name, material] of [['facade', facade], ['ground', ground], ['metal', metal], ['glass', glass], ['interior', interior]]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), material)
    mesh.name = name
    if (name === 'facade') mesh.userData.buildingId = 'main-production-hall'
    if (name === 'ground') mesh.userData.groundMaterialRole = 'new-asphalt'
    root.add(mesh)
  }
  const renderer = { capabilities: { getMaxAnisotropy: () => 16 } }

  const summary = module.applyCampusMaterialQuality({ root, renderer })

  assert.equal(summary.maximumAnisotropy, 8)
  assert.equal(facade.map.colorSpace, THREE.SRGBColorSpace)
  for (const texture of [facade.normalMap, facade.roughnessMap, facade.aoMap]) {
    assert.equal(texture.colorSpace, THREE.NoColorSpace)
    assert.equal(texture.anisotropy, 8)
    assert.equal(texture.minFilter, THREE.LinearMipmapLinearFilter, 'PBR data textures need trilinear minification to suppress moire')
    assert.equal(texture.magFilter, THREE.LinearFilter)
    assert.equal(texture.generateMipmaps, true)
  }
  assert.equal(ground.map.anisotropy, 8, 'oblique ground textures need maximum bounded anisotropy')
  assert.ok(facade.envMapIntensity >= .55 && facade.envMapIntensity <= .9)
  assert.ok(glass.envMapIntensity > facade.envMapIntensity)
  assert.ok(metal.envMapIntensity > facade.envMapIntensity)
  assert.ok(facade.aoMapIntensity >= .65 && facade.aoMapIntensity <= .9)
  assert.ok(interior.envMapIntensity <= .42, 'interior furniture must not receive exterior-strength reflections')
  assert.ok(interior.aoMapIntensity >= .82, 'interior furniture needs stronger contact separation')
})

test('keeps construction detail near the campus and degrades deterministically with distance', async () => {
  const module = await import('../src/scene/campusMaterialQuality.js').catch(() => ({}))
  assert.equal(typeof module.deriveCampusDistanceQuality, 'function', 'distance quality policy is missing')
  assert.equal(typeof module.applyCampusDistanceQuality, 'function', 'distance quality applicator is missing')

  assert.deepEqual(module.deriveCampusDistanceQuality(54, false), {
    tier: 'high', microdetails: true, branchStructure: true, postProcessing: true, anisotropy: 8,
  })
  assert.deepEqual(module.deriveCampusDistanceQuality(102, false), {
    tier: 'balanced', microdetails: false, branchStructure: true, postProcessing: true, anisotropy: 4,
  })
  assert.deepEqual(module.deriveCampusDistanceQuality(54, true), {
    tier: 'performance', microdetails: false, branchStructure: false, postProcessing: false, anisotropy: 2,
  })

  const root = new THREE.Group()
  const micro = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
  micro.userData.detailTier = 'micro'
  micro.material.map = new THREE.Texture()
  micro.material.map.anisotropy = 8
  const branch = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
  branch.userData.vegetationDetail = 'branch-structure'
  const crown = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
  crown.userData.vegetationTier = 'near'
  root.add(micro, branch, crown)

  module.applyCampusDistanceQuality(root, module.deriveCampusDistanceQuality(102, false))
  assert.equal(micro.visible, false)
  assert.equal(micro.material.map.anisotropy, 4)
  assert.equal(branch.visible, true)
  assert.equal(crown.visible, true, 'distance policy must never remove the actual tree crown')

  module.applyCampusDistanceQuality(root, module.deriveCampusDistanceQuality(54, false))
  assert.equal(micro.visible, true, 'returning to campus focus must restore construction microdetail')
  assert.equal(micro.material.map.anisotropy, 8, 'returning to focus must restore authored anisotropy')
  assert.equal(branch.visible, true)

  module.applyCampusDistanceQuality(root, module.deriveCampusDistanceQuality(54, true))
  assert.equal(branch.visible, false)
  assert.equal(crown.visible, true)
})

test('updates the live quality tier only when the camera crosses a distance boundary', async () => {
  const module = await import('../src/scene/campusMaterialQuality.js').catch(() => ({}))
  assert.equal(typeof module.createCampusQualityController, 'function', 'live quality controller is missing')
  const root = new THREE.Group()
  const micro = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
  micro.userData.detailTier = 'micro'
  root.add(micro)
  const camera = new THREE.PerspectiveCamera()
  const target = new THREE.Vector3()
  camera.position.set(0, 0, 102)
  const controller = module.createCampusQualityController({ root, camera, target, reducedMotion: false })

  assert.equal(controller.update().tier, 'balanced')
  assert.equal(micro.visible, false)
  camera.position.z = 54
  assert.equal(controller.update().tier, 'high')
  assert.equal(micro.visible, true)
  assert.equal(controller.currentTier, 'high')
  const lateMicro = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
  lateMicro.userData.detailTier = 'micro'
  root.add(lateMicro)
  camera.position.z = 102
  controller.refresh()
  assert.equal(lateMicro.visible, false, 'a newly loaded GLB must receive the current distance policy')
})

test('maps camera distance to explicit near mid and far visibility tiers', async () => {
  const module = await import('../src/scene/campusMaterialQuality.js').catch(() => ({}))
  assert.equal(typeof module.resolveCampusVisibilityTier, 'function', 'visibility-tier resolver is missing')

  assert.equal(module.resolveCampusVisibilityTier(54, false), 'near')
  assert.equal(module.resolveCampusVisibilityTier(102, false), 'mid')
  assert.equal(module.resolveCampusVisibilityTier(140, false), 'far')
  assert.equal(module.resolveCampusVisibilityTier(140, true), 'near')

  const root = new THREE.Group()
  const near = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
  near.userData.visibilityTier = 'near'
  const mid = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
  mid.userData.visibilityTier = 'mid'
  const far = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
  far.userData.visibilityTier = 'far'
  root.add(near, mid, far)

  module.applyCampusDistanceQuality(root, module.deriveCampusDistanceQuality(102, false))
  assert.equal(near.visible, false)
  assert.equal(mid.visible, true)
  assert.equal(far.visible, true)

  module.applyCampusDistanceQuality(root, module.deriveCampusDistanceQuality(54, false))
  assert.equal(near.visible, true)
  assert.equal(mid.visible, true)
  assert.equal(far.visible, true)
})
