import * as THREE from 'three'
import { factoryCampusRegistry } from './factoryCampusRegistry.js'

const COLORS = {
  navy: 0x05131d,
  cyan: 0x23d7ea,
  blue: 0x287ca8,
  wall: 0xe3e5e6,
  roof: 0xb8bcc0,
  glass: 0x123c55,
  asphalt: 0x17232b,
  lawn: 0x153c32,
  court: 0x8f433a,
}

export const supportedRoofTypes = new Set(['flat', 'shallow', 'stepped'])

export function campusSeededValue(index) {
  const value = Math.sin((index + 1) * 12.9898 + 78.233) * 43758.5453
  return value - Math.floor(value)
}

export function roofVentLayout([width, depth], spacing = 1.4) {
  const columns = Math.max(2, Math.floor((width - 1) / spacing))
  const rows = Math.max(2, Math.floor((depth - .8) / spacing))
  const stepX = width / (columns + 1)
  const stepZ = depth / (rows + 1)
  const points = []
  for (let row = 1; row <= rows; row += 1) {
    for (let column = 1; column <= columns; column += 1) {
      points.push([-width / 2 + stepX * column, -depth / 2 + stepZ * row])
    }
  }
  return points
}

export function facadeBayLayout(length, spacing = 1.35) {
  const count = Math.max(2, Math.floor(length / spacing))
  const step = length / count
  return Array.from({ length: count }, (_, index) => -length / 2 + step * (index + .5))
}

function box(width, height, depth, material, name, y = height / 2) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material)
  mesh.position.y = y
  mesh.name = name
  return mesh
}

function addEdges(mesh, material, opacity = .55) {
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 28), material.clone())
  edges.name = `${mesh.name}-edges`
  edges.material.transparent = true
  edges.material.opacity = opacity
  edges.renderOrder = 3
  mesh.add(edges)
}

function setInstanceMatrix(instanced, index, position, scale = [1, 1, 1], rotationY = 0) {
  const matrix = new THREE.Matrix4()
  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotationY, 0))
  matrix.compose(
    new THREE.Vector3(...position),
    quaternion,
    new THREE.Vector3(...scale),
  )
  instanced.setMatrixAt(index, matrix)
}

export function roofVentFootprint(record) {
  if (record.roofType === 'stepped') return [record.size[0] * .6, record.size[2] * .64]
  return [record.size[0], record.size[2]]
}

function addRoofVents(group, record, materials, roofY) {
  const points = roofVentLayout(roofVentFootprint(record), record.id === 'main-production-hall' ? 1.75 : 1.55)
  const geometry = new THREE.CylinderGeometry(.11, .15, .15, 10)
  const vents = new THREE.InstancedMesh(geometry, materials.metal, points.length)
  vents.name = `${record.id}-roof-vents`
  points.forEach(([x, z], index) => setInstanceMatrix(vents, index, [x, roofY + .09, z]))
  vents.castShadow = true
  vents.receiveShadow = true
  group.add(vents)
}

function addSkylights(group, record, materials, roofY) {
  if (!['main-production-hall', 'rear-high-bay'].includes(record.id)) return
  const width = record.size[0]
  const count = Math.max(4, Math.floor(width / 1.65))
  const geometry = new THREE.BoxGeometry(.62, .055, .34)
  const skylights = new THREE.InstancedMesh(geometry, materials.skylight, count * 2)
  skylights.name = `${record.id}-skylights`
  for (let index = 0; index < count; index += 1) {
    const x = -width / 2 + width * ((index + .5) / count)
    setInstanceMatrix(skylights, index * 2, [x, roofY + .065, -.62])
    setInstanceMatrix(skylights, index * 2 + 1, [x, roofY + .065, .62])
  }
  group.add(skylights)
}

