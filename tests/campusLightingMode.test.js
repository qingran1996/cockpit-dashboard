import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'

test('derives a restrained evening state with stronger operational lights', async () => {
  const module = await import('../src/scene/campusLightingMode.js').catch(() => ({}))
  assert.equal(typeof module.deriveCampusLightingState, 'function', 'campus lighting state helper is missing')

  const day = module.deriveCampusLightingState('day')
  const evening = module.deriveCampusLightingState('evening')
  assert.equal(day.skyColor, 0x7299a8, 'day mode needs a visible blue-gray architectural sky instead of a navy void')
  assert.ok(day.fogDensity <= .006, 'day fog must not bury rear elevations on the expanded campus')
  assert.ok(day.exposure >= 1.25 && day.exposure <= 1.55, 'day exposure must retain tonal separation in pale PBR walls and roofs')
  assert.ok(day.keyIntensity > day.shadowFillIntensity * 2, 'daylight needs a readable key direction instead of uniform white illumination')
  assert.ok(day.ambientIntensity + day.facadeAmbientIntensity < day.keyIntensity + day.shadowFillIntensity, 'orientation-independent fill must not flatten normal and roughness response')
  assert.equal(day.environmentIntensity, .1, 'day mode uses the approved restrained PBR environment reflection default')
  assert.equal(day.environmentRotation, .12)
  assert.equal(day.hemisphereSkyColor, 0xe5f3f2)
  assert.equal(day.hemisphereGroundColor, 0x7b8a75)
  assert.equal(day.keyColor, 0xffe0b8)
  assert.equal(day.fillColor, 0xc9e0e5)
  assert.ok(day.facadeAmbientIntensity <= .35, 'facade ambient must preserve wall relief instead of washing every elevation white')
  assert.equal(evening.exposure, 1.12, 'evening mode must retain enough facade detail for the enlarged campus')
  assert.equal(evening.skyColor, 0x061222)
  assert.equal(evening.environmentRotation, -.08)
  assert.ok(evening.ambientIntensity >= 2.2, 'evening mode needs readable building silhouettes around the functional lights')
  assert.ok(evening.fogDensity <= .012, 'evening fog must not bury the distant wayfinding system')
  assert.ok(evening.roadLightIntensity > day.roadLightIntensity)
  assert.ok(evening.keyIntensity < day.keyIntensity)
  assert.equal(evening.keyIntensity + evening.shadowFillIntensity, 1.62, 'evening key split must preserve the approved light energy')
})

test('scales solar contribution without changing the active lighting mode fixtures', async () => {
  const module = await import('../src/scene/campusLightingMode.js').catch(() => ({}))
  const lowDay = module.deriveCampusLightingState('day', 0)
  const defaultDay = module.deriveCampusLightingState('day', 78)
  const highDay = module.deriveCampusLightingState('day', 100)
  assert.ok(lowDay.keyIntensity < defaultDay.keyIntensity)
  assert.ok(defaultDay.keyIntensity < highDay.keyIntensity)
  assert.ok(lowDay.exposure < highDay.exposure)
  assert.ok(lowDay.environmentIntensity < highDay.environmentIntensity)

  const lowEvening = module.deriveCampusLightingState('evening', 0)
  const highEvening = module.deriveCampusLightingState('evening', 100)
  assert.ok(lowEvening.keyIntensity < highEvening.keyIntensity)
  assert.equal(lowEvening.entryFixtureIntensity, highEvening.entryFixtureIntensity)
  assert.equal(lowEvening.taskFixtureIntensity, highEvening.taskFixtureIntensity)

  const scene = new THREE.Scene()
  const key = new THREE.DirectionalLight()
  key.name = 'CampusKey'
  scene.add(key)
  const renderer = { toneMappingExposure: 1 }
  module.applyCampusLightingMode({ scene, renderer }, 'day', 0)
  const appliedLow = key.intensity
  module.applyCampusLightingMode({ scene, renderer }, 'day', 100)
  assert.ok(key.intensity > appliedLow, 'the live Three.js key light must respond to the control')
})

test('applies lighting mode to the renderer, fog, rig, and emissive site fixtures', async () => {
  const module = await import('../src/scene/campusLightingMode.js').catch(() => ({}))
  assert.equal(typeof module.applyCampusLightingMode, 'function', 'campus lighting applicator is missing')

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x000000, .01)
  const hemisphere = new THREE.HemisphereLight()
  hemisphere.name = 'CampusHemisphere'
  const key = new THREE.DirectionalLight()
  key.name = 'CampusKey'
  const fill = new THREE.DirectionalLight()
  fill.name = 'CampusShadowFill'
  const facadeAmbient = new THREE.AmbientLight()
  facadeAmbient.name = 'CampusFacadeAmbient'
  const road = new THREE.PointLight()
  road.name = 'CampusRoadGlow'
  const fixture = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial())
  fixture.name = 'LIGHT__boulevard-head-01'
  scene.add(hemisphere, key, fill, facadeAmbient, road, fixture)
  const modeCalls = []
  const renderer = { toneMappingExposure: 1 }
  const postProcessing = { setMode: (mode, state) => modeCalls.push([mode, state.exposure]) }
  scene.environment = new THREE.Texture()
  scene.environmentRotation = new THREE.Euler()

  module.applyCampusLightingMode({ scene, renderer, postProcessing }, 'day')
  assert.ok(renderer.toneMappingExposure < 1.6)
  assert.equal(scene.environmentIntensity, .1)
  assert.equal(scene.environmentRotation.y, .12)
  assert.equal(scene.background.getHex(), 0x7299a8)
  assert.equal(hemisphere.color.getHex(), 0xe5f3f2)
  assert.equal(hemisphere.groundColor.getHex(), 0x7b8a75)
  assert.equal(key.color.getHex(), 0xffe0b8)
  assert.ok(key.intensity > fill.intensity * 2)
  assert.equal(fill.color.getHex(), 0xc9e0e5)
  assert.ok(fill.intensity < 1)
  assert.equal(fill.castShadow, false)
  assert.equal(facadeAmbient.color.getHex(), 0xf4f1e9)
  assert.ok(facadeAmbient.intensity <= .35)

  module.applyCampusLightingMode({ scene, renderer, postProcessing }, 'evening')
  assert.equal(renderer.toneMappingExposure, 1.12)
  assert.ok(scene.environmentIntensity < 1)
  assert.equal(scene.environmentRotation.y, -.08)
  assert.equal(scene.fog.color.getHex(), 0x061222)
  assert.ok(road.intensity > 1)
  assert.ok(fixture.material.emissiveIntensity > 1)
  assert.deepEqual(modeCalls, [['day', 1.34], ['evening', 1.12]])
})

