function smoothstep(value) {
  const clamped = Math.max(0, Math.min(1, value))
  return clamped * clamped * (3 - 2 * clamped)
}

function crossingWindow(cycle, center) {
  const distance = Math.abs(cycle - center)
  const holdRadius = .075
  const rampRadius = .09
  if (distance <= holdRadius) return 1
  if (distance >= holdRadius + rampRadius) return 0
  return 1 - smoothstep((distance - holdRadius) / rampRadius)
}

export function gateOpenAmount(cycle) {
  const normalized = ((cycle % 1) + 1) % 1
  return Math.max(crossingWindow(normalized, .25), crossingWindow(normalized, .75))
}

export function updateGateAnimations(animatedItems, seconds, reducedMotion = false) {
  animatedItems.forEach((item) => {
    if (item.kind !== 'gate') return
    const axis = item.axis === 'x' ? 'x' : item.axis === 'y' ? 'y' : 'z'
    const baseAngle = item[`baseRotation${axis.toUpperCase()}`] ?? item.closedAngle ?? 0
    const closedAngle = item.closedAngle ?? baseAngle
    const openAngle = item.openAngle ?? closedAngle
    const amount = reducedMotion || !item.speed ? 0 : gateOpenAmount(seconds * item.speed + (item.phase ?? 0))
    item.object.rotation[axis] = closedAngle + (openAngle - closedAngle) * amount
  })
}
