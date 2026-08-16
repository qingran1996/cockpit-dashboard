export const cameraLimits = Object.freeze({
  minDistance: 18,
  maxDistance: 52,
  minPolarAngle: Math.PI * 0.18,
  maxPolarAngle: Math.PI * 0.47,
})

export const factoryCampusInitialView = Object.freeze({
  position: Object.freeze([12, 24, 36]),
  target: Object.freeze([0, .6, 0]),
  fov: 39,
})

export function normalizePointer(clientX, clientY, rect) {
  return {
    x: ((clientX - rect.left) / rect.width) * 2 - 1,
    y: -((clientY - rect.top) / rect.height) * 2 + 1,
  }
}

export function clampPixelRatio(devicePixelRatio) {
  return Math.min(Math.max(devicePixelRatio || 1, 1), 2)
}