function addFacadeOpenings(group, record, materials) {
  const [width, height, depth] = record.size
  const frontBays = facadeBayLayout(width, record.id === 'main-production-hall' ? 1.7 : 1.42)
  const windowGeometry = new THREE.BoxGeometry(.48, .16, .055)
  const rows = record.levels > 1 ? Math.min(3, record.levels) : 1
  const windows = new THREE.InstancedMesh(windowGeometry, materials.glass, frontBays.length * rows)
  windows.name = `${record.id}-front-windows`
  frontBays.forEach((x, column) => {
    for (let row = 0; row < rows; row += 1) {
      const y = height * (.36 + row * .19)
      setInstanceMatrix(windows, column * rows + row, [x, y, depth / 2 + .035])
    }
  })
  group.add(windows)

  const sideBays = facadeBayLayout(depth, 1.45)
  const sideGeometry = new THREE.BoxGeometry(.055, .16, .45)
  const sideWindows = new THREE.InstancedMesh(sideGeometry, materials.glass, sideBays.length)
  sideWindows.name = `${record.id}-side-windows`
  sideBays.forEach((z, index) => setInstanceMatrix(sideWindows, index, [width / 2 + .035, height * .42, z]))
  group.add(sideWindows)

  const doorCount = width > 8 ? 3 : 2
  const doorGeometry = new THREE.BoxGeometry(.64, .82, .09)
  const doors = new THREE.InstancedMesh(doorGeometry, materials.door, doorCount)
  doors.name = `${record.id}-loading-bays`
  for (let index = 0; index < doorCount; index += 1) {
    const x = width * (.5 - (index + 1) / (doorCount + 1))
    setInstanceMatrix(doors, index, [x, .43, depth / 2 + .055])
  }
  group.add(doors)
}

function addAdministrationFacade(group, record, materials) {
  const [width, height, depth] = record.size
  const bays = facadeBayLayout(width * .9, 1.1)
  const pierGeometry = new THREE.BoxGeometry(.16, height * .84, .18)
  const piers = new THREE.InstancedMesh(pierGeometry, materials.adminStone, bays.length + 1)
  piers.name = 'administration-facade-piers'
  bays.forEach((x, index) => setInstanceMatrix(piers, index, [x, height * .48, depth / 2 + .09]))
  setInstanceMatrix(piers, bays.length, [width * .44, height * .48, depth / 2 + .09])
  group.add(piers)

  const glazing = box(width * .76, height * .68, .08, materials.glass, 'administration-glazing', height * .49)
  glazing.position.z = depth / 2 + .06
  group.add(glazing)
  const canopy = box(1.15, .16, .62, materials.roofTrim, 'administration-entry-canopy', 1.05)
  canopy.position.z = depth / 2 + .36
  group.add(canopy)
}

export function createFactoryCampusMaterials() {
  return {
    wall: new THREE.MeshStandardMaterial({
      color: COLORS.wall,
      roughness: .72,
      metalness: .04,
      emissive: 0x092632,
      emissiveIntensity: .08,
    }),
    roof: new THREE.MeshStandardMaterial({
      color: COLORS.roof,
      roughness: .58,
      metalness: .28,
      emissive: 0x0b2731,
      emissiveIntensity: .08,
    }),
    roofTrim: new THREE.MeshStandardMaterial({
      color: COLORS.blue,
      roughness: .38,
      metalness: .42,
      emissive: COLORS.cyan,
      emissiveIntensity: .28,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: COLORS.glass,
      roughness: .16,
      metalness: .12,
      transparent: true,
      opacity: .78,
      emissive: 0x0e88a6,
      emissiveIntensity: .32,
    }),
    skylight: new THREE.MeshPhysicalMaterial({
      color: 0x63a9bc,
      roughness: .22,
      metalness: .1,
      transparent: true,
      opacity: .72,
      emissive: 0x12788d,
      emissiveIntensity: .18,
    }),
    door: new THREE.MeshStandardMaterial({
      color: 0x165071,
      roughness: .44,
      metalness: .4,
      emissive: 0x0b9dc0,
      emissiveIntensity: .19,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: 0x52747e,
      roughness: .4,
      metalness: .72,
      emissive: 0x0d4c5b,
      emissiveIntensity: .12,
    }),
    adminStone: new THREE.MeshStandardMaterial({
      color: 0xc8c6b8,
      roughness: .78,
      metalness: 0,
      emissive: 0x1b2527,
      emissiveIntensity: .04,
    }),
    edge: new THREE.LineBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: .58,
      toneMapped: false,
    }),
  }
}

