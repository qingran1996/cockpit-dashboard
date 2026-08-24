export const cameraLimits = Object.freeze({
  minDistance: 24,
  maxDistance: 112,
  minPolarAngle: Math.PI * 0.18,
  maxPolarAngle: Math.PI * 0.47,
})

export const initialCameraView = Object.freeze({
  position: Object.freeze([-43, 42, -55]),
  target: Object.freeze([0, 17.4, 0]),
  fov: 38,
  fogDensity: .0055,
  exposure: 1.86,
})

export const focusCameraView = Object.freeze({
  position: Object.freeze([-40, 38, -49]),
  target: Object.freeze([0, 15.2, 0]),
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
