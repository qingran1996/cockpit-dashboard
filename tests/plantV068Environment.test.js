import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'

test('opens from the operator-selected southeast aerial view and preserves orbit controls', async () => {
  const module = await import('../src/scene/plantV068Environment.js').catch(() => ({}))

  assert.equal(module.PLANT_V068_DEFAULT_LIGHTING_MODE, 'day')
  assert.deepEqual(module.PLANT_V068_CAMERA, {
    fov: 59,
    near: 0.5,
    far: 1000,
    position: [114, 50, 300],
    target: [150, 2.5, 220],
    controls: {
      dampingFactor: 0.06,
      minDistance: 4,
      maxDistance: 650,
      maxPolarAngle: 1.55,
    },
  })
})

test('configures fixed ACES exposure, sRGB output, and soft shadows for the UE-like Web camera', async () => {
  const module = await import('../src/scene/plantV068Environment.js').catch(() => ({}))
  assert.equal(typeof module.configurePlantV068Renderer, 'function')
  const renderer = {
    shadowMap: { enabled: false, type: null },
    setClearColor(color, alpha) { this.clearColor = color; this.clearAlpha = alpha },
  }

  module.configurePlantV068Renderer(renderer)

  assert.equal(renderer.outputColorSpace, THREE.SRGBColorSpace)
  assert.equal(renderer.toneMapping, THREE.ACESFilmicToneMapping)
  assert.equal(renderer.toneMappingExposure, 1)
  assert.equal(renderer.shadowMap.enabled, true)
  assert.equal(renderer.shadowMap.type, THREE.PCFSoftShadowMap)
  assert.equal(renderer.clearColor.getHexString(), '24272b')
  assert.equal(renderer.clearAlpha, 1)
})

test('builds a restrained blue-hour HDR environment that gives metal surfaces readable reflections', async () => {
  const module = await import('../src/scene/plantV068Environment.js').catch(() => ({}))
  assert.equal(typeof module.createPlantV068BlueHourEnvironment, 'function')

  const environment = module.createPlantV068BlueHourEnvironment()
  const coolFill = environment.getObjectByName('PlantBlueHourCoolFill')
  const coolRim = environment.getObjectByName('PlantBlueHourCoolRim')
  const warmPractical = environment.getObjectByName('PlantBlueHourWarmPractical')

  assert.ok(environment.isScene)
  assert.ok(coolFill?.isMesh)
  assert.ok(coolRim?.isMesh)
  assert.ok(warmPractical?.isMesh)
  assert.ok(coolFill.material.color.b > coolFill.material.color.r * 2)
  assert.ok(coolFill.material.color.b > 1, 'the PMREM source needs HDR blue radiance, not an LDR backdrop')
  assert.ok(coolRim.material.color.b > coolRim.material.color.r * 2)
  assert.ok(warmPractical.material.color.r > warmPractical.material.color.b * 2)
  assert.ok(warmPractical.scale.x < coolFill.scale.x, 'warm practical reflection must remain an accent')

  environment.userData.dispose()
  assert.equal(environment.children.length, 0)
})

test('keeps enough cool HDR fill to reveal dark painted steel without raising global exposure', async () => {
  const module = await import('../src/scene/plantV068Environment.js')
  const environment = module.createPlantV068BlueHourEnvironment()
  const coolPanels = environment.children.filter((panel) => /Cool|SkyFill/.test(panel.name))
  const effectiveCoolFill = coolPanels.reduce((total, panel) => {
    const { r, g, b } = panel.material.color
    const luminance = .2126 * r + .7152 * g + .0722 * b
    const projectedArea = panel.scale.x * panel.scale.y
    return total + luminance * projectedArea / panel.position.lengthSq()
  }, 0) * .28

  assert.ok(effectiveCoolFill >= .8, `dark steel needs at least 0.8 effective cool fill, received ${effectiveCoolFill}`)
  assert.ok(effectiveCoolFill <= 1.2, `night IBL must stay restrained, received ${effectiveCoolFill}`)
  environment.userData.dispose()
})

test('builds a neutral daylight environment with a restrained blue sky and warm sun reflection', async () => {
  const module = await import('../src/scene/plantV068Environment.js').catch(() => ({}))
  assert.equal(typeof module.createPlantV068DayEnvironment, 'function')

  const environment = module.createPlantV068DayEnvironment()
  const sky = environment.getObjectByName('PlantDaySkyFill')
  const sun = environment.getObjectByName('PlantDaySunSoftbox')

  assert.ok(environment.isScene)
  assert.ok(sky?.isMesh)
  assert.ok(sun?.isMesh)
  assert.ok(sky.material.color.b > sky.material.color.r)
  assert.ok(sky.material.color.b / sky.material.color.r <= 1.6, 'daylight reflections must not cast a heavy blue veil over white cladding')
  assert.ok(sky.material.color.g >= .8)
  assert.ok(sun.material.color.r > sun.material.color.b)
  assert.ok(sun.material.color.r > 5)
  environment.userData.dispose()
})

