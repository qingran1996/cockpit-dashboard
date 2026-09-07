import * as THREE from 'three'

export const PLANT_V068_DEFAULT_LIGHTING_MODE = 'day'
export const PLANT_V068_SUN_DIRECTION = Object.freeze([.504, -.788, -.353])

export const PLANT_V068_CAMERA = Object.freeze({
  fov: 59,
  near: .5,
  far: 1000,
  position: Object.freeze([114, 50, 300]),
  target: Object.freeze([150, 2.5, 220]),
  controls: Object.freeze({
    dampingFactor: .06,
    minDistance: 4,
    maxDistance: 650,
    maxPolarAngle: 1.55,
  }),
})

export const PLANT_V068_QUALITY = Object.freeze({
  high: Object.freeze({ pixelRatioCap: 2, shadowMapSize: 4096, workLightShadows: 2, postProcessing: true }),
  balanced: Object.freeze({ pixelRatioCap: 1.5, shadowMapSize: 2048, workLightShadows: 1, postProcessing: true }),
  performance: Object.freeze({ pixelRatioCap: 1, shadowMapSize: 1024, workLightShadows: 0, postProcessing: false }),
})

export function resolvePlantV068PixelRatio({
  width = 0,
  height = 0,
  devicePixelRatio = 1,
  cap = 2,
  maxPhysicalPixels = 2_200_000,
} = {}) {
  const nativeRatio = Math.min(Math.max(Number(devicePixelRatio) || 1, 1), cap)
  const cssPixels = Math.max(0, Number(width) || 0) * Math.max(0, Number(height) || 0)
  if (!cssPixels) return nativeRatio
  const budgetRatio = Math.max(1, Math.sqrt(maxPhysicalPixels / cssPixels))
  return Math.floor(Math.min(nativeRatio, budgetRatio) * 1000) / 1000
}

export function configurePlantV068Renderer(renderer) {
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setClearColor(new THREE.Color('#24272b'), 1)
  return renderer
}

function createEnvironmentPanel({ name, color, position, scale }) {
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
  material.color.setRGB(...color, THREE.LinearSRGBColorSpace)
  material.toneMapped = false
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
  panel.name = name
  panel.position.fromArray(position)
  panel.scale.set(scale[0], scale[1], 1)
  panel.lookAt(0, 0, 0)
  return panel
}

function attachEnvironmentDisposer(environment) {
  environment.userData.dispose = () => {
    environment.traverse((object) => {
      object.geometry?.dispose?.()
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose?.())
      else object.material?.dispose?.()
    })
    environment.clear()
  }
  return environment
}

export function createPlantV068BlueHourEnvironment() {
  const environment = new THREE.Scene()
  environment.name = 'PlantV068BlueHourEnvironment'
  environment.background = new THREE.Color().setRGB(.006, .014, .042, THREE.LinearSRGBColorSpace)
  environment.add(
    createEnvironmentPanel({
      name: 'PlantBlueHourCoolFill',
      color: [2.16, 4.05, 11.4],
      position: [-22, 16, 18],
      scale: [28, 16],
    }),
    createEnvironmentPanel({
      name: 'PlantBlueHourCoolRim',
      color: [1.14, 2.46, 7.5],
      position: [24, 12, -22],
      scale: [18, 12],
    }),
    createEnvironmentPanel({
      name: 'PlantBlueHourSkyFill',
      color: [.72, 1.44, 4.05],
      position: [0, 28, 0],
      scale: [24, 20],
    }),
    createEnvironmentPanel({
      name: 'PlantBlueHourWarmPractical',
      color: [2.2, .62, .16],
      position: [-16, 7, -24],
      scale: [7, 4],
    }),
  )
  return attachEnvironmentDisposer(environment)
}

export function createPlantV068DayEnvironment() {
  const environment = new THREE.Scene()
  environment.name = 'PlantV068DayEnvironment'
  environment.background = new THREE.Color().setRGB(.05, .09, .14, THREE.LinearSRGBColorSpace)
  environment.add(
    createEnvironmentPanel({
      name: 'PlantDaySkyFill',
      color: [.78, .95, 1.12],
      position: [0, 30, 0],
      scale: [36, 28],
    }),
    createEnvironmentPanel({
      name: 'PlantDayHorizonFill',
      color: [.62, .68, .74],
      position: [-28, 8, 10],
      scale: [32, 18],
    }),
    createEnvironmentPanel({
      name: 'PlantDayGroundBounce',
      color: [.34, .31, .25],
      position: [0, -20, 0],
      scale: [30, 25],
    }),
    createEnvironmentPanel({
      name: 'PlantDaySunSoftbox',
      color: [11, 8.4, 5.2],
      position: [35, 24, 12],
      scale: [8, 8],
    }),
  )
  return attachEnvironmentDisposer(environment)
}

export function installPlantV068Environment(scene, environmentMap) {
  scene.background = new THREE.Color('#24272b')
  if (environmentMap) {
    environmentMap.mapping = THREE.CubeUVReflectionMapping
    scene.environment = environmentMap
  }
  scene.environmentIntensity = .28
  if (scene.environmentRotation) scene.environmentRotation.y = -.65
  scene.userData.plantV068Environment = { mode: 'night-industrial', intensity: .28, rotationY: -.65 }
  return scene
}

function attachTarget(group, light, position, name) {
  light.target.name = name
  light.target.position.fromArray(position)
  group.add(light, light.target)
  return light
}

function createWorkLight(group, { name, color, intensity, position, target, distance, angle, penumbra, castShadow }) {
  const light = new THREE.SpotLight(color, intensity, distance, angle, penumbra, 2)
  light.name = name
  light.position.fromArray(position)
  light.castShadow = castShadow
  if (castShadow) {
    light.shadow.mapSize.set(2048, 2048)
    light.shadow.bias = -.00012
    light.shadow.normalBias = .025
    light.shadow.camera.near = .5
    light.shadow.camera.far = distance
  }
  return attachTarget(group, light, target, `${name}Target`)
}

