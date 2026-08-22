import * as THREE from 'three'
import { DEFAULT_CAMPUS_SUNLIGHT, clampCampusSunlight } from './campusSunlight.js'
import { resolveCampusLightingProfile } from './campusLightingProfiles.js'

function deriveSunlightFactor(mode, sunlightPercent) {
  const baseline = mode === 'evening' ? DEFAULT_CAMPUS_SUNLIGHT.evening : DEFAULT_CAMPUS_SUNLIGHT.day
  const percent = clampCampusSunlight(sunlightPercent ?? baseline)
  if (percent <= baseline) return .38 + .62 * (percent / baseline)
  return 1 + .28 * ((percent - baseline) / (100 - baseline))
}

export function deriveCampusLightingState(mode, sunlightPercent, profile) {
  const safeMode = mode === 'evening' ? 'evening' : 'day'
  const state = resolveCampusLightingProfile(profile, safeMode)
  const baseline = DEFAULT_CAMPUS_SUNLIGHT[safeMode]
  const percent = clampCampusSunlight(sunlightPercent ?? baseline)
  const factor = deriveSunlightFactor(safeMode, percent)
  return {
    ...state,
    sunlightPercent: percent,
    exposure: state.exposure * (.82 + .18 * factor),
    ambientIntensity: state.ambientIntensity * (.58 + .42 * factor),
    keyIntensity: state.keyIntensity * factor,
    shadowFillIntensity: state.shadowFillIntensity * (.78 + .22 * factor),
    facadeAmbientIntensity: state.facadeAmbientIntensity * (.62 + .38 * factor),
    environmentIntensity: state.environmentIntensity * (.68 + .32 * factor),
  }
}

function fixtureMaterials(object) {
  const materials = Array.isArray(object.material) ? object.material : [object.material]
  return materials.filter(Boolean)
}

function isOperationalFixture(object) {
  return object.isMesh && (
    Boolean(object.userData.lightRole)
    ||
    object.name.startsWith('LIGHT__')
    || object.name.includes('__exterior-light')
    || object.name.startsWith('GATE__reader-')
  )
}

export function resolveFixtureLighting(object, state) {
  const profiles = {
    'entry-warm': { color: 0xffc27a, intensity: state.entryFixtureIntensity },
    'task-cool': { color: 0xa6e3ff, intensity: state.taskFixtureIntensity },
    'wayfinding-amber': { color: 0xffa83d, intensity: state.wayfindingFixtureIntensity },
    'lobby-warm': { color: 0xff9b52, intensity: state.lobbyFixtureIntensity },
  }
  return profiles[object.userData.lightRole] ?? null
}

export function applyCampusLightingMode({ scene, renderer, postProcessing }, mode, sunlightPercent, profile) {
  const state = deriveCampusLightingState(mode, sunlightPercent, profile)
  renderer.toneMappingExposure = state.exposure
  scene.environmentIntensity = state.environmentIntensity
  if (scene.environmentRotation) scene.environmentRotation.y = state.environmentRotation
  scene.background = new THREE.Color(state.skyColor)
  if (scene.fog) {
    scene.fog.color.setHex(state.fogColor)
    scene.fog.density = state.fogDensity
  }

  scene.traverse((object) => {
    if (object.name === 'CampusHemisphere') {
      object.intensity = state.ambientIntensity
      object.color.setHex(state.hemisphereSkyColor)
      object.groundColor.setHex(state.hemisphereGroundColor)
    } else if (object.name === 'CampusKey') {
      object.intensity = state.keyIntensity
      object.color.setHex(state.keyColor)
      const radius = Math.max(1, object.position.length())
      const elevation = THREE.MathUtils.degToRad(state.keyElevation)
      const azimuth = THREE.MathUtils.degToRad(state.keyAzimuth)
      const horizontal = radius * Math.cos(elevation)
      object.position.set(horizontal * Math.cos(azimuth), radius * Math.sin(elevation), horizontal * Math.sin(azimuth))
      if (object.shadow) object.shadow.radius = state.shadowSoftness
    }
    else if (object.name === 'CampusShadowFill') {
      object.intensity = state.shadowFillIntensity
      object.color.setHex(state.fillColor)
      object.castShadow = false
    }
    else if (object.name === 'CampusFacadeAmbient') {
      object.intensity = state.facadeAmbientIntensity
      object.color.setHex(state.facadeAmbientColor)
    }
    else if (object.name === 'CampusRoadGlow') object.intensity = state.roadLightIntensity
    else if (object.name === 'CampusAccentGlow') object.intensity = state.accentLightIntensity

    if (!isOperationalFixture(object)) return
    if (!object.userData.campusLightingMaterialsOwned) {
      object.material = Array.isArray(object.material)
        ? object.material.map((material) => material.clone())
        : object.material.clone()
      object.userData.campusLightingMaterialsOwned = true
    }
    fixtureMaterials(object).forEach((material) => {
      if (!material.emissive) return
      const profile = resolveFixtureLighting(object, state)
      material.emissive.setHex(profile?.color ?? (object.name.startsWith('GATE__reader-') ? 0xff9a3d : 0x8eefff))
      material.emissiveIntensity = profile?.intensity ?? state.fixtureEmissiveIntensity
      material.needsUpdate = true
    })
  })
  postProcessing?.setMode?.(mode, state)
  return state
}
