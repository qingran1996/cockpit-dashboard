import { sampleGateTrafficCycle } from './gateTrafficCycle.js'

export function updateVehicleAnimations(animatedItems, seconds, reducedMotion = false) {
  animatedItems.forEach((item) => {
    if (item.kind !== 'vehicle') return
    const baseZ = item.baseZ ?? item.object.position.z
    const baseRotationY = item.baseRotationY ?? 0
    if (reducedMotion || !item.distance || !item.speed) {
      item.object.position.z = baseZ
      item.object.rotation.y = baseRotationY
      return
    }

    const phaseOffset = Number(item.phase) || 0
    const cycle = sampleGateTrafficCycle(seconds + phaseOffset / item.speed, item.speed)
    item.object.position.z = baseZ + item.distance * cycle.vehicleProgress
    item.object.rotation.y = baseRotationY + (cycle.returning ? Math.PI : 0)
  })
}
