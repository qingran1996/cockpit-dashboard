import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {
  campusSeededValue,
  campusRoadSegments,
  campusCourtFootprint,
  campusGateDefinitions,
  campusPerimeterSegments,
  campusSite,
  createFactoryCampusSystems,
  createFactoryCampusLights,
  createFactoryCampusMaterials,
  facadeBayLayout,
  pipeRackRoutes,
  isInteriorTreePositionClear,
  pedestrianRoutes,
  externalParkingLot,
  externalRoadSegments,
  parkingSpaceLayout,
  roofVentFootprint,
  roofVentLayout,
  samplePedestrianRoute,
  sampleVehicleRoute,
  supportedRoofTypes,
  vehicleRoutes,
} from '../src/scene/factoryCampusFactory.js'
import { factoryCampusRegistry } from '../src/scene/factoryCampusRegistry.js'

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

test('pipe racks follow visible service corridors instead of crossing roofs', () => {
  assert.ok(pipeRackRoutes.length >= 2)
  assert.ok(pipeRackRoutes.every(({ y }) => y >= 1.2 && y <= 1.6))
  assert.ok(pipeRackRoutes.some(({ from, to }) => from[1] !== to[1]))
})

test('pedestrian routes loop continuously through measured walkway points', () => {
  assert.ok(pedestrianRoutes.length >= 3)
  assert.equal(pedestrianRoutes.reduce((count, route) => count + route.count, 0), 8)

  for (const route of pedestrianRoutes) {
    assert.ok(route.points.length >= 2)
    const start = samplePedestrianRoute(route.points, 0)
    const looped = samplePedestrianRoute(route.points, 1)
    const advanced = samplePedestrianRoute(route.points, .25)
    assert.deepEqual(looped.position, start.position)
    assert.ok(Math.hypot(
      advanced.position[0] - start.position[0],
      advanced.position[1] - start.position[1],
    ) > .1)
    assert.ok(Math.hypot(...start.direction) > .99)
  }
})

test('expanded campus leaves a landscaped safety margin around every building', () => {
  assert.ok(campusSite.width >= 68)
  assert.ok(campusSite.depth >= 52)
  for (const building of factoryCampusRegistry) {
    const clearanceX = campusSite.width / 2
      - (Math.abs(building.position[0]) + building.size[0] / 2)
    const clearanceZ = campusSite.depth / 2
      - (Math.abs(building.position[2]) + building.size[2] / 2)
    assert.ok(clearanceX >= 3, `${building.id} has only ${clearanceX} horizontal clearance`)
    assert.ok(clearanceZ >= 3, `${building.id} has only ${clearanceZ} depth clearance`)
  }
})

test('parking provides two usable rows fully inside the factory perimeter', () => {
  assert.ok(Math.abs(externalParkingLot.x) + externalParkingLot.width / 2 <= campusSite.width / 2 - 1)
  assert.ok(Math.abs(externalParkingLot.z) + externalParkingLot.depth / 2 <= campusSite.depth / 2 - 1)
  assert.ok(externalParkingLot.width >= 18)
  assert.ok(externalParkingLot.depth >= 6)
  assert.ok(parkingSpaceLayout.length >= 20)
  assert.deepEqual(new Set(parkingSpaceLayout.map(({ row }) => row)), new Set([0, 1]))
})

test('external roads connect front and east approaches without occupying the factory interior', () => {
  assert.ok(externalRoadSegments.length >= 2)
  assert.ok(externalRoadSegments.some(({ id }) => id === 'front-external-road'))
  assert.ok(externalRoadSegments.some(({ id }) => id === 'east-external-road'))
  assert.ok(externalRoadSegments.every((road) => (
    Math.abs(road.x) - road.width / 2 >= campusSite.width / 2
    || Math.abs(road.z) - road.depth / 2 >= campusSite.depth / 2
  )))
})

test('vehicle routes loop through the parking aisle with deterministic motion', () => {
  assert.ok(vehicleRoutes.length >= 2)
  assert.ok(vehicleRoutes.some(({ purpose }) => purpose === 'parking'))
  assert.equal(vehicleRoutes.reduce((count, route) => count + route.count, 0), 6)

  const mainGate = campusGateDefinitions.find(({ edge }) => edge === 'front')
  const parkingRoute = vehicleRoutes.find(({ purpose }) => purpose === 'parking')
  assert.ok(mainGate)
  assert.ok(parkingRoute.points.some(([, z]) => z > campusSite.depth / 2))
  assert.ok(parkingRoute.points.some(([, z]) => z < mainGate.center[1] - 4))
  const gateCrossings = parkingRoute.points.filter(([x, z]) => (
    Math.abs(z - mainGate.center[1]) < .1
    && Math.abs(x - mainGate.center[0]) < mainGate.openingWidth / 2
  ))
  assert.ok(gateCrossings.length >= 2, 'parking route must enter and exit through the main gate')
  for (const route of vehicleRoutes) {
    const start = sampleVehicleRoute(route.points, 0)
    const looped = sampleVehicleRoute(route.points, 1)
    const advanced = sampleVehicleRoute(route.points, .2)
    assert.deepEqual(looped.position, start.position)
    assert.ok(Math.hypot(
      advanced.position[0] - start.position[0],
      advanced.position[1] - start.position[1],
    ) > .5)
    assert.ok(Math.hypot(...start.direction) > .99)
  }
})