export function createFactoryCampusBuilding(record, materials) {
  const group = new THREE.Group()
  group.name = record.id
  group.position.set(...record.position)
  group.userData.buildingId = record.id
  group.userData.partId = record.id
  group.userData.explodable = true

  const [width, height, depth] = record.size
  const lowerHeight = record.roofType === 'stepped' ? height * .68 : height
  const walls = box(width, lowerHeight, depth, materials.wall, `${record.id}-wall-shell`)
  addEdges(walls, materials.edge, .36)
  group.add(walls)

  let roofY = lowerHeight + .08
  const roof = box(width * 1.012, .16, depth * 1.012, materials.roof, `${record.id}-roof`, roofY)
  addEdges(roof, materials.edge, .66)
  group.add(roof)

  const trim = box(width * 1.02, .055, depth * 1.02, materials.roofTrim, `${record.id}-roof-trim`, roofY + .09)
  group.add(trim)

  if (record.roofType === 'stepped') {
    const upperHeight = height * .37
    const upper = box(width * .58, upperHeight, depth * .62, materials.wall, `${record.id}-upper-shell`, lowerHeight + upperHeight / 2)
    upper.position.x = -width * .12
    addEdges(upper, materials.edge, .4)
    group.add(upper)
    roofY = height + .06
    const upperRoof = box(width * .6, .15, depth * .64, materials.roof, `${record.id}-upper-roof`, roofY)
    upperRoof.position.x = -width * .12
    group.add(upperRoof)
  }

  if (record.id === 'administration') addAdministrationFacade(group, record, materials)
  else addFacadeOpenings(group, record, materials)
  addRoofVents(group, record, materials, roofY)
  addSkylights(group, record, materials, roofY)

  group.traverse((object) => {
    object.userData.buildingId = record.id
    object.userData.partId = object.name || record.id
    if (object.isMesh || object.isInstancedMesh) {
      object.castShadow = true
      object.receiveShadow = true
    }
  })
  return group
}

function addRoad(group, materials, width, depth, x, z) {
  const road = box(width, .07, depth, materials.asphalt, 'campus-road', .065)
  road.position.x = x
  road.position.z = z
  group.add(road)
}

export const campusSite = Object.freeze({ width: 50, depth: 38 })

export const campusGateDefinitions = [
  { id: 'main-entrance', edge: 'front', center: [-8.2, 18.55], openingWidth: 5.6, label: '主入口' },
  { id: 'logistics-entrance', edge: 'east', center: [24.55, -4.05], openingWidth: 5.0, label: '物流入口' },
]

export const campusPerimeterSegments = [
  { id: 'front-west', edge: 'front', axis: 'x', center: [-17.775, 18.55], length: 13.55 },
  { id: 'front-east', edge: 'front', axis: 'x', center: [9.575, 18.55], length: 29.95 },
  { id: 'rear', edge: 'rear', axis: 'x', center: [0, -18.55], length: 49.1 },
  { id: 'west', edge: 'west', axis: 'z', center: [-24.55, 0], length: 37.1 },
  { id: 'east-rear', edge: 'east', axis: 'z', center: [24.55, -12.55], length: 12.0 },
  { id: 'east-front', edge: 'east', axis: 'z', center: [24.55, 8.5], length: 20.1 },
]

export const campusRoadSegments = [
  { id: 'front-perimeter-road', width: 49.2, depth: 1.4, x: 0, z: 17.3 },
  { id: 'rear-perimeter-road', width: 49.2, depth: 1.0, x: 0, z: -17.3 },
  { id: 'central-service-road', width: 22, depth: .7, x: -3.0, z: -2.0 },
  { id: 'rear-service-road', width: 12, depth: .42, x: 1.5, z: -6.9 },
  { id: 'east-service-road', width: 11.5, depth: .7, x: 14.0, z: 2.45 },
  { id: 'west-perimeter-road', width: 1.0, depth: 35.6, x: -23.2, z: 0 },
  { id: 'east-perimeter-road', width: 1.0, depth: 35.6, x: 23.2, z: 0 },
  { id: 'east-entrance-link', width: .7, depth: 12.0, x: 14.5, z: 9.0 },
  { id: 'admin-access-link', width: .7, depth: 6.0, x: -6.0, z: 12.0 },
  { id: 'main-gate-link', width: 5.0, depth: 7.0, x: -8.2, z: 14.2 },
  { id: 'logistics-gate-link', width: 7.8, depth: 3.4, x: 20.7, z: -4.05 },
]

export const campusCourtFootprint = {
  width: 5.6,
  depth: 3.25,
  x: 3.5,
  z: 12.2,
}

function overlapsFootprint(x, z, footprint, clearance) {
  return Math.abs(x - footprint.x) <= footprint.width / 2 + clearance
    && Math.abs(z - footprint.z) <= footprint.depth / 2 + clearance
}

