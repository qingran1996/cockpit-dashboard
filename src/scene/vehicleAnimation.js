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

    const cycle = (seconds * item.speed) % 1
    const returning = cycle > .5
    const laneProgress = returning ? (1 - cycle) * 2 : cycle * 2
    item.object.position.z = baseZ + item.distance * laneProgress
    item.object.rotation.y = baseRotationY + (returning ? Math.PI : 0)
  })
}
