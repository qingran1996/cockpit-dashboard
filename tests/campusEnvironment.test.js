import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'

test('installs an image-based lighting texture without replacing the architectural sky', async () => {
  const module = await import('../src/scene/campusEnvironment.js').catch(() => ({}))
  assert.equal(typeof module.installCampusEnvironment, 'function', 'campus environment installer is missing')

  const scene = new THREE.Scene()
  const sky = new THREE.Color(0x7299a8)
  const environment = new THREE.Texture()
  scene.background = sky

  module.installCampusEnvironment(scene, environment)

  assert.equal(scene.environment, environment)
  assert.equal(scene.background, sky, 'IBL must not replace the approved visible blue-gray sky')
  assert.equal(environment.mapping, THREE.CubeUVReflectionMapping)
  assert.equal(scene.userData.campusEnvironment.source, 'pmrem')
  assert.equal(scene.userData.campusEnvironment.textureUuid, environment.uuid)
  assert.ok(scene.environmentIntensity >= .55 && scene.environmentIntensity <= .9)
})

test('derives separate restrained day and evening reflection policies', async () => {
  const module = await import('../src/scene/campusEnvironment.js').catch(() => ({}))
  assert.equal(typeof module.deriveCampusEnvironmentPolicy, 'function', 'environment reflection policy is missing')
  assert.deepEqual(module.deriveCampusEnvironmentPolicy('day'), { intensity: .78, rotation: .12 })
  assert.deepEqual(module.deriveCampusEnvironmentPolicy('evening'), { intensity: .38, rotation: -.08 })
})

test('keeps the landscaped horizon readable in day and evening modes', async () => {
  const module = await import('../src/scene/campusEnvironment.js').catch(() => ({}))
  assert.equal(typeof module.deriveCampusLandscapePolicy, 'function', 'landscape presentation policy is missing')

  assert.deepEqual(module.deriveCampusLandscapePolicy('day'), {
    horizonLift: .18,
    groundSeparation: .16,
    vegetationLift: .1,
  })
  assert.deepEqual(module.deriveCampusLandscapePolicy('evening'), {
    horizonLift: .1,
    groundSeparation: .12,
    vegetationLift: .08,
  })

  const scene = new THREE.Scene()
  const environment = new THREE.Texture()
  module.installCampusEnvironment(scene, environment, 'evening')
  assert.deepEqual(scene.userData.campusEnvironment.landscape, module.deriveCampusLandscapePolicy('evening'))
})
