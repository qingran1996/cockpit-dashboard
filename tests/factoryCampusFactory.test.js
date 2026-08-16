import test from 'node:test'
import assert from 'node:assert/strict'
import {
  campusSeededValue,
  createFactoryCampusLights,
  createFactoryCampusMaterials,
  facadeBayLayout,
  pipeRackRoutes,
  roofVentFootprint,
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

test('pipe racks clear the roofs along their routes', () => {
  assert.ok(pipeRackRoutes.length >= 2)
  assert.ok(pipeRackRoutes.every(({ y }) => y >= 3.5))
})

test('stepped roofs keep vents on the smaller upper roof', () => {
  assert.deepEqual(
    roofVentFootprint({ roofType: 'stepped', size: [10, 4, 5] }),
    [6, 3.2],
  )
  assert.deepEqual(
    roofVentFootprint({ roofType: 'flat', size: [10, 4, 5] }),
    [10, 5],
  )
})

test('factory campus lighting keeps pale industrial walls readable in the dark dashboard', () => {
  const lights = createFactoryCampusLights()
  const hemisphere = lights.children.find((child) => child.isHemisphereLight)
  const key = lights.children.find((child) => child.isDirectionalLight && child.castShadow)
  const neutralFill = lights.children.find(
    (child) => child.isDirectionalLight && !child.castShadow,
  )

  assert.ok(hemisphere?.intensity >= 2.6)
  assert.ok(key?.intensity >= 3.6)
  assert.ok(neutralFill?.intensity >= 1.35)
})

test('factory campus materials preserve the reference image pale gray palette', () => {
  const materials = createFactoryCampusMaterials()
  const wall = materials.wall.color
  const roof = materials.roof.color

  assert.ok(wall.r >= 0.68 && wall.g >= 0.72 && wall.b >= 0.74)
  assert.ok(roof.r >= 0.42 && roof.g >= 0.45 && roof.b >= 0.48)
  assert.ok(Math.max(roof.r, roof.g, roof.b) - Math.min(roof.r, roof.g, roof.b) < 0.12)
})
