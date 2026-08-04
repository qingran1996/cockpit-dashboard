export function calculateViewportScale(
  viewportWidth,
  viewportHeight,
  designWidth = 1920,
  designHeight = 1080,
) {
  const scale = Math.min(viewportWidth / designWidth, viewportHeight / designHeight)

  return {
    scale,
    left: (viewportWidth - designWidth * scale) / 2,
    top: (viewportHeight - designHeight * scale) / 2,
  }
}