export function isInteriorTreePositionClear(x, z, clearance = .45) {
  const overlapsBuilding = factoryCampusRegistry.some((building) => overlapsFootprint(x, z, {
    x: building.position[0],
    z: building.position[2],
    width: building.size[0],
    depth: building.size[2],
  }, clearance))
  if (overlapsBuilding) return false

  if (campusRoadSegments.some((road) => overlapsFootprint(x, z, road, clearance))) return false
  return !overlapsFootprint(x, z, campusCourtFootprint, clearance)
}

function createRoadSystem(materials) {
  const group = new THREE.Group()
  group.name = 'road-system'
  campusRoadSegments.forEach((road) => {
    addRoad(group, materials, road.width, road.depth, road.x, road.z)
  })

  const dashGeometry = new THREE.BoxGeometry(.64, .025, .065)
  const dashes = new THREE.InstancedMesh(dashGeometry, materials.roadWhite, 44)
  dashes.name = 'lane-dashes'
  for (let index = 0; index < 22; index += 1) {
    const x = -23.1 + index * 2.2
    setInstanceMatrix(dashes, index, [x, .115, 17.3])
    setInstanceMatrix(dashes, index + 22, [x, .115, -17.3])
  }
  group.add(dashes)

  const stripeGeometry = new THREE.BoxGeometry(.08, .026, .72)
  const crossings = new THREE.InstancedMesh(stripeGeometry, materials.roadWhite, 48)
  crossings.name = 'zebra-crossings'
  const crossingCenters = [[-23.2, 17.3], [-8.2, 17.3], [-23.2, -17.3], [23.2, -17.3]]
  crossingCenters.forEach(([centerX, centerZ], crossingIndex) => {
    for (let stripe = 0; stripe < 12; stripe += 1) {
      setInstanceMatrix(crossings, crossingIndex * 12 + stripe, [centerX - .55 + stripe * .1, .12, centerZ])
    }
  })
  group.add(crossings)
  return group
}

function createBasketballCourt(materials) {
  const group = new THREE.Group()
  group.name = 'sports-system'
  const { width, depth, x: courtX, z: courtZ } = campusCourtFootprint
  const court = box(width, .06, depth, materials.court, 'basketball-court', .09)
  court.position.set(courtX, court.position.y, courtZ)
  group.add(court)

  const lineMaterial = materials.roadWhite
  const boundary = [
    box(5.5, .02, .05, lineMaterial, 'court-line', .13),
    box(5.5, .02, .05, lineMaterial, 'court-line', .13),
    box(.05, .02, 3.15, lineMaterial, 'court-line', .13),
    box(.05, .02, 3.15, lineMaterial, 'court-line', .13),
    box(.05, .02, 3.15, lineMaterial, 'court-center-line', .13),
  ]
  boundary[0].position.set(courtX, .13, courtZ - 1.58)
  boundary[1].position.set(courtX, .13, courtZ + 1.58)
  boundary[2].position.set(courtX - 2.72, .13, courtZ)
  boundary[3].position.set(courtX + 2.72, .13, courtZ)
  boundary[4].position.set(courtX, .13, courtZ)
  group.add(...boundary)

  for (const x of [courtX - 2.25, courtX + 2.25]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.035, .045, .72, 8), materials.pipe)
    pole.position.set(x, .47, courtZ)
    const board = box(.06, .46, .8, materials.roadWhite, 'court-backboard', .78)
    board.position.set(x, .78, courtZ)
    group.add(pole, board)
  }
  return group
}

export const pipeRackRoutes = [
  { from: [-4.0, -2.0], to: [8.0, -2.0], y: 1.5 },
  { from: [8.0, -2.0], to: [8.0, -3.5], y: 1.45 },
  { from: [8.0, -3.5], to: [18.0, -3.5], y: 1.4 },
]

export const pedestrianRoutes = [
  { id: 'front-promenade', count: 4, points: [[-7.5, 14.0], [12.5, 14.0], [12.5, 13.7], [-7.5, 13.7]] },
  { id: 'parking-walkway', count: 2, points: [[-15.0, 5.1], [-2.0, 5.1], [-2.0, 5.5], [-15.0, 5.5]] },
  { id: 'east-access-walkway', count: 2, points: [[18.6, 3.0], [18.6, 13.5], [18.2, 13.5], [18.2, 3.0]] },
]

