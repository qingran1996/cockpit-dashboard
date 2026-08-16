import * as THREE from 'three'

const COLORS = {
  navy: 0x05131d,
  cyan: 0x23d7ea,
  blue: 0x287ca8,
  wall: 0xb9c7ce,
  roof: 0x8799a4,
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

function addRoofVents(group, record, materials, roofY) {
  const points = roofVentLayout([record.size[0], record.size[2]], record.id === 'main-production-hall' ? 1.75 : 1.55)
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

function createRoadSystem(materials) {
  const group = new THREE.Group()
  group.name = 'road-system'
  addRoad(group, materials, 33, 2.0, 0, 10.6)
  addRoad(group, materials, 33, 1.4, 0, 3.6)
  addRoad(group, materials, 33, 1.35, 0, -3.5)
  addRoad(group, materials, 1.45, 23, -13.2, 0)
  addRoad(group, materials, 1.35, 23, 4.3, 0)
  addRoad(group, materials, 1.4, 23, 13.2, 0)

  const dashGeometry = new THREE.BoxGeometry(.58, .025, .065)
  const dashes = new THREE.InstancedMesh(dashGeometry, materials.roadWhite, 36)
  dashes.name = 'lane-dashes'
  for (let index = 0; index < 18; index += 1) {
    const x = -15.3 + index * 1.8
    setInstanceMatrix(dashes, index, [x, .115, 10.6])
    setInstanceMatrix(dashes, index + 18, [x, .115, 3.6])
  }
  group.add(dashes)

  const stripeGeometry = new THREE.BoxGeometry(.08, .026, .72)
  const crossings = new THREE.InstancedMesh(stripeGeometry, materials.roadWhite, 48)
  crossings.name = 'zebra-crossings'
  const crossingCenters = [[-12.2, 10.6], [4.3, 10.6], [13.2, 3.6], [4.3, -3.5]]
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
  const court = box(5.6, .06, 3.25, materials.court, 'basketball-court', .09)
  court.position.set(-1.0, court.position.y, 9.0)
  group.add(court)

  const lineMaterial = materials.roadWhite
  const boundary = [
    box(5.5, .02, .05, lineMaterial, 'court-line', .13),
    box(5.5, .02, .05, lineMaterial, 'court-line', .13),
    box(.05, .02, 3.15, lineMaterial, 'court-line', .13),
    box(.05, .02, 3.15, lineMaterial, 'court-line', .13),
    box(.05, .02, 3.15, lineMaterial, 'court-center-line', .13),
  ]
  boundary[0].position.set(-1, .13, 7.42)
  boundary[1].position.set(-1, .13, 10.58)
  boundary[2].position.set(-3.72, .13, 9)
  boundary[3].position.set(1.72, .13, 9)
  boundary[4].position.set(-1, .13, 9)
  group.add(...boundary)

  for (const x of [-3.25, 1.25]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.035, .045, .72, 8), materials.pipe)
    pole.position.set(x, .47, 9)
    const board = box(.06, .46, .8, materials.roadWhite, 'court-backboard', .78)
    board.position.set(x, .78, 9)
    group.add(pole, board)
  }
  return group
}

function createPipeRackSystem(materials, animated) {
  const group = new THREE.Group()
  group.name = 'pipe-rack-system'
  const routes = [
    { from: [-7.5, 2.0], to: [12.0, 2.0], y: 1.18 },
    { from: [-1.5, -4.4], to: [10.2, -4.4], y: 1.32 },
  ]
  routes.forEach((route, routeIndex) => {
    const length = route.to[0] - route.from[0]
    const supportCount = Math.floor(length / 1.5) + 1
    for (let index = 0; index < supportCount; index += 1) {
      const x = route.from[0] + length * (index / Math.max(1, supportCount - 1))
      const left = new THREE.Mesh(new THREE.CylinderGeometry(.035, .05, route.y, 6), materials.pipeSupport)
      const right = left.clone()
      left.position.set(x, route.y / 2, route.from[1] - .34)
      right.position.set(x, route.y / 2, route.from[1] + .34)
      const beam = box(.08, .07, .82, materials.pipeSupport, 'pipe-rack-beam', route.y)
      beam.position.x = x
      beam.position.z = route.from[1]
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
        route.from[0] + length * (nodeIndex / 4),
        route.y + .48,
        route.from[1],
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
  for (const [z, row] of [[5.8, 0], [7.25, 1]]) {
    const roof = box(7.2, .09, .9, materials.roof, `parking-canopy-${row}`, .88)
    roof.position.set(-10.0, roof.position.y, z)
    group.add(roof)
    for (let index = 0; index < 8; index += 1) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.025, .035, .82, 6), materials.pipeSupport)
      post.position.set(-13.1 + index * .88, .45, z)
      group.add(post)
    }
  }
  return group
}

