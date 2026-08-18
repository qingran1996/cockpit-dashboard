import { sampleGateTrafficCycle } from './gateTrafficCycle.js'

export function gateOpenAmount(cycle) {
  return sampleGateTrafficCycle(cycle, 1).barrierOpen
}

export function updateGateAnimations(animatedItems, seconds, reducedMotion = false) {
  animatedItems.forEach((item) => {
    if (item.kind !== 'gate') return
    const axis = item.axis === 'x' ? 'x' : item.axis === 'y' ? 'y' : 'z'
    const baseAngle = item[`baseRotation${axis.toUpperCase()}`] ?? item.closedAngle ?? 0
    const closedAngle = item.closedAngle ?? baseAngle
    const openAngle = item.openAngle ?? closedAngle
    const phaseOffset = Number(item.phase) || 0
    const amount = reducedMotion || !item.speed
      ? 0
      : sampleGateTrafficCycle(seconds + phaseOffset / item.speed, item.speed).barrierOpen
    item.object.rotation[axis] = closedAngle + (openAngle - closedAngle) * amount
  })
}
