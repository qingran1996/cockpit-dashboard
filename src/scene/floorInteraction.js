import * as THREE from 'three'

const EXPLODED_FLOOR_GAP = 1.25
const FLOOR_OPACITY = .86

function materialEntries(material) {
  return (Array.isArray(material) ? material : [material]).filter(Boolean)
}

function rememberMaterialState(material) {
  if (material.userData.floorBaseState) return material.userData.floorBaseState
  material.userData.floorBaseState = {
    opacity: material.opacity,
    transparent: material.transparent,
    depthWrite: material.depthWrite,
    emissiveIntensity: material.emissiveIntensity,
  }
  return material.userData.floorBaseState
}

function restoreMaterial(material) {
  const base = rememberMaterialState(material)
  material.opacity = base.opacity
  material.transparent = base.transparent
  material.depthWrite = base.depthWrite
  if (base.emissiveIntensity !== undefined) material.emissiveIntensity = base.emissiveIntensity
  material.needsUpdate = true
}

function setMeshOpacity(mesh, opacity, { emphasize = false } = {}) {
  materialEntries(mesh.material).forEach((material) => {
    const base = rememberMaterialState(material)
    material.transparent = true
    material.opacity = opacity
    material.depthWrite = opacity >= .5
    if (base.emissiveIntensity !== undefined) {
      material.emissiveIntensity = emphasize ? Math.max(.68, base.emissiveIntensity * 3) : base.emissiveIntensity
    }
    material.needsUpdate = true
  })
}

function cloneMeshMaterials(mesh) {
  mesh.material = Array.isArray(mesh.material)
    ? mesh.material.map((material) => material.clone())
    : mesh.material.clone()
}

function belongsToFloor(object, floorRoots) {
  let current = object.parent
  while (current) {
    if (floorRoots.includes(current)) return true
    current = current.parent
  }
  return false
}

function makeFloorOutline(record, floor) {
  const width = Math.max(record.size?.[0] ?? 1, 1) * .98
  const depth = Math.max(record.size?.[2] ?? 1, 1) * .98
  const points = [
    new THREE.Vector3(-width / 2, .08, -depth / 2),
    new THREE.Vector3(width / 2, .08, -depth / 2),
    new THREE.Vector3(width / 2, .08, depth / 2),
    new THREE.Vector3(-width / 2, .08, depth / 2),
    new THREE.Vector3(-width / 2, .08, -depth / 2),
  ]
  const color = floor.tone === 'orange' ? 0xff7138 : 0x19d7ff
  const outline = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: .72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  )
  outline.name = `FLOOR_FX__${record.id}__${floor.id}__outline`
  outline.visible = false
  outline.renderOrder = 8
  return outline
}

