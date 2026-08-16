import test from 'node:test'
import assert from 'node:assert/strict'
import {
  campusSeededValue,
  facadeBayLayout,
  roofVentLayout,
  supportedRoofTypes,
} from '../src/scene/factoryCampusFactory.js'

test('campus seeded values are deterministic and normalized', () => {
  const first = Array.from({ length: 12 }, (_, index) => campusSeededValue(index))
  const second = Array.from({ length: 12 }, (_, index) => campusSeededValue(index))
  assert.deepEqual(first, second)
  assert.ok(first.every((value) => value >= 0 && value < 1))
  assert.ok(new Set(first).size > 8)
})

test('roof vent layout stays inside the roof footprint', () => {
  const vents = roofVentLayout([8, 3], 1.45)
  assert.ok(vents.length >= 8)
  for (const [x, z] of vents) {
    assert.ok(Math.abs(x) < 4)
    assert.ok(Math.abs(z) < 1.5)
  }
})

test('facade bays are centered and repeat at a stable spacing', () => {
  const bays = facadeBayLayout(9.2, 1.35)
  assert.ok(bays.length >= 5)
  assert.ok(Math.abs(bays.reduce((sum, value) => sum + value, 0)) < 1e-9)
  for (let index = 1; index < bays.length; index += 1) {
    assert.ok(bays[index] > bays[index - 1])
  }
})

test('every registry roof type has a geometry strategy', () => {
  assert.deepEqual([...supportedRoofTypes].sort(), ['flat', 'shallow', 'stepped'])
})
