import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveCampusLightingState } from '../src/scene/campusLightingMode.js'

const facadeInspectionHeadings = [0, 60, 120, 180, 240, 300]

function estimateFacadeFloor(state, headingDegrees) {
  const radians = headingDegrees * Math.PI / 180
  const oppositeFill = Math.max(0, Math.cos(radians - Math.PI)) * state.shadowFillIntensity * 0.16
  return state.facadeAmbientIntensity + state.environmentIntensity * 0.18 + oppositeFill
}

test('keeps pale facades readable from six daylight headings with restrained environment reflection', () => {
  const day = deriveCampusLightingState('day')

  assert.ok(day.facadeAmbientIntensity >= 0.22, 'pale walls need a neutral orientation-independent floor')
  assert.equal(day.environmentIntensity, 0.1, 'daylight uses the approved restrained PMREM response')
  assert.ok(day.exposure >= 1.25 && day.exposure <= 1.48, 'day exposure must preserve white-wall highlight detail')
  assert.ok(day.keyIntensity >= day.shadowFillIntensity * 3, 'the pale-wall fill must not erase the daylight direction')

  const samples = facadeInspectionHeadings.map((heading) => ({
    heading,
    floor: estimateFacadeFloor(day, heading),
  }))
  assert.ok(samples.every(({ floor }) => floor >= 0.23), JSON.stringify(samples))
})
