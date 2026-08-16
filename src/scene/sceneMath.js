export const cameraLimits = Object.freeze({
  minDistance: 18,
  maxDistance: 105,
  farPlane: 200,
  minPolarAngle: Math.PI * 0.18,
  maxPolarAngle: Math.PI * 0.47,
})

export const factoryCampusFogDensity = .0095

export const factoryCampusInitialView = Object.freeze({
  position: Object.freeze([28, 56, 85]),
  target: Object.freeze([0, .6, 12]),
  fov: 39,
})

export const factoryCampusReferenceView = Object.freeze({
  position: Object.freeze([15, 30, 45]),
  target: Object.freeze([0, .6, 0]),
  fov: 39,
})

export const factoryCampusFirstPersonSpawn = Object.freeze({
  position: Object.freeze([-10.5, .45, 23.8]),
  yaw: 0,
  pitch: -.04,
})

export function getBuildingFocusView(record) {
  const span = Math.max(record.size[0], record.size[2])
  const distance = span * 1.15 + 3
  const target = [record.position[0], .6, record.position[2]]
  return {
    position: [
      target[0] + distance * .55,
      target[1] + Math.max(4, record.size[1] * 1.1),
      target[2] + distance * .72,
    ],
    target,
  }
}

export function getFirstPersonLookTarget(position, yaw, pitch) {
  const horizontal = Math.cos(pitch)
  return [
    position[0] + Math.sin(yaw) * horizontal,
    position[1] + Math.sin(pitch),
    position[2] - Math.cos(yaw) * horizontal,
  ]
}

export function isFirstPersonPositionClear(position, obstacles, site, clearance = 1.1) {
  const [x, , z] = position
  if (Math.abs(x) > site.width / 2 - 1 || Math.abs(z) > site.depth / 2 - 1) return false
  return !obstacles.some((obstacle) => (
    Math.abs(x - obstacle.position[0]) < obstacle.size[0] / 2 + clearance
    && Math.abs(z - obstacle.position[2]) < obstacle.size[2] / 2 + clearance
  ))
}

export function moveFirstPerson(position, yaw, input, distance, obstacles, site) {
  const inputLength = Math.hypot(input.forward, input.strafe)
  if (!inputLength || !distance) return [...position]
  const forward = input.forward / inputLength
  const strafe = input.strafe / inputLength
  const deltaX = (Math.sin(yaw) * forward + Math.cos(yaw) * strafe) * distance
  const deltaZ = (-Math.cos(yaw) * forward + Math.sin(yaw) * strafe) * distance
  const limitX = site.width / 2 - 1
  const limitZ = site.depth / 2 - 1
  const proposed = [
    Math.max(-limitX, Math.min(limitX, position[0] + deltaX)),
    position[1],
    Math.max(-limitZ, Math.min(limitZ, position[2] + deltaZ)),
  ]
  if (isFirstPersonPositionClear(proposed, obstacles, site)) return proposed

  const slideX = [proposed[0], position[1], position[2]]
  if (isFirstPersonPositionClear(slideX, obstacles, site)) return slideX
  const slideZ = [position[0], position[1], proposed[2]]
  if (isFirstPersonPositionClear(slideZ, obstacles, site)) return slideZ
  return [...position]
}

export function normalizePointer(clientX, clientY, rect) {
  return {
    x: ((clientX - rect.left) / rect.width) * 2 - 1,
    y: -((clientY - rect.top) / rect.height) * 2 + 1,
  }
}

export function clampPixelRatio(devicePixelRatio) {
  return Math.min(Math.max(devicePixelRatio || 1, 1), 2)
}
