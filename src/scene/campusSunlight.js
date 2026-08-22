export const DEFAULT_CAMPUS_SUNLIGHT = Object.freeze({
  day: 78,
  evening: 42,
})

export function clampCampusSunlight(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.min(100, Math.max(0, Math.round(numeric)))
}

export function resolveCampusSunlight(values, mode) {
  const fallback = mode === 'evening' ? DEFAULT_CAMPUS_SUNLIGHT.evening : DEFAULT_CAMPUS_SUNLIGHT.day
  return clampCampusSunlight(values?.[mode] ?? fallback)
}

export function updateCampusSunlight(values, mode, value) {
  const safeMode = mode === 'evening' ? 'evening' : 'day'
  return {
    ...DEFAULT_CAMPUS_SUNLIGHT,
    ...values,
    [safeMode]: clampCampusSunlight(value),
  }
}
