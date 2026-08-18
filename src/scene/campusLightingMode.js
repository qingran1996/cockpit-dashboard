import * as THREE from 'three'

const STATES = {
  day: {
    exposure: 1.55,
    skyColor: 0x020b14,
    fogDensity: .012,
    ambientIntensity: 2.45,
    keyIntensity: 2.2,
    roadLightIntensity: 42,
    accentLightIntensity: 48,
    fixtureEmissiveIntensity: .08,
  },
  evening: {
    exposure: .82,
    skyColor: 0x061222,
    fogDensity: .014,
    ambientIntensity: 1.85,
    keyIntensity: 1.28,
    roadLightIntensity: 108,
    accentLightIntensity: 88,
    fixtureEmissiveIntensity: 3.8,
  },
}

export function deriveCampusLightingState(mode) {
  return { ...(mode === 'evening' ? STATES.evening : STATES.day) }
}

function fixtureMaterials(object) {
  const materials = Array.isArray(object.material) ? object.material : [object.material]
  return materials.filter(Boolean)
}

function isOperationalFixture(object) {
  return object.isMesh && (
    object.name.startsWith('LIGHT__')
    || object.name.includes('__exterior-light')
    || object.name.startsWith('GATE__reader-')
  )
}

export function applyCampusLightingMode({ scene, renderer }, mode) {
  const state = deriveCampusLightingState(mode)
  renderer.toneMappingExposure = state.exposure
  scene.background = new THREE.Color(state.skyColor)
  if (scene.fog) {
    scene.fog.color.setHex(state.skyColor)
    scene.fog.density = state.fogDensity
  }

  scene.traverse((object) => {
    if (object.name === 'CampusHemisphere') object.intensity = state.ambientIntensity
    else if (object.name === 'CampusKey') object.intensity = state.keyIntensity
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
      material.emissive.setHex(object.name.startsWith('GATE__reader-') ? 0xff9a3d : 0x8eefff)
      material.emissiveIntensity = state.fixtureEmissiveIntensity
      material.needsUpdate = true
    })
  })
  return state
}
