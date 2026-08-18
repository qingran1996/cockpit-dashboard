import * as THREE from 'three'

const MIN_DISTANCE = 1.8
const MAX_DISTANCE = 8

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function getFloorInspectionAnchor(floor) {
  if (!floor) return [0, 0, 0]
  floor.updateWorldMatrix(true, false)
  const contentCenterY = Number(floor.userData.contentCenterY) || 0
  return floor.localToWorld(new THREE.Vector3(0, contentCenterY, 0)).toArray()
}

export function createFloorCameraPose({ floorWorldPosition, buildingSize }) {
  const [x = 0, y = 0, z = 0] = floorWorldPosition ?? []
  const [width = 1, height = 1, depth = 1] = buildingSize ?? []
  const distance = clamp(
    Math.max(Math.abs(width) * .45, Math.abs(depth) * .90),
    MIN_DISTANCE,
    MAX_DISTANCE,
  )
  const targetLift = clamp(Math.abs(height) * .12, .18, .55)
  const cameraLift = clamp(Math.abs(height) * .36, .8, 2.0)
  const target = [x + Math.abs(width) * .03, y + targetLift, z + Math.abs(depth) * .08]

  return {
    target,
    position: [target[0] - distance * .55, target[1] + cameraLift, target[2] - distance],
    duration: 1050,
  }
}
