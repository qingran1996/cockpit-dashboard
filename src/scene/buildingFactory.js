import * as THREE from 'three'
import { prepareBuildingFloors } from './floorInteraction.js'

const COLORS = { cyan: 0x19d7ff, orange: 0xff7138 }

function box(width, height, depth, material, y = height / 2) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material)
  mesh.position.y = y
  return mesh
}

function addEdges(mesh, material, opacity = 1) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 25),
    material.clone(),
  )
  edges.material.opacity = opacity
  edges.material.transparent = true
  edges.renderOrder = 3
  mesh.add(edges)
  return edges
}

function addWindowBands(group, width, height, depth, toneMaterial, floors = 4) {
  for (let floor = 0; floor < floors; floor += 1) {
    const y = .55 + floor * ((height - .6) / floors)
    const front = box(width * .84, .12, .04, toneMaterial.clone(), y)
    front.position.z = depth / 2 + .025
    group.add(front)
    const side = box(.04, .12, depth * .72, toneMaterial.clone(), y)
    side.position.x = width / 2 + .025
    group.add(side)
  }
}

function createTank(record, materials) {
  const [diameter, height] = record.size
  const group = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(diameter / 2, diameter / 2, height * .78, 24), materials.body)
  body.position.y = height * .39
  addEdges(body, materials.edge, .7)
  const dome = new THREE.Mesh(new THREE.SphereGeometry(diameter / 2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), materials.glass)
  dome.position.y = height * .78
  dome.scale.y = .38
  addEdges(dome, materials.edge, .75)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(diameter * .5, .04, 6, 32), materials.glow)
  ring.rotation.x = Math.PI / 2
  ring.position.y = height * .76
  group.add(body, dome, ring)
  return group
}

function createWaterTower(record, materials) {
  const [diameter, height] = record.size
  const group = new THREE.Group()
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(diameter / 2, diameter * .46, height * .31, 20), materials.glass)
  tank.position.y = height * .78
  addEdges(tank, materials.edge)
  const cap = new THREE.Mesh(new THREE.SphereGeometry(diameter / 2, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), materials.glass)
  cap.position.y = height * .94
  cap.scale.y = .35
  addEdges(cap, materials.edge, .8)
  const legMaterial = materials.metal.clone()
  for (const [x, z] of [[-.7, -.7], [.7, -.7], [-.7, .7], [.7, .7]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.06, .09, height * .62, 6), legMaterial)
    leg.position.set(x * diameter / 2, height * .31, z * diameter / 2)
    leg.rotation.z = x * .07
    group.add(leg)
  }
  const brace = new THREE.Mesh(new THREE.TorusGeometry(diameter * .34, .035, 4, 24), materials.glow)
  brace.rotation.x = Math.PI / 2
  brace.position.y = height * .38
  group.add(tank, cap, brace)
  return group
}

function createFactory(record, materials) {
  const [width, height, depth] = record.size
  const group = new THREE.Group()
  const base = box(width, height * .74, depth, materials.body)
  addEdges(base, materials.edge)
  const upper = box(width * .72, height * .32, depth * .72, materials.body, height * .9)
  addEdges(upper, materials.edge)
  const roof = box(width * .82, .12, depth * .82, materials.glow, height * 1.08)
  const entrance = box(width * .22, height * .42, .18, materials.glow, height * .21)
  entrance.position.z = depth / 2 + .1
  entrance.position.x = width * .22
  group.add(base, upper, roof, entrance)
  addWindowBands(group, width, height * .65, depth, materials.glow, 3)
  return group
}

function createChimney(record, materials) {
  const [diameter, height] = record.size
  const group = new THREE.Group()
  const lower = new THREE.Mesh(new THREE.CylinderGeometry(diameter * .34, diameter * .52, height * .68, 18), materials.body)
  lower.position.y = height * .34
  addEdges(lower, materials.edge)
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(diameter * .28, diameter * .34, height * .32, 18), materials.body)
  upper.position.y = height * .84
  addEdges(upper, materials.edge)
  group.add(lower, upper)
  for (let index = 0; index < 4; index += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(diameter * (.34 - index * .012), .035, 5, 24), materials.glow)
    ring.rotation.x = Math.PI / 2
    ring.position.y = height * (.22 + index * .2)
    group.add(ring)
  }
  return group
}