function makeBuildingFloorFx(building, record, floorRoots) {
  const fx = new THREE.Group()
  fx.name = `FLOOR_FX__${record.id}__spine`
  fx.visible = false

  const x = -(record.size?.[0] ?? 1) * .47
  const z = (record.size?.[2] ?? 1) * .47
  const height = Math.max(1, (floorRoots.length - 1) * EXPLODED_FLOOR_GAP + .65)
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, .02, z),
      new THREE.Vector3(x, height, z),
    ]),
    new THREE.LineBasicMaterial({
      color: 0x63efff,
      transparent: true,
      opacity: .72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  )
  line.renderOrder = 9
  fx.add(line)

  const pulses = floorRoots.map((floor, index) => {
    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry(.075, 10, 8),
      new THREE.MeshBasicMaterial({
        color: floor.userData.tone === 'orange' ? 0xff7138 : 0x7cf5ff,
        transparent: true,
        opacity: .9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    )
    pulse.position.set(x, index * EXPLODED_FLOOR_GAP, z)
    pulse.renderOrder = 10
    fx.add(pulse)
    return pulse
  })

  building.add(fx)
  building.userData.floorFx = { group: fx, line, pulses, phase: 0 }
}

export function prepareBuildingFloors(building, record) {
  const byName = new Map()
  building.traverse((object) => {
    if (object.name.startsWith(`FLOOR__${record.id}__`)) byName.set(object.name, object)
  })
  const floorRoots = record.floors.map((floor, index) => {
    const floorRoot = byName.get(`FLOOR__${record.id}__${floor.id}`)
    if (!floorRoot) throw new Error(`missing required floor node: FLOOR__${record.id}__${floor.id}`)
    floorRoot.userData = {
      ...floorRoot.userData,
      ...floor,
      buildingId: record.id,
      floorId: floor.id,
      floorIndex: index,
      baseY: floorRoot.position.y,
      interactive: true,
      targetY: floorRoot.position.y,
      animationDelay: 0,
      fxPhase: index * .7,
    }
    const outline = makeFloorOutline(record, floor)
    floorRoot.add(outline)
    floorRoot.userData.outline = outline
    floorRoot.visible = false
    return floorRoot
  })

  const exteriorMeshes = []
  building.traverse((object) => {
    if (!object.isMesh) return
    cloneMeshMaterials(object)
    object.userData.buildingId = record.id
    if (!belongsToFloor(object, floorRoots)) {
      object.userData.layerRole = 'exterior'
      exteriorMeshes.push(object)
    }
  })
  building.userData.floorRoots = floorRoots
  building.userData.exteriorMeshes = exteriorMeshes
  makeBuildingFloorFx(building, record, floorRoots)
  return floorRoots
}

export function applyFloorView(buildings, { buildingId = null, exploded = false } = {}) {
  for (const building of buildings) {
    const selected = building.userData.buildingId === buildingId
    const floors = building.userData.floorRoots ?? []
    const exteriorMeshes = building.userData.exteriorMeshes ?? []

    exteriorMeshes.forEach((mesh) => {
      if (selected) setMeshOpacity(mesh, .1)
      else materialEntries(mesh.material).forEach(restoreMaterial)
    })

    floors.forEach((floor, index) => {
      floor.visible = selected
      floor.userData.targetY = floor.userData.baseY + (selected && exploded ? index * EXPLODED_FLOOR_GAP : 0)
      floor.userData.animationDelay = selected && exploded ? index * .075 : 0
      if (!selected) floor.position.y = floor.userData.baseY
      if (floor.userData.outline) floor.userData.outline.visible = selected && exploded
      floor.traverse((object) => {
        if (!object.isMesh) return
        if (!selected) {
          materialEntries(object.material).forEach(restoreMaterial)
          return
        }
        const role = object.userData.layerRole
        const opacity = role === 'floor-volume' ? .10 : role === 'interior-prop' ? .98 : FLOOR_OPACITY
        setMeshOpacity(object, opacity, { emphasize: role !== 'floor-volume' })
      })
    })

    if (building.userData.floorFx) building.userData.floorFx.group.visible = selected && exploded
  }
}

export function updateFloorAnimations(buildings, deltaSeconds, reducedMotion = false) {
  const delta = Math.max(0, Math.min(deltaSeconds, .1))
  for (const building of buildings) {
    const floors = building.userData.floorRoots ?? []
    floors.forEach((floor, index) => {
      if (reducedMotion) {
        floor.position.y = floor.userData.targetY ?? floor.userData.baseY
      } else if (floor.visible) {
        floor.userData.animationDelay = Math.max(0, (floor.userData.animationDelay ?? 0) - delta)
        if (floor.userData.animationDelay === 0) {
          const response = 1 - Math.exp(-delta * Math.max(5.8, 8.4 - index * .55))
          floor.position.y += ((floor.userData.targetY ?? floor.position.y) - floor.position.y) * response
        }
      }

      const outline = floor.userData.outline
      if (outline?.visible) {
        floor.userData.fxPhase = (floor.userData.fxPhase ?? 0) + delta
        outline.material.opacity = reducedMotion ? .72 : .58 + Math.sin(floor.userData.fxPhase * 4.2) * .2
      }
    })

    const fx = building.userData.floorFx
    if (!fx?.group.visible) continue
    fx.phase += delta
    fx.pulses.forEach((pulse, index) => {
      pulse.position.y = floors[index]?.position.y ?? index * EXPLODED_FLOOR_GAP
      const wave = reducedMotion ? 1 : 1 + Math.sin(fx.phase * 5 - index * .8) * .38
      pulse.scale.setScalar(wave)
      pulse.material.opacity = reducedMotion ? .82 : .64 + Math.sin(fx.phase * 5 - index * .8) * .28
    })
    fx.line.material.opacity = reducedMotion ? .72 : .52 + Math.sin(fx.phase * 2.6) * .2
  }
}

export { EXPLODED_FLOOR_GAP }
