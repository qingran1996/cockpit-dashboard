import { sampleGateTrafficCycle } from './gateTrafficCycle.js'
import { samplePolyline, samplePolylineHeading, sampleRouteCycle } from './campusRouteAnimation.js'

export function updateVehicleAnimations(animatedItems, seconds, reducedMotion = false, trafficEnabled = true) {
  animatedItems.forEach((item) => {
    if (item.kind === 'route-vehicle') {
      if (reducedMotion || !trafficEnabled || !item.speed) {
        item.object.position.copy(item.route.points[0])
        item.object.rotation.y = item.baseRotationY ?? 0
        return
      }
      const cycle = sampleRouteCycle(seconds, item.speed, item.phase, item.route.loopMode, item.route.dwellFraction)
      const sample = samplePolyline(item.route.points, cycle.progress)
      item.object.position.copy(sample.position)
      if (!cycle.waiting && sample.tangent.lengthSq() > 0) {
        const routeHeading = samplePolylineHeading(item.route.points, cycle.progress)
        const tangent = cycle.returning ? routeHeading.negate() : routeHeading
        item.object.rotation.y = Math.atan2(tangent.z, -tangent.x)
      }
      return
    }
    if (item.kind !== 'vehicle') return
    const baseX = item.baseX ?? item.object.position.x
    const baseZ = item.baseZ ?? item.object.position.z
    const baseRotationY = item.baseRotationY ?? 0
    if (reducedMotion || !trafficEnabled || !item.distance || !item.speed) {
      item.object.position.x = baseX
      item.object.position.z = baseZ
      item.object.rotation.y = baseRotationY
      return
    }

    const phaseOffset = Number(item.phase) || 0
    const cycle = sampleGateTrafficCycle(seconds + phaseOffset / item.speed, item.speed)
    if (item.axis === 'x') {
      item.object.position.x = baseX + item.distance * cycle.vehicleProgress
      item.object.position.z = baseZ
    } else {
      item.object.position.x = baseX
      item.object.position.z = baseZ + item.distance * cycle.vehicleProgress
    }
    item.object.rotation.y = baseRotationY + (cycle.returning ? Math.PI : 0)
  })
}
