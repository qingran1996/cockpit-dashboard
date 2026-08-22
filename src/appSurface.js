export const APP_SURFACES = Object.freeze({
  campus: 'campus',
  unityOverlay: 'unity-overlay',
})

export function resolveAppSurface(pathname = '/') {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  return normalizedPath === '/unity-dashboard'
    ? APP_SURFACES.unityOverlay
    : APP_SURFACES.campus
}
