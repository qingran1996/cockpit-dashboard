export const cameraLimits = Object.freeze({
  minDistance: 24,
  maxDistance: 112,
  minPolarAngle: Math.PI * 0.18,
  maxPolarAngle: Math.PI * 0.47,
})

export const initialCameraView = Object.freeze({
  position: Object.freeze([-47, 29, -58]),
  target: Object.freeze([0, 1.4, -3.2]),
  fov: 38,
  fogDensity: .0055,
  exposure: 1.86,
})

export const focusCameraView = Object.freeze({
  position: Object.freeze([-43, 26, -53]),
  target: Object.freeze([0, .35, -1.8]),
  fov: 38,
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