test('resolves distinct architectural fixture profiles from GLB light roles', async () => {
  const module = await import('../src/scene/campusLightingMode.js').catch(() => ({}))
  assert.equal(typeof module.resolveFixtureLighting, 'function', 'role-based fixture resolver is missing')

  const evening = module.deriveCampusLightingState('evening')
  const fixtures = {
    entry: new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()),
    task: new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()),
    wayfinding: new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()),
    lobby: new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()),
  }
  fixtures.entry.userData.lightRole = 'entry-warm'
  fixtures.task.userData.lightRole = 'task-cool'
  fixtures.wayfinding.userData.lightRole = 'wayfinding-amber'
  fixtures.lobby.userData.lightRole = 'lobby-warm'

  assert.deepEqual(module.resolveFixtureLighting(fixtures.entry, evening), { color: 0xffc27a, intensity: 4.8 })
  assert.deepEqual(module.resolveFixtureLighting(fixtures.task, evening), { color: 0xa6e3ff, intensity: 4.2 })
  assert.deepEqual(module.resolveFixtureLighting(fixtures.wayfinding, evening), { color: 0xffa83d, intensity: 2.7 })
  assert.deepEqual(module.resolveFixtureLighting(fixtures.lobby, evening), { color: 0xff9b52, intensity: 3.4 })
})

test('keeps role-based fixtures restrained by day and brightens them by role at evening', async () => {
  const module = await import('../src/scene/campusLightingMode.js').catch(() => ({}))
  const scene = new THREE.Scene()
  const entry = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial())
  const task = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial())
  entry.name = 'LIGHT__administration__entry-01'
  task.name = 'LIGHT__main-production-hall__task-01'
  entry.userData.lightRole = 'entry-warm'
  task.userData.lightRole = 'task-cool'
  scene.add(entry, task)
  const renderer = { toneMappingExposure: 1 }

  module.applyCampusLightingMode({ scene, renderer }, 'day')
  assert.equal(entry.material.emissive.getHex(), 0xffc27a)
  assert.equal(entry.material.emissiveIntensity, .18)
  assert.equal(task.material.emissive.getHex(), 0xa6e3ff)
  assert.equal(task.material.emissiveIntensity, .12)

  module.applyCampusLightingMode({ scene, renderer }, 'evening')
  assert.equal(entry.material.emissiveIntensity, 4.8)
  assert.equal(task.material.emissiveIntensity, 4.2)
})

test('applies a sanitized commissioning profile to atmosphere sun direction shadows and fixtures', async () => {
  const module = await import('../src/scene/campusLightingMode.js').catch(() => ({}))
  const profilesModule = await import('../src/scene/campusLightingProfiles.js')
  let profiles = profilesModule.createCampusLightingProfiles()
  for (const [key, value] of [
    ['exposure', 1.3],
    ['fogColor', '#112233'],
    ['keyColor', '#fedcba'],
    ['keyIntensity', 3.2],
    ['keyElevation', 45],
    ['keyAzimuth', 0],
    ['shadowSoftness', 6],
    ['entryFixtureIntensity', 6.5],
  ]) profiles = profilesModule.updateCampusLightingProfile(profiles, 'day', key, value)

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x000000, .01)
  const key = new THREE.DirectionalLight()
  key.name = 'CampusKey'
  key.position.set(-8, 16, 8)
  key.castShadow = true
  const entry = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial())
  entry.name = 'LIGHT__administration__entry-01'
  entry.userData.lightRole = 'entry-warm'
  scene.add(key, entry)
  const renderer = { toneMappingExposure: 1 }
  const states = []

  module.applyCampusLightingMode({ scene, renderer, postProcessing: { setMode: (_mode, state) => states.push(state) } }, 'day', 78, profiles.day)
  assert.equal(renderer.toneMappingExposure, 1.3)
  assert.equal(scene.fog.color.getHex(), 0x112233)
  assert.equal(key.color.getHex(), 0xfedcba)
  assert.equal(key.intensity, 3.2)
  assert.ok(key.position.x > 10 && Math.abs(key.position.z) < .001)
  assert.ok(Math.abs(key.position.y - key.position.x) < .001)
  assert.equal(key.shadow.radius, 6)
  assert.equal(entry.material.emissiveIntensity, 6.5)
  assert.equal(states[0].bloomStrength, .08)
})
