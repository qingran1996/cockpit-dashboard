import * as THREE from 'three'

const mod1 = (value) => ((value % 1) + 1) % 1

function smoothstep(value) {
  const x = Math.max(0, Math.min(1, value))
  return x * x * (3 - 2 * x)
}

export function sampleRouteCycle(seconds, speed = 1, phase = 0, loopMode = 'ping-pong', dwellFraction = .1) {
  const cycle = mod1(seconds * speed + phase)
  if (loopMode === 'loop') return { progress: cycle, returning: false, waiting: false }
  const dwell = Math.max(0, Math.min(.3, dwellFraction))
  const travel = (1 - dwell * 2) / 2
  if (cycle < travel) return { progress: smoothstep(cycle / travel), returning: false, waiting: false }
  if (cycle < travel + dwell) return { progress: 1, returning: false, waiting: true }
  if (cycle < travel * 2 + dwell) {
    return {
      progress: 1 - smoothstep((cycle - travel - dwell) / travel),
      returning: true,
      waiting: false,
    }
  }
  return { progress: 0, returning: true, waiting: true }
}

export function sampleTaskRouteCycle(seconds, speed = 1, phase = 0, dwellFraction = .15) {
  const cycle = mod1(seconds * speed + phase)
  const dwell = Math.max(.05, Math.min(.3, dwellFraction))
  const travel = (1 - dwell * 2) / 2
  if (cycle < travel) {
    return {
      progress: smoothstep(cycle / travel),
      returning: false,
      waiting: false,
      taskPhase: 'walking-to-task',
    }
  }
  if (cycle < travel + dwell) {
    return { progress: 1, returning: false, waiting: true, taskPhase: 'inspecting' }
  }
  if (cycle < travel * 2 + dwell) {
    return {
      progress: 1 - smoothstep((cycle - travel - dwell) / travel),
      returning: true,
      waiting: false,
      taskPhase: 'returning',
    }
  }
  return { progress: 0, returning: true, waiting: true, taskPhase: 'reporting' }
}

export function samplePolyline(points, progress) {
  if (!Array.isArray(points) || points.length < 2) throw new Error('route requires at least two points')
  const segments = []
  let totalLength = 0
  for (let index = 0; index < points.length - 1; index += 1) {
    const delta = points[index + 1].clone().sub(points[index])
    const length = delta.length()
    segments.push({ start: points[index], end: points[index + 1], delta, length })
    totalLength += length
  }
  if (totalLength <= Number.EPSILON) {
    return { position: points[0].clone(), tangent: new THREE.Vector3(0, 0, 1) }
  }
  const target = THREE.MathUtils.clamp(progress, 0, 1) * totalLength
  let traversed = 0
  for (const segment of segments) {
    if (segment.length <= Number.EPSILON) continue
    if (target <= traversed + segment.length) {
      const localProgress = (target - traversed) / segment.length
      return {
        position: segment.start.clone().lerp(segment.end, THREE.MathUtils.clamp(localProgress, 0, 1)),
        tangent: segment.delta.clone().divideScalar(segment.length),
      }
    }
    traversed += segment.length
  }
  const last = [...segments].reverse().find((segment) => segment.length > Number.EPSILON)
  return {
    position: points.at(-1).clone(),
    tangent: last.delta.clone().divideScalar(last.length),
  }
}

export function samplePolylineHeading(points, progress, lookDistance = 1.2) {
  if (!Array.isArray(points) || points.length < 2) throw new Error('route requires at least two points')
  let totalLength = 0
  for (let index = 0; index < points.length - 1; index += 1) {
    totalLength += points[index].distanceTo(points[index + 1])
  }
  const current = samplePolyline(points, progress)
  if (totalLength <= Number.EPSILON || lookDistance <= 0) return current.tangent
  const progressWindow = lookDistance / totalLength
  const before = samplePolyline(points, progress - progressWindow).position
  const after = samplePolyline(points, progress + progressWindow).position
  const heading = after.sub(before)
  return heading.lengthSq() > Number.EPSILON ? heading.normalize() : current.tangent
}