function createLandscape(materials) {
  const group = new THREE.Group()
  group.name = 'landscape-system'
  const positions = []
  for (let index = 0; index < 64; index += 1) {
    const side = index % 4
    const t = (Math.floor(index / 4) + .5) / 16
    if (side === 0) positions.push([-16 + t * 32, -11.7])
    else if (side === 1) positions.push([-16 + t * 32, 12.0])
    else if (side === 2) positions.push([-15.3, -11 + t * 22])
    else positions.push([15.3, -11 + t * 22])
  }
  for (let index = 0; index < 28; index += 1) {
    positions.push([
      -12 + campusSeededValue(index * 2) * 24,
      -10 + campusSeededValue(index * 2 + 1) * 20,
    ])
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
    const x = -13 + index * .46
    const z = 8.8 + Math.sin(index * 1.7) * .24
    setInstanceMatrix(flowers, index, [x, .15, z], [1, .8, 1])
  }
  group.add(flowers)
  return group
}

function createPerimeterAndLights(materials) {
  const group = new THREE.Group()
  group.name = 'perimeter-system'
  const positions = []
  for (let x = -15.5; x <= 15.5; x += 1.15) {
    positions.push([x, -11.1], [x, 11.15])
  }
  for (let z = -10; z <= 10; z += 1.15) {
    positions.push([-15.55, z], [15.55, z])
  }
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(.055, .48, .055), materials.fence, positions.length)
  posts.name = 'fence-posts'
  positions.forEach(([x, z], index) => setInstanceMatrix(posts, index, [x, .28, z]))
  group.add(posts)

  const streetPositions = [[-12.3, 9.7], [-8.5, 9.7], [4.8, 9.7], [9.5, 9.7], [12.4, 2.8], [4.8, -2.8], [-12.3, 2.8]]
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
  }
}

export function createFactoryCampusSystems(animated) {
  const materials = createFactoryCampusSystemMaterials()
  const group = new THREE.Group()
  group.name = 'factory-campus-systems'

  const foundation = box(34, .7, 25, materials.foundation, 'campus-foundation', -.35)
  const lawn = box(33.2, .13, 24.2, materials.lawn, 'campus-lawn', .015)
  group.add(
    foundation,
    lawn,
    createRoadSystem(materials),
    createBasketballCourt(materials),
    createPipeRackSystem(materials, animated),
    createParkingCanopies(materials),
    createLandscape(materials),
    createPerimeterAndLights(materials),
  )

  const grid = new THREE.GridHelper(45, 45, 0x14637a, 0x0d3545)
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
  group.add(new THREE.HemisphereLight(0xc9f4ff, 0x06151d, 2.15))
  const key = new THREE.DirectionalLight(0xe3f7ff, 2.8)
  key.position.set(-10, 18, 12)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.left = -20
  key.shadow.camera.right = 20
  key.shadow.camera.top = 18
  key.shadow.camera.bottom = -18
  const cyan = new THREE.PointLight(COLORS.cyan, 28, 26, 2)
  cyan.position.set(7, 5, 3)
  const fill = new THREE.DirectionalLight(0x557e96, 1.1)
  fill.position.set(12, 7, -11)
  group.add(key, cyan, fill)
  return group
}
