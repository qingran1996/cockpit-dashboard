export const DEFAULT_CAMPUS_LIGHTING_MODE = 'evening'

export function deriveCampusOrbitPolicy({ reducedMotion = false } = {}) {
  return {
    autoRotate: false,
    enableDamping: !reducedMotion,
    dampingFactor: reducedMotion ? 0 : .055,
  }
}