export function samplePedestrianRoute(points, progress) {
  const segments = points.map((point, index) => {
    const next = points[(index + 1) % points.length]
    return { from: point, to: next, length: Math.hypot(next[0] - point[0], next[1] - point[1]) }
  })
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0)
  let distance = (((progress % 1) + 1) % 1) * totalLength
  const segment = segments.find((candidate) => {
    if (distance <= candidate.length) return true
    distance -= candidate.length
    return false
  }) ?? segments[segments.length - 1]
  const ratio = segment.length ? distance / segment.length : 0
  const deltaX = segment.to[0] - segment.from[0]
  const deltaZ = segment.to[1] - segment.from[1]
  return {
    position: [segment.from[0] + deltaX * ratio, segment.from[1] + deltaZ * ratio],
    direction: segment.length ? [deltaX / segment.length, deltaZ / segment.length] : [0, 1],
  }
}

function createPedestrian(index, materials) {
  const group = new THREE.Group()
  group.name = `pedestrian-${index}`
  const jacket = index % 3 === 0 ? materials.pedestrianAccent : materials.pedestrianJacket
  const torso = box(.2, .36, .13, jacket, `pedestrian-${index}-torso`, .56)
  const head = new THREE.Mesh(new THREE.SphereGeometry(.105, 8, 6), materials.pedestrianSkin)
  head.name = `pedestrian-${index}-head`
  head.position.y = .86
  const leftLeg = box(.065, .3, .075, materials.pedestrianTrousers, `pedestrian-${index}-left-leg`, .22)
  const rightLeg = box(.065, .3, .075, materials.pedestrianTrousers, `pedestrian-${index}-right-leg`, .22)
  leftLeg.position.x = -.052
  rightLeg.position.x = .052
  group.add(torso, head, leftLeg, rightLeg)
  group.scale.setScalar(.9 + campusSeededValue(index + 410) * .12)
  group.userData.legs = [leftLeg, rightLeg]
  return group
}

function createPedestrianSystem(materials, animated) {
  const group = new THREE.Group()
  group.name = 'pedestrian-system'
  let personIndex = 0
  pedestrianRoutes.forEach((route, routeIndex) => {
    for (let routePerson = 0; routePerson < route.count; routePerson += 1) {
      const person = createPedestrian(personIndex, materials)
      const phase = routePerson / route.count + campusSeededValue(personIndex + 500) * .08
      const speed = .018 + campusSeededValue(personIndex + 520) * .008
      const update = (seconds) => {
        const sample = samplePedestrianRoute(route.points, phase + seconds * speed)
        person.position.set(sample.position[0], .08, sample.position[1])
        person.rotation.y = Math.atan2(sample.direction[0], sample.direction[1])
        const stride = Math.sin((phase + seconds * speed) * Math.PI * 24) * .42
        person.userData.legs[0].rotation.x = stride
        person.userData.legs[1].rotation.x = -stride
      }
      update(0)
      group.add(person)
      animated.push({ kind: 'pedestrian', object: person, routeId: route.id, update })
      personIndex += 1
    }
  })
  return group
}

function createPipeRackSystem(materials, animated) {
  const group = new THREE.Group()
  group.name = 'pipe-rack-system'
  pipeRackRoutes.forEach((route, routeIndex) => {
    const deltaX = route.to[0] - route.from[0]
    const deltaZ = route.to[1] - route.from[1]
    const length = Math.hypot(deltaX, deltaZ)
    const angle = Math.atan2(deltaZ, deltaX)
    const perpendicularX = -Math.sin(angle)
    const perpendicularZ = Math.cos(angle)
    const supportCount = Math.floor(length / 1.5) + 1
    for (let index = 0; index < supportCount; index += 1) {
      const progress = index / Math.max(1, supportCount - 1)
      const x = route.from[0] + deltaX * progress
      const z = route.from[1] + deltaZ * progress
      const left = new THREE.Mesh(new THREE.CylinderGeometry(.035, .05, route.y, 6), materials.pipeSupport)
      const right = left.clone()
      left.position.set(x + perpendicularX * .34, route.y / 2, z + perpendicularZ * .34)
      right.position.set(x - perpendicularX * .34, route.y / 2, z - perpendicularZ * .34)
      const beam = box(.08, .07, .82, materials.pipeSupport, 'pipe-rack-beam', route.y)
      beam.position.x = x
      beam.position.z = z
      beam.rotation.y = -angle
      group.add(left, right, beam)
    }
    for (let pipeIndex = 0; pipeIndex < 4; pipeIndex += 1) {
      const curve = new THREE.LineCurve3(
        new THREE.Vector3(route.from[0], route.y + .08 + pipeIndex * .1, route.from[1] - .25 + pipeIndex * .16),
        new THREE.Vector3(route.to[0], route.y + .08 + pipeIndex * .1, route.to[1] - .25 + pipeIndex * .16),
      )
      const pipe = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, .035, 6, false), materials.pipe)
      pipe.name = `energy-pipe-${routeIndex}-${pipeIndex}`
      group.add(pipe)
    }
    for (let nodeIndex = 0; nodeIndex < 5; nodeIndex += 1) {
      const node = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 8), materials.energy.clone())
      node.position.set(
        route.from[0] + deltaX * (nodeIndex / 4),
        route.y + .48,
        route.from[1] + deltaZ * (nodeIndex / 4),
      )
      group.add(node)
      animated.push({ kind: 'pulse', object: node, phase: routeIndex + nodeIndex * .72 })
    }
  })
  return group
}