function createOffice(record, materials) {
  const [width, height, depth] = record.size
  const group = new THREE.Group()
  const core = box(width, height, depth, materials.body)
  addEdges(core, materials.edge)
  const crown = box(width * .9, .2, depth * .9, materials.glow, height + .1)
  group.add(core, crown)
  addWindowBands(group, width, height, depth, materials.glow, Math.max(4, Math.round(height * 1.6)))
  return group
}

function createControlCenter(record, materials) {
  const [width, height, depth] = record.size
  const group = new THREE.Group()
  const lower = box(width, height * .58, depth, materials.body)
  addEdges(lower, materials.edge)
  const upper = box(width * .72, height * .5, depth * .72, materials.body, height * .79)
  addEdges(upper, materials.edge)
  const frame = box(width * .79, .14, depth * .79, materials.glow, height * 1.04)
  const entrance = box(width * .28, height * .34, .18, materials.glow, height * .17)
  entrance.position.z = depth / 2 + .1
  group.add(lower, upper, frame, entrance)
  addWindowBands(group, width, height * .56, depth, materials.glow, 3)
  return group
}

const factories = {
  tank: createTank,
  waterTower: createWaterTower,
  factory: createFactory,
  chimney: createChimney,
  office: createOffice,
  controlCenter: createControlCenter,
}

function addFloorSpaces(group, record) {
  const [width, height, depth] = record.size
  const floorHeight = height / record.floors.length
  record.floors.forEach((floor, index) => {
    const floorRoot = new THREE.Group()
    floorRoot.name = `FLOOR__${record.id}__${floor.id}`
    floorRoot.userData = { ...floor, buildingId: record.id, floorId: floor.id, interactive: true }
    const tone = floor.tone === 'orange' ? 0xff7138 : 0x19d7ff
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(width * .88, .08, depth * .82),
      new THREE.MeshStandardMaterial({ color: 0x52656c, metalness: .22, roughness: .66 }),
    )
    slab.position.y = index * floorHeight + .08
    const volume = new THREE.Mesh(
      new THREE.BoxGeometry(width * .8, Math.max(.24, floorHeight * .58), depth * .7),
      new THREE.MeshPhysicalMaterial({ color: tone, transparent: true, opacity: .36, roughness: .2, transmission: .12 }),
    )
    volume.position.y = index * floorHeight + floorHeight * .44
    const core = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(.18, width * .1), Math.max(.28, floorHeight * .64), Math.max(.18, depth * .16)),
      new THREE.MeshStandardMaterial({ color: 0xb5c1c0, roughness: .72 }),
    )
    core.position.set(-width * .3, index * floorHeight + floorHeight * .46, -depth * .2)
    floorRoot.add(slab, volume, core)
    group.add(floorRoot)
  })
}

export function createMaterialLibrary(tone) {
  const color = COLORS[tone]
  return {
    body: new THREE.MeshStandardMaterial({ color: tone === 'orange' ? 0x351a19 : 0x093047, metalness: .65, roughness: .28, emissive: color, emissiveIntensity: .16 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x1c5268, metalness: .8, roughness: .22, emissive: color, emissiveIntensity: .18 }),
    glass: new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity: .45, metalness: .18, roughness: .08, emissive: color, emissiveIntensity: .38 }),
    glow: new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .92, toneMapped: false }),
    edge: new THREE.LineBasicMaterial({ color, transparent: true, opacity: .88, toneMapped: false }),
  }
}

export function createBuilding(record, materialLibrary) {
  const group = factories[record.model](record, materialLibrary)
  group.position.set(...record.position)
  group.userData.buildingId = record.id
  group.userData.tone = record.tone
  const solidMeshes = []
  group.traverse((object) => {
    if (object.isMesh) {
      object.userData.buildingId = record.id
      object.userData.tone = record.tone
      object.castShadow = true
      object.receiveShadow = true
      if (object.material?.isMeshStandardMaterial || object.material?.isMeshPhysicalMaterial) solidMeshes.push(object)
    }
  })
  solidMeshes.forEach((mesh) => {
    const shell = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({
      color: COLORS[record.tone],
      transparent: true,
      opacity: .055,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }))
    shell.scale.setScalar(1.025)
    shell.userData.buildingId = record.id
    mesh.add(shell)
  })
  addFloorSpaces(group, record)
  prepareBuildingFloors(group, record)
  return group
}
