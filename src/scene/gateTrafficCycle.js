const STOP_PROGRESS = .35

function clamp01(value) {
  return Math.max(0, Math.min(1, value))
}

function smoothstep(value) {
  const clamped = clamp01(value)
  return clamped * clamped * (3 - 2 * clamped)
}

export function sampleGateTrafficCycle(seconds, speed = 1) {
  const cycle = ((seconds * speed) % 1 + 1) % 1
  const returning = cycle >= .5
  const halfCycle = returning ? 1 - cycle : cycle

  let phase = 'approach'
  let waiting = false
  let barrierOpen = 0
  let vehicleProgress = STOP_PROGRESS * smoothstep(halfCycle / .18)

  if (halfCycle >= .18 && halfCycle < .23) {
    phase = 'recognition-wait'
    waiting = true
  } else if (halfCycle >= .23 && halfCycle < .27) {
    phase = 'opening'
    waiting = true
  } else if (halfCycle >= .27 && halfCycle < .42) {
    phase = 'crossing'
  } else if (halfCycle >= .42) {
    phase = 'clear-and-close'
  }

  if (halfCycle >= .18 && halfCycle < .27) {
    barrierOpen = smoothstep((halfCycle - .18) / .09)
  } else if (halfCycle >= .27 && halfCycle < .42) {
    barrierOpen = 1
  } else if (halfCycle >= .42) {
    barrierOpen = 1 - smoothstep((halfCycle - .42) / .08)
  }

  if (halfCycle >= .27 && halfCycle < .42) {
    vehicleProgress = STOP_PROGRESS + (1 - STOP_PROGRESS) * smoothstep((halfCycle - .27) / .15)
  } else if (halfCycle >= .42) {
    vehicleProgress = 1
  } else if (halfCycle >= .18) {
    vehicleProgress = STOP_PROGRESS
  }

  return { phase, vehicleProgress, barrierOpen, waiting, returning }
}