function createParkingCanopies(materials) {
  const group = new THREE.Group()
  group.name = 'parking-system'
  for (const [z, row] of [[6.0, 0], [7.5, 1]]) {
    const roof = box(7.2, .09, .9, materials.roof, `parking-canopy-${row}`, .88)
    roof.position.set(-12.4, roof.position.y, z)
    group.add(roof)
    for (let index = 0; index < 8; index += 1) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.025, .035, .82, 6), materials.pipeSupport)
      post.position.set(-15.5 + index * .88, .45, z)
      group.add(post)
    }
  }
  return group
}

function isGateOpeningLandscapePosition(x, z, clearance = .6) {
  return campusGateDefinitions.some((gate) => {
    const alongOpening = gate.edge === 'front'
      ? Math.abs(x - gate.center[0])
      : Math.abs(z - gate.center[1])
    const nearBoundary = gate.edge === 'front'
      ? Math.abs(z - gate.center[1]) < 1
      : Math.abs(x - gate.center[0]) < 1
    return nearBoundary && alongOpening < gate.openingWidth / 2 + clearance
  })
}

function createLandscape(materials) {
  const group = new THREE.Group()
  group.name = 'landscape-system'
  const positions = []
  for (let index = 0; index < 88; index += 1) {
    const side = index % 4
    const t = (Math.floor(index / 4) + .5) / 22
    let position
    if (side === 0) position = [-24.2 + t * 48.4, -18.05]
    else if (side === 1) position = [-24.2 + t * 48.4, 18.05]
    else if (side === 2) position = [-24.05, -17.6 + t * 35.2]
    else position = [24.05, -17.6 + t * 35.2]
    if (!isGateOpeningLandscapePosition(...position)) positions.push(position)
  }
  let acceptedInteriorTrees = 0
  for (let candidate = 0; acceptedInteriorTrees < 34 && candidate < 320; candidate += 1) {
    const x = -21.5 + campusSeededValue(candidate * 2) * 43
    const z = -15.5 + campusSeededValue(candidate * 2 + 1) * 31
    if (!isInteriorTreePositionClear(x, z)) continue
    positions.push([x, z])
    acceptedInteriorTrees += 1
  }

  const trunkGeometry = new THREE.CylinderGeometry(.035, .06, .48, 6)
  const crownGeometry = new THREE.ConeGeometry(.25, .72, 7)
  const trunks = new THREE.InstancedMesh(trunkGeometry, materials.trunk, positions.length)
  const crowns = new THREE.InstancedMesh(crownGeometry, materials.foliage, positions.length)
  trunks.name = 'tree-trunks'
  crowns.name = 'tree-crowns'
  positions.forEach(([x, z], index) => {
    const variance = .82 + campusSeededValue(index + 200) * .46
    setInstanceMatrix(trunks, index, [x, .28 * variance, z], [variance, variance, variance], campusSeededValue(index) * Math.PI)
    setInstanceMatrix(crowns, index, [x, .73 * variance, z], [variance, variance, variance], campusSeededValue(index + 99) * Math.PI)
  })
  trunks.castShadow = true
  crowns.castShadow = true
  group.add(trunks, crowns)

  const flowerGeometry = new THREE.IcosahedronGeometry(.08, 0)
  const flowers = new THREE.InstancedMesh(flowerGeometry, materials.flower, 54)
  flowers.name = 'flower-bands'
  for (let index = 0; index < 54; index += 1) {
    const leftBand = index < 27
    const localIndex = leftBand ? index : index - 27
    const x = leftBand ? -15 + localIndex * .25 : 7 + localIndex * .28
    const z = (leftBand ? 11.5 : 10.8) + Math.sin(index * 1.7) * .24
    setInstanceMatrix(flowers, index, [x, .15, z], [1, .8, 1])
  }
  group.add(flowers)
  return group
}

