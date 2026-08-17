export const cameraLimits = Object.freeze({
  minDistance: 24,
  maxDistance: 72,
  minPolarAngle: Math.PI * 0.18,
  maxPolarAngle: Math.PI * 0.47,
})

export const initialCameraView = Object.freeze({
  position: Object.freeze([-34, 26, -42]),
  target: Object.freeze([0, 1.2, -3]),
  fov: 38,
  fogDensity: .012,
  exposure: 1.55,
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