export function createPlantV068LightingRig() {
  const group = new THREE.Group()
  group.name = 'PlantV068NightLighting'
  const hemisphere = new THREE.HemisphereLight('#0b1830', '#05070b', .32)
  hemisphere.name = 'PlantNightHemisphere'
  group.add(hemisphere)

  const moon = new THREE.DirectionalLight('#739fff', 2.2)
  moon.name = 'PlantMoonKey'
  moon.position.set(-35, 55, 75)
  moon.castShadow = true
  moon.shadow.mapSize.set(4096, 4096)
  moon.shadow.bias = -.00015
  moon.shadow.normalBias = .025
  moon.shadow.radius = 2
  moon.shadow.camera.left = -280
  moon.shadow.camera.right = 280
  moon.shadow.camera.top = 220
  moon.shadow.camera.bottom = -220
  moon.shadow.camera.near = 5
  moon.shadow.camera.far = 650
  attachTarget(group, moon, PLANT_V068_CAMERA.target, 'PlantMoonTarget')

  const workLights = [
    createWorkLight(group, { name: 'PlantWorkWarmWest', color: '#ff6b22', intensity: 1350, position: [-24, 22, 30], target: [-14, 2, 10], distance: 48, angle: .72, penumbra: .72, castShadow: true }),
    createWorkLight(group, { name: 'PlantWorkWarmCenter', color: '#ff9440', intensity: 1550, position: [0, 24, 5], target: [0, 2, -1], distance: 52, angle: .78, penumbra: .76, castShadow: true }),
    createWorkLight(group, { name: 'PlantWorkWarmEast', color: '#ff7628', intensity: 1300, position: [24, 21, -22], target: [14, 2, -9], distance: 48, angle: .72, penumbra: .72, castShadow: false }),
  ]
  const coolRim = createWorkLight(group, { name: 'PlantCoolRim', color: '#467dff', intensity: 1750, position: [-34, 28, -34], target: [0, 7, -2], distance: 78, angle: .86, penumbra: .82, castShadow: false })
  return { group, hemisphere, moon, workLights, coolRim }
}

export function applyPlantV068LightingMode({ scene, renderer, lighting, environmentMaps, mode = 'evening' }) {
  const isDay = mode === 'day'
  const environmentMap = isDay ? environmentMaps.day : environmentMaps.evening
  if (environmentMap) {
    environmentMap.mapping = THREE.CubeUVReflectionMapping
    scene.environment = environmentMap
  }
  if (isDay) {
    scene.background = new THREE.Color('#a9c9dc')
    scene.fog = new THREE.FogExp2('#b9d1de', .00115)
    scene.environmentIntensity = .55
    if (scene.environmentRotation) scene.environmentRotation.y = .35
    renderer.toneMappingExposure = 1
    lighting.hemisphere.color.set('#dce8ef')
    lighting.hemisphere.groundColor.set('#70766a')
    lighting.hemisphere.intensity = .75
    lighting.moon.color.set('#fff4df')
    lighting.moon.intensity = 2.6
    const sunDirection = new THREE.Vector3(...PLANT_V068_SUN_DIRECTION).normalize()
    lighting.moon.position.copy(lighting.moon.target.position).addScaledVector(sunDirection, -420)
    lighting.workLights.forEach((light) => { light.visible = false })
    lighting.coolRim.visible = false
    scene.userData.plantV068Environment = { mode: 'day-industrial', intensity: .55, rotationY: .35 }
  } else {
    scene.background = new THREE.Color('#24272b')
    scene.fog = new THREE.FogExp2('#24272b', .0018)
    scene.environmentIntensity = .28
    if (scene.environmentRotation) scene.environmentRotation.y = -.65
    renderer.toneMappingExposure = 1.15
    lighting.hemisphere.color.set('#0b1830')
    lighting.hemisphere.groundColor.set('#05070b')
    lighting.hemisphere.intensity = .32
    lighting.moon.color.set('#739fff')
    lighting.moon.intensity = 2.2
    lighting.moon.position.set(-35, 55, 75)
    lighting.workLights.forEach((light) => { light.visible = true })
    lighting.coolRim.visible = true
    scene.userData.plantV068Environment = { mode: 'night-industrial', intensity: .28, rotationY: -.65 }
  }
  return isDay ? 'day' : 'evening'
}

export function applyPlantV068Quality({
  level = 'high',
  renderer,
  postProcessing,
  lighting,
  devicePixelRatio = 1,
  width = 0,
  height = 0,
}) {
  const policy = PLANT_V068_QUALITY[level] ?? PLANT_V068_QUALITY.high
  const pixelRatio = resolvePlantV068PixelRatio({ width, height, devicePixelRatio, cap: policy.pixelRatioCap })
  renderer.setPixelRatio(pixelRatio)
  postProcessing?.setPixelRatio?.(pixelRatio)
  renderer.shadowMap.enabled = true
  const shadowLights = [lighting.moon, ...lighting.workLights]
  shadowLights.forEach((light, index) => {
    light.castShadow = index === 0 || index <= policy.workLightShadows
    light.shadow.mapSize.set(policy.shadowMapSize, policy.shadowMapSize)
    light.shadow.map?.dispose()
    light.shadow.map = null
  })
  lighting.workLights[2].castShadow = false
  postProcessing?.setQuality?.({ postProcessing: policy.postProcessing })
  return { ...policy, pixelRatio, level: PLANT_V068_QUALITY[level] ? level : 'high' }
}
