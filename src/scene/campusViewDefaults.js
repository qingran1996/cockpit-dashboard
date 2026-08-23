export const DEFAULT_CAMPUS_LIGHTING_MODE = 'evening'

const DESIGN_WIDTH = 1920
const DESIGN_HEIGHT = 1080

export function resolveCampusFocusViewport(viewportWidth, viewportHeight) {
  const width = Math.max(1, Number(viewportWidth) || DESIGN_WIDTH)
  const height = Math.max(1, Number(viewportHeight) || DESIGN_HEIGHT)
  const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT)
  const renderedWidth = DESIGN_WIDTH * scale
  const renderedHeight = DESIGN_HEIGHT * scale
  const left = (width - renderedWidth) / 2
  const top = (height - renderedHeight) / 2
  return {
    scene: { left: 0, top: 0, width: DESIGN_WIDTH, height: DESIGN_HEIGHT },
    screen: { left, top, right: left + renderedWidth, bottom: top + renderedHeight },
    controls: { top: 42, right: 42 },
  }
}

export function deriveCampusOrbitPolicy({ reducedMotion = false } = {}) {
  return {
    autoRotate: false,
    enableDamping: !reducedMotion,
    dampingFactor: reducedMotion ? 0 : .055,
  }
}
