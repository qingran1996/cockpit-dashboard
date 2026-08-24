import * as THREE from 'three'

export const CAMPUS_RENDER_STYLES = Object.freeze({
  cockpit: 'cockpit',
  unity: 'unity',
})

export const DEFAULT_CAMPUS_RENDER_STYLE = CAMPUS_RENDER_STYLES.unity

export function normalizeCampusRenderStyle(style) {
  if (style === undefined || style === null) return CAMPUS_RENDER_STYLES.cockpit
  if (style === CAMPUS_RENDER_STYLES.cockpit) return CAMPUS_RENDER_STYLES.cockpit
  if (style === CAMPUS_RENDER_STYLES.unity) return CAMPUS_RENDER_STYLES.unity
  return DEFAULT_CAMPUS_RENDER_STYLE
}

const UNITY_LIGHTING = Object.freeze({
  day: Object.freeze({
    exposureMultiplier: 1.08,
    skyColor: 0x759eb8,
    horizonColor: 0xaec5cc,
    lowColor: 0x60786b,
    fogColor: 0x87a3a8,
    fogDensityMultiplier: .58,
    ambientMultiplier: 1.22,
    hemisphereSkyColor: 0xa3bdd1,
    hemisphereGroundColor: 0x2b3530,
    keyColor: 0xfff4e0,
    keyElevation: 48,
    keyAzimuth: 325,
    keyIntensityMultiplier: .94,
    shadowFillMultiplier: 1.24,
    fillColor: 0x9eb9be,
    facadeAmbientColor: 0xcfd5d1,
    facadeAmbientMultiplier: 1.12,
    environmentMultiplier: 3.5,
    bloomMultiplier: .5,
    shadowSoftness: 4.5,
  }),
  evening: Object.freeze({
    exposureMultiplier: 1.1,
    skyColor: 0x526f82,
    horizonColor: 0x829da6,
    lowColor: 0x354842,
    fogColor: 0x607985,
    fogDensityMultiplier: .58,
    ambientMultiplier: 1.16,
    hemisphereSkyColor: 0x8ea8bc,
    hemisphereGroundColor: 0x27332f,
    keyColor: 0xffcf9a,
    keyElevation: 34,
    keyAzimuth: 320,
    keyIntensityMultiplier: 1.06,
    shadowFillMultiplier: 1.2,
    fillColor: 0x718c99,
    facadeAmbientColor: 0xb9c6c4,
    facadeAmbientMultiplier: 1.08,
    environmentMultiplier: 3.5,
    bloomMultiplier: .72,
    shadowSoftness: 5,
  }),
})

export function applyCampusRenderStyleToLightingState(state, style, mode = 'day') {
  if (normalizeCampusRenderStyle(style) === CAMPUS_RENDER_STYLES.cockpit) return state
  const policy = UNITY_LIGHTING[mode === 'evening' ? 'evening' : 'day']
  return {
    ...state,
    renderStyle: CAMPUS_RENDER_STYLES.unity,
    exposure: state.exposure * policy.exposureMultiplier,
    skyColor: policy.skyColor,
    horizonColor: policy.horizonColor,
    lowColor: policy.lowColor,
    fogColor: policy.fogColor,
    fogDensity: state.fogDensity * policy.fogDensityMultiplier,
    ambientIntensity: state.ambientIntensity * policy.ambientMultiplier,
    hemisphereSkyColor: policy.hemisphereSkyColor,
    hemisphereGroundColor: policy.hemisphereGroundColor,
    keyColor: policy.keyColor,
    keyElevation: policy.keyElevation,
    keyAzimuth: policy.keyAzimuth,
    keyIntensity: state.keyIntensity * policy.keyIntensityMultiplier,
    shadowFillIntensity: state.shadowFillIntensity * policy.shadowFillMultiplier,
    fillColor: policy.fillColor,
    facadeAmbientColor: policy.facadeAmbientColor,
    facadeAmbientIntensity: Math.min(.42, state.facadeAmbientIntensity * policy.facadeAmbientMultiplier),
    environmentIntensity: Number(Math.min(.5, state.environmentIntensity * policy.environmentMultiplier).toFixed(3)),
    bloomStrength: state.bloomStrength * policy.bloomMultiplier,
    shadowSoftness: policy.shadowSoftness,
  }
}

export function resolveCampusRendererPolicy(style) {
  return {
    toneMapping: normalizeCampusRenderStyle(style) === CAMPUS_RENDER_STYLES.unity
      ? THREE.NeutralToneMapping
      : THREE.ACESFilmicToneMapping,
  }
}