test('campus perimeter is enclosed by six fence runs with two distinct vehicle gates', () => {
  assert.equal(campusGateDefinitions.length, 2)
  assert.deepEqual(
    new Set(campusGateDefinitions.map(({ edge }) => edge)),
    new Set(['front', 'east']),
  )
  assert.ok(campusGateDefinitions.every(({ openingWidth }) => openingWidth >= 4.8))
  assert.equal(campusPerimeterSegments.length, 6)
  assert.deepEqual(
    new Set(campusPerimeterSegments.map(({ edge }) => edge)),
    new Set(['front', 'rear', 'west', 'east']),
  )

  const systems = createFactoryCampusSystems([])
  const perimeter = systems.getObjectByName('perimeter-system')
  assert.ok(perimeter)
  for (const gate of campusGateDefinitions) {
    const gateObject = perimeter.getObjectByName(`campus-gate-${gate.id}`)
    assert.ok(gateObject, `missing rendered ${gate.id} gate`)
    assert.ok(gateObject.children.length >= 5, `${gate.id} gate is not visually articulated`)
  }
})

test('perimeter landscaping keeps both vehicle gate openings clear', () => {
  const systems = createFactoryCampusSystems([])
  const trees = systems.getObjectByName('tree-trunks')
  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()
  assert.ok(trees?.isInstancedMesh)

  for (let index = 0; index < trees.count; index += 1) {
    trees.getMatrixAt(index, matrix)
    position.setFromMatrixPosition(matrix)
    for (const gate of campusGateDefinitions) {
      const alongOpening = gate.edge === 'front'
        ? Math.abs(position.x - gate.center[0])
        : Math.abs(position.z - gate.center[1])
      const nearBoundary = gate.edge === 'front'
        ? Math.abs(position.z - gate.center[1]) < 1
        : Math.abs(position.x - gate.center[0]) < 1
      assert.ok(
        !nearBoundary || alongOpening >= gate.openingWidth / 2 + .6,
        `tree ${index} blocks ${gate.id}`,
      )
    }
  }
})

test('road segments stay in service corridors instead of cutting through buildings', () => {
  for (const road of campusRoadSegments) {
    for (const building of factoryCampusRegistry) {
      const overlapX = Math.min(road.x + road.width / 2, building.position[0] + building.size[0] / 2)
        - Math.max(road.x - road.width / 2, building.position[0] - building.size[0] / 2)
      const overlapZ = Math.min(road.z + road.depth / 2, building.position[2] + building.size[2] / 2)
        - Math.max(road.z - road.depth / 2, building.position[2] - building.size[2] / 2)
      assert.ok(overlapX <= .05 || overlapZ <= .05, `${road.id} crosses ${building.id}`)
    }
  }
})

test('court and interior trees stay clear of building and road footprints', () => {
  for (const building of factoryCampusRegistry) {
    assert.equal(
      isInteriorTreePositionClear(building.position[0], building.position[2]),
      false,
      `tree clearance missed ${building.id}`,
    )

    const overlapX = Math.min(
      campusCourtFootprint.x + campusCourtFootprint.width / 2,
      building.position[0] + building.size[0] / 2,
    ) - Math.max(
      campusCourtFootprint.x - campusCourtFootprint.width / 2,
      building.position[0] - building.size[0] / 2,
    )
    const overlapZ = Math.min(
      campusCourtFootprint.z + campusCourtFootprint.depth / 2,
      building.position[2] + building.size[2] / 2,
    ) - Math.max(
      campusCourtFootprint.z - campusCourtFootprint.depth / 2,
      building.position[2] - building.size[2] / 2,
    )
    assert.ok(overlapX <= .05 || overlapZ <= .05, `court overlaps ${building.id}`)
  }

  for (const road of campusRoadSegments) {
    assert.equal(isInteriorTreePositionClear(road.x, road.z), false, `tree clearance missed ${road.id}`)
  }
  assert.equal(
    isInteriorTreePositionClear(externalParkingLot.x, externalParkingLot.z),
    false,
    'tree clearance missed internal parking lot',
  )
  assert.equal(isInteriorTreePositionClear(-14, -11), true)
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