function addFenceRun(group, segment, materials, postPositions) {
  const [x, z] = segment.center
  const alongX = segment.axis === 'x'
  const plinth = box(
    alongX ? segment.length : .16,
    .16,
    alongX ? .16 : segment.length,
    materials.fencePlinth,
    `fence-plinth-${segment.id}`,
    .1,
  )
  plinth.position.x = x
  plinth.position.z = z
  group.add(plinth)

  for (const y of [.42, .76]) {
    const rail = box(
      alongX ? segment.length : .055,
      .055,
      alongX ? .055 : segment.length,
      materials.fence,
      `fence-rail-${segment.id}`,
      y,
    )
    rail.position.x = x
    rail.position.z = z
    group.add(rail)
  }

  const divisions = Math.max(1, Math.ceil(segment.length / 1.15))
  for (let index = 0; index <= divisions; index += 1) {
    const offset = -segment.length / 2 + segment.length * index / divisions
    postPositions.push(alongX ? [x + offset, z] : [x, z + offset])
  }
}

function createCampusGate(definition, materials) {
  const group = new THREE.Group()
  group.name = `campus-gate-${definition.id}`
  group.position.set(definition.center[0], 0, definition.center[1])
  if (definition.edge === 'east') group.rotation.y = Math.PI / 2

  const span = definition.openingWidth
  for (const side of [-1, 1]) {
    const column = box(.28, 2.05, .38, materials.gateColumn, `${definition.id}-column`, 1.025)
    column.position.x = side * span / 2
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(.085, 10, 7), materials.energy)
    beacon.name = `${definition.id}-beacon`
    beacon.position.set(side * span / 2, 2.18, 0)
    group.add(column, beacon)
  }

  const canopy = box(span + .75, .18, 1.25, materials.gateRoof, `${definition.id}-canopy`, 2.08)
  const sign = box(span * .46, .32, .08, materials.gateSign, `${definition.id}-sign`, 2.1)
  sign.position.z = .66
  group.add(canopy, sign)

  for (const side of [-1, 1]) {
    const pedestal = box(.18, .62, .24, materials.gateColumn, `${definition.id}-barrier-pedestal`, .33)
    pedestal.position.set(side * .32, pedestal.position.y, .45)
    const arm = box(span / 2 - .55, .075, .09, materials.barrier, `${definition.id}-barrier-arm`, .66)
    arm.position.set(side * (span / 4 + .05), arm.position.y, .45)
    group.add(pedestal, arm)
  }

  const laneDivider = box(.14, .12, 2.2, materials.roadWhite, `${definition.id}-lane-divider`, .13)
  group.add(laneDivider)
  return group
}

function createPerimeterAndLights(materials) {
  const group = new THREE.Group()
  group.name = 'perimeter-system'
  const positions = []
  campusPerimeterSegments.forEach((segment) => addFenceRun(group, segment, materials, positions))
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(.055, .48, .055), materials.fence, positions.length)
  posts.name = 'fence-posts'
  positions.forEach(([x, z], index) => setInstanceMatrix(posts, index, [x, .5, z], [1, 1.9, 1]))
  group.add(posts)

  campusGateDefinitions.forEach((definition) => group.add(createCampusGate(definition, materials)))

  const streetPositions = [[-19.0, 16.2], [-12.0, 16.2], [-4.0, 16.2], [7.0, 16.2], [16.0, 16.2], [22.3, 5.0], [22.3, -10.0], [8.0, -3.0], [-21.8, 2.4]]
  streetPositions.forEach(([x, z], index) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.025, .035, 1.0, 7), materials.pipeSupport)
    pole.name = `streetlight-${index}`
    pole.position.set(x, .55, z)
    const head = box(.38, .045, .06, materials.energy, `streetlight-head-${index}`, 1.05)
    head.position.set(x + .15, 1.05, z)
    group.add(pole, head)
  })
  return group
}