test('bounds daylight IBL so textured materials keep contrast instead of washing out', async () => {
  const module = await import('../src/scene/plantV068Environment.js')
  const environment = module.createPlantV068DayEnvironment()
  const effectiveDayFill = environment.children.reduce((total, panel) => {
    const { r, g, b } = panel.material.color
    const luminance = .2126 * r + .7152 * g + .0722 * b
    return total + luminance * panel.scale.x * panel.scale.y / panel.position.lengthSq()
  }, 0) * .55

  assert.ok(effectiveDayFill >= 1, `daylight IBL is too dim at ${effectiveDayFill}`)
  assert.ok(effectiveDayFill <= 1.3, `daylight IBL washes out material contrast at ${effectiveDayFill}`)
  environment.userData.dispose()
})

test('keeps the hidden PMREM backdrop dimmer than the visible daytime sky', async () => {
  const module = await import('../src/scene/plantV068Environment.js')
  const environment = module.createPlantV068DayEnvironment()
  const { r, g, b } = environment.background
  const luminance = .2126 * r + .7152 * g + .0722 * b

  assert.ok(luminance <= .2, `full-sphere PMREM backdrop washes out dark textures at ${luminance}`)
  environment.userData.dispose()
})

test('switches the live plant between readable daylight and the preserved night rig', async () => {
  const module = await import('../src/scene/plantV068Environment.js').catch(() => ({}))
  assert.equal(typeof module.applyPlantV068LightingMode, 'function')
  const scene = new THREE.Scene()
  const renderer = { toneMappingExposure: 0 }
  const lighting = module.createPlantV068LightingRig()
  const environmentMaps = { day: new THREE.Texture(), evening: new THREE.Texture() }

  module.applyPlantV068LightingMode({ scene, renderer, lighting, environmentMaps, mode: 'day' })

  assert.equal(scene.environment, environmentMaps.day)
  assert.equal(scene.environmentIntensity, .55)
  assert.ok(scene.background.r > .2 && scene.background.b > scene.background.r)
  assert.equal(renderer.toneMappingExposure, 1)
  assert.equal(lighting.hemisphere.intensity, .75)
  assert.equal(lighting.hemisphere.color.getHexString(), 'dce8ef')
  assert.equal(lighting.moon.color.getHexString(), 'fff4df')
  assert.equal(lighting.moon.intensity, 2.6)
  const propagation = lighting.moon.target.position.clone().sub(lighting.moon.position).normalize()
  assert.ok(propagation.distanceTo(new THREE.Vector3(.504, -.788, -.353).normalize()) < .001)
  assert.ok(scene.fog?.isFogExp2)
  assert.equal(scene.fog.color.getHexString(), 'b9d1de')
  assert.equal(scene.fog.density, .00115)
  assert.ok(lighting.workLights.every((light) => !light.visible))
  assert.equal(lighting.coolRim.visible, false)

  module.applyPlantV068LightingMode({ scene, renderer, lighting, environmentMaps, mode: 'evening' })

  assert.equal(scene.environment, environmentMaps.evening)
  assert.equal(scene.environmentIntensity, .28)
  assert.equal(renderer.toneMappingExposure, 1.15)
  assert.equal(lighting.hemisphere.intensity, .32)
  assert.equal(lighting.moon.color.getHexString(), '739fff')
  assert.equal(lighting.moon.intensity, 2.2)
  assert.ok(lighting.workLights.every((light) => light.visible))
  assert.equal(lighting.coolRim.visible, true)
  assert.ok(scene.fog?.isFogExp2)
  assert.equal(scene.fog.density, .0018)
  const eveningChannels = scene.background.toArray()
  assert.ok(Math.max(...eveningChannels) - Math.min(...eveningChannels) < .01)
  assert.ok(eveningChannels.every((value) => value > .015 && value < .03))
})

