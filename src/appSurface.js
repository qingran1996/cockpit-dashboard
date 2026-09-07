export const APP_SURFACES = Object.freeze({
  campus: 'campus',
  unityOverlay: 'unity-overlay',
  part1Chart: 'part-1-chart',
  part2Chart: 'part-2-chart',
  rotaryKiln: 'rotary-kiln',
})

const CAMPUS_CENTER_STAGE = Object.freeze({
  renderFactoryModel: true,
  renderUnityViewport: false,
})

const UNITY_CENTER_STAGE = Object.freeze({
  renderFactoryModel: false,
  renderUnityViewport: true,
})

export function resolveAppSurface(pathname = '/') {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  if (normalizedPath === '/unity-dashboard') return APP_SURFACES.unityOverlay
  if (normalizedPath === '/test1') return APP_SURFACES.part1Chart
  if (normalizedPath === '/test2') return APP_SURFACES.part2Chart
  if (normalizedPath === '/rotary-kiln') return APP_SURFACES.rotaryKiln
  return APP_SURFACES.campus
}

export function resolveCenterStage(surfaceMode) {
  return surfaceMode === APP_SURFACES.unityOverlay
    ? UNITY_CENTER_STAGE
    : CAMPUS_CENTER_STAGE
}

export function resolveSurfaceTransform(surfaceMode, viewport) {
  if (surfaceMode === APP_SURFACES.unityOverlay) {
    return `translate(0px, 0px) scale(${viewport.viewportWidth / 1920}, ${viewport.viewportHeight / 1080})`
  }
  return `translate(${viewport.left}px, ${viewport.top}px) scale(${viewport.scale})`
}