export function createFactoryCampusSystemMaterials() {
  return {
    foundation: new THREE.MeshStandardMaterial({ color: 0x071821, roughness: .64, metalness: .42, emissive: 0x06384a, emissiveIntensity: .1 }),
    lawn: new THREE.MeshStandardMaterial({ color: COLORS.lawn, roughness: .94, metalness: 0, emissive: 0x083327, emissiveIntensity: .08 }),
    asphalt: new THREE.MeshStandardMaterial({ color: COLORS.asphalt, roughness: .92, metalness: .02 }),
    roadWhite: new THREE.MeshBasicMaterial({ color: 0xc7d9dc, transparent: true, opacity: .82 }),
    court: new THREE.MeshStandardMaterial({ color: COLORS.court, roughness: .82, metalness: 0 }),
    pipeSupport: new THREE.MeshStandardMaterial({ color: 0x59777c, roughness: .45, metalness: .66, emissive: 0x0b3c47, emissiveIntensity: .12 }),
    pipe: new THREE.MeshStandardMaterial({ color: 0x2e8b95, roughness: .34, metalness: .58, emissive: COLORS.cyan, emissiveIntensity: .22 }),
    energy: new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: .8, toneMapped: false }),
    roof: new THREE.MeshStandardMaterial({ color: COLORS.roof, roughness: .58, metalness: .28 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x294234, roughness: .94 }),
    foliage: new THREE.MeshStandardMaterial({ color: 0x1f5945, roughness: .88, emissive: 0x0c4437, emissiveIntensity: .08 }),
    flower: new THREE.MeshStandardMaterial({ color: 0xa83e68, roughness: .82, emissive: 0x4e1734, emissiveIntensity: .12 }),
    fence: new THREE.MeshStandardMaterial({ color: 0x9bb4b7, roughness: .72, metalness: .2 }),
    fencePlinth: new THREE.MeshStandardMaterial({ color: 0x9aa8aa, roughness: .8, metalness: .06 }),
    gateColumn: new THREE.MeshStandardMaterial({ color: 0xd5dcde, roughness: .66, metalness: .12 }),
    gateRoof: new THREE.MeshStandardMaterial({ color: 0x356d7b, roughness: .5, metalness: .35 }),
    gateSign: new THREE.MeshBasicMaterial({ color: 0x2ad7e7, toneMapped: false }),
    barrier: new THREE.MeshStandardMaterial({ color: 0xe1684d, roughness: .58, emissive: 0x572018, emissiveIntensity: .18 }),
    pedestrianJacket: new THREE.MeshStandardMaterial({ color: 0x2d91aa, roughness: .72 }),
    pedestrianAccent: new THREE.MeshStandardMaterial({ color: 0xd67a42, roughness: .74 }),
    pedestrianSkin: new THREE.MeshStandardMaterial({ color: 0xd6ab8a, roughness: .8 }),
    pedestrianTrousers: new THREE.MeshStandardMaterial({ color: 0x24343e, roughness: .86 }),
  }
}

export function createFactoryCampusSystems(animated) {
  const materials = createFactoryCampusSystemMaterials()
  const group = new THREE.Group()
  group.name = 'factory-campus-systems'

  const foundation = box(campusSite.width, .7, campusSite.depth, materials.foundation, 'campus-foundation', -.35)
  const lawn = box(campusSite.width - .8, .13, campusSite.depth - .8, materials.lawn, 'campus-lawn', .015)
  group.add(
    foundation,
    lawn,
    createRoadSystem(materials),
    createBasketballCourt(materials),
    createPipeRackSystem(materials, animated),
    createParkingCanopies(materials),
    createLandscape(materials),
    createPerimeterAndLights(materials),
    createPedestrianSystem(materials, animated),
  )

  const grid = new THREE.GridHelper(60, 60, 0x14637a, 0x0d3545)
  grid.position.y = -.72
  grid.material.transparent = true
  grid.material.opacity = .28
  group.add(grid)

  group.userData.materialLibrary = materials
  return group
}

export function createFactoryCampusLights() {
  const group = new THREE.Group()
  group.name = 'campus-lighting'
  group.add(new THREE.HemisphereLight(0xe8f8ff, 0x0b1a21, 2.6))
  const key = new THREE.DirectionalLight(0xffffff, 3.6)
  key.position.set(-10, 18, 12)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.left = -26
  key.shadow.camera.right = 26
  key.shadow.camera.top = 22
  key.shadow.camera.bottom = -22
  const cyan = new THREE.PointLight(COLORS.cyan, 28, 26, 2)
  cyan.position.set(7, 5, 3)
  const fill = new THREE.DirectionalLight(0x9bc0d2, 1.35)
  fill.position.set(12, 7, -11)
  group.add(key, cyan, fill)
  return group
}
