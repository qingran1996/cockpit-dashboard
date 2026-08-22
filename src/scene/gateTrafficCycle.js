const STOP_PROGRESS = .35
const RECOGNITION_START = .135
const STOP_TIME = .18
const FULLY_OPEN_TIME = .235
const CROSSING_START = .27

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
  let vehicleProgress = STOP_PROGRESS * smoothstep(halfCycle / STOP_TIME)

  if (halfCycle >= RECOGNITION_START && halfCycle < STOP_TIME) {
    phase = 'recognition-opening'
  } else if (halfCycle >= STOP_TIME && halfCycle < CROSSING_START) {
    phase = 'recognition-wait'
    waiting = true
  } else if (halfCycle >= CROSSING_START && halfCycle < .42) {
    phase = 'crossing'
  } else if (halfCycle >= .42) {
    phase = 'clear-and-close'
  }

  if (halfCycle >= RECOGNITION_START && halfCycle < FULLY_OPEN_TIME) {
    barrierOpen = smoothstep((halfCycle - RECOGNITION_START) / (FULLY_OPEN_TIME - RECOGNITION_START))
  } else if (halfCycle >= FULLY_OPEN_TIME && halfCycle < .42) {
    barrierOpen = 1
  } else if (halfCycle >= .42) {
    barrierOpen = 1 - smoothstep((halfCycle - .42) / .08)
  }

  if (halfCycle >= CROSSING_START && halfCycle < .42) {
    vehicleProgress = STOP_PROGRESS + (1 - STOP_PROGRESS) * smoothstep((halfCycle - CROSSING_START) / (.42 - CROSSING_START))
  } else if (halfCycle >= .42) {
    vehicleProgress = 1
  } else if (halfCycle >= STOP_TIME) {
    vehicleProgress = STOP_PROGRESS
  }

  return { phase, vehicleProgress, barrierOpen, waiting, returning }
}
