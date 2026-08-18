const MIN_DISTANCE = 1.8
const MAX_DISTANCE = 4.2

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function createFloorCameraPose({ floorWorldPosition, buildingSize }) {
  const [x = 0, y = 0, z = 0] = floorWorldPosition ?? []
  const [width = 1, height = 1, depth = 1] = buildingSize ?? []
  const distance = clamp(Math.min(Math.abs(width), Math.abs(depth)) * .62, MIN_DISTANCE, MAX_DISTANCE)
  const targetLift = clamp(Math.abs(height) * .12, .18, .55)
  const cameraLift = clamp(Math.abs(height) * .28, .6, 1.35)
  const target = [x, y + targetLift, z]

  return {
    target,
    position: [x - distance * .55, target[1] + cameraLift, z - distance],
    duration: 1050,
  }
}