test('rebuilds the documented moon, three warm work lights, cool rim, and fallback hemisphere', async () => {
  const module = await import('../src/scene/plantV068Environment.js').catch(() => ({}))
  assert.equal(typeof module.createPlantV068LightingRig, 'function')
  const rig = module.createPlantV068LightingRig()
  const moon = rig.group.getObjectByName('PlantMoonKey')
  const west = rig.group.getObjectByName('PlantWorkWarmWest')
  const center = rig.group.getObjectByName('PlantWorkWarmCenter')
  const east = rig.group.getObjectByName('PlantWorkWarmEast')
  const rim = rig.group.getObjectByName('PlantCoolRim')
  const hemisphere = rig.group.getObjectByName('PlantNightHemisphere')

  assert.ok(moon?.isDirectionalLight)
  assert.equal(moon.color.getHexString(), '739fff')
  assert.equal(moon.intensity, 2.2)
  assert.deepEqual(moon.position.toArray(), [-35, 55, 75])
  assert.deepEqual(moon.target.position.toArray(), [150, 2.5, 220])
  assert.equal(moon.castShadow, true)
  assert.deepEqual(moon.shadow.mapSize.toArray(), [4096, 4096])
  assert.equal(moon.shadow.bias, -.00015)
  assert.equal(moon.shadow.normalBias, .025)
  assert.equal(moon.shadow.camera.left, -280)
  assert.equal(moon.shadow.camera.right, 280)
  assert.equal(moon.shadow.camera.top, 220)
  assert.equal(moon.shadow.camera.bottom, -220)
  assert.equal(moon.shadow.camera.near, 5)
  assert.equal(moon.shadow.camera.far, 650)

  for (const [light, color, intensity, position, target, distance, angle, penumbra, casts] of [
    [west, 'ff6b22', 1350, [-24, 22, 30], [-14, 2, 10], 48, .72, .72, true],
    [center, 'ff9440', 1550, [0, 24, 5], [0, 2, -1], 52, .78, .76, true],
    [east, 'ff7628', 1300, [24, 21, -22], [14, 2, -9], 48, .72, .72, false],
    [rim, '467dff', 1750, [-34, 28, -34], [0, 7, -2], 78, .86, .82, false],
  ]) {
    assert.ok(light?.isSpotLight)
    assert.equal(light.color.getHexString(), color)
    assert.equal(light.intensity, intensity)
    assert.deepEqual(light.position.toArray(), position)
    assert.deepEqual(light.target.position.toArray(), target)
    assert.equal(light.distance, distance)
    assert.equal(light.angle, angle)
    assert.equal(light.penumbra, penumbra)
    assert.equal(light.castShadow, casts)
  }
  assert.equal(hemisphere.color.getHexString(), '0b1830')
  assert.equal(hemisphere.groundColor.getHexString(), '05070b')
  assert.equal(hemisphere.intensity, .32)
  assert.equal([moon, west, center, east, rim].filter((light) => light.castShadow).length, 3)
})

test('applies explicit desktop, balanced, and performance quality tiers', async () => {
  const module = await import('../src/scene/plantV068Environment.js').catch(() => ({}))
  const calls = []
  const renderer = {
    shadowMap: {},
    setPixelRatio: (value) => calls.push(['pixelRatio', value]),
  }
  const postProcessing = { setQuality: (value) => calls.push(['post', value]) }
  const rig = module.createPlantV068LightingRig()

  const high = module.applyPlantV068Quality({ level: 'high', renderer, postProcessing, lighting: rig, devicePixelRatio: 3 })
  assert.equal(high.pixelRatio, 2)
  assert.equal(rig.moon.shadow.mapSize.width, 4096)
  assert.equal(rig.workLights.filter((light) => light.castShadow).length, 2)

  const balanced = module.applyPlantV068Quality({ level: 'balanced', renderer, postProcessing, lighting: rig, devicePixelRatio: 2 })
  assert.equal(balanced.pixelRatio, 1.5)
  assert.equal(rig.moon.shadow.mapSize.width, 2048)
  assert.equal(rig.workLights.filter((light) => light.castShadow).length, 1)

  const performance = module.applyPlantV068Quality({ level: 'performance', renderer, postProcessing, lighting: rig, devicePixelRatio: 2 })
  assert.equal(performance.pixelRatio, 1)
  assert.equal(rig.moon.shadow.mapSize.width, 1024)
  assert.equal(rig.workLights.filter((light) => light.castShadow).length, 0)
  assert.deepEqual(calls.at(-1), ['post', { postProcessing: false }])
})

test('adapts DPR to a bounded physical-pixel budget when the factory enters full-screen focus', async () => {
  const module = await import('../src/scene/plantV068Environment.js').catch(() => ({}))
  assert.equal(typeof module.resolvePlantV068PixelRatio, 'function')

  assert.equal(module.resolvePlantV068PixelRatio({ width: 1072, height: 540, devicePixelRatio: 2, cap: 2 }), 1.949)
  const focused = module.resolvePlantV068PixelRatio({ width: 1280, height: 720, devicePixelRatio: 2, cap: 2 })

  assert.ok(focused >= 1.54 && focused <= 1.55, `expected a 2.2MP budget, received ${focused}`)
  assert.ok(1280 * 720 * focused ** 2 <= 2_200_001)
})
