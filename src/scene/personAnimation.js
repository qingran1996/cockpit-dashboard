export function updatePersonAnimations(animatedItems, seconds, reducedMotion = false) {
  animatedItems.forEach((item) => {
    if (item.kind !== 'person') return
    const baseX = item.baseX ?? item.object.position.x
    const baseY = item.baseY ?? item.object.position.y
    const baseRotationY = item.baseRotationY ?? item.object.rotation.y

    if (reducedMotion || !item.distance || !item.speed) {
      item.object.position.x = baseX
      item.object.position.y = baseY
      item.object.rotation.y = baseRotationY
      if (item.leftLeg) item.leftLeg.rotation.x = 0
      if (item.rightLeg) item.rightLeg.rotation.x = 0
      return
    }

    const cycle = (seconds * item.speed + (item.phase ?? 0)) % 1
    const returning = cycle > .5
    const laneProgress = returning ? (1 - cycle) * 2 : cycle * 2
    const stride = Math.sin(cycle * Math.PI * 4)
    item.object.position.x = baseX + item.distance * laneProgress
    item.object.position.y = baseY + Math.abs(stride) * .025
    item.object.rotation.y = baseRotationY + (returning ? -Math.PI / 2 : Math.PI / 2)
    if (item.leftLeg) item.leftLeg.rotation.x = stride * .45
    if (item.rightLeg) item.rightLeg.rotation.x = -stride * .45
  })
}
