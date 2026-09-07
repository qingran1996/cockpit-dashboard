import * as THREE from 'three'
import { buildingRegistry } from './buildingRegistry.js'
import { createBuilding, createMaterialLibrary } from './buildingFactory.js'
import { loadPlantV068Model } from './plantV068Asset.js'

function createBase() {
  const group = new THREE.Group()
  const foundationMaterial = new THREE.MeshStandardMaterial({ color: 0x031421, metalness: .75, roughness: .35, emissive: 0x0878d8, emissiveIntensity: .08 })
  const deckMaterial = new THREE.MeshStandardMaterial({ color: 0x08202c, metalness: .55, roughness: .46 })
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x19d7ff, transparent: true, opacity: .78 })
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(25, .72, 19), foundationMaterial)
  foundation.position.y = -.36
  const deck = new THREE.Mesh(new THREE.BoxGeometry(24.2, .24, 18.2), deckMaterial)
  deck.position.y = .12
  const outline = new THREE.LineSegments(new THREE.EdgesGeometry(deck.geometry), edgeMaterial)
  deck.add(outline)
  group.add(foundation, deck)

  const railMaterial = new THREE.MeshBasicMaterial({ color: 0x19d7ff, transparent: true, opacity: .42, toneMapped: false })
  for (const [x, z, width, depth] of [[0, -9.05, 24, .035], [0, 9.05, 24, .035], [-12.05, 0, .035, 18], [12.05, 0, .035, 18]]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(width, .42, depth), railMaterial)
    rail.position.set(x, .33, z)
    group.add(rail)
  }
  return group
}

function createRoads() {
  const group = new THREE.Group()
  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x07131d, roughness: .88, metalness: .2 })
  const stripeMaterial = new THREE.MeshBasicMaterial({ color: 0x0b7396, transparent: true, opacity: .4 })
  const roads = [[0, .26, 1.15, 17.4], [0, .26, 23.4, 1.05], [-6.9, .26, .8, 17.4], [6.1, .26, .8, 17.4]]
  roads.forEach(([x, y, width, depth]) => {
    const road = new THREE.Mesh(new THREE.BoxGeometry(width, .05, depth), roadMaterial)
    road.position.set(x, y, 0)
    group.add(road)
  })
  for (let index = -8; index <= 8; index += 2) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(.06, .02, .72), stripeMaterial)
    stripe.position.set(0, .3, index)
    group.add(stripe)
  }
  return group
}

function createEnergyNetwork(animated) {
  const group = new THREE.Group()
  const cyan = new THREE.MeshBasicMaterial({ color: 0x19d7ff, transparent: true, opacity: .68, toneMapped: false })
  const orange = new THREE.MeshBasicMaterial({ color: 0xff7138, transparent: true, opacity: .78, toneMapped: false })
  const paths = [
    { tone: cyan, points: [[-11, .4, 7], [-7, .4, 5], [-3, .4, 4], [0, .4, 0], [4, .4, -2], [11, .4, -5]] },
    { tone: orange, points: [[-11, .42, 4], [-7, .42, 2], [-4, .42, 1], [-2, .42, -1], [2, .42, -4]] },
    { tone: cyan, points: [[11, .4, 7], [8, .4, 5], [4, .4, 5], [1, .4, 3], [-1, .4, 0]] },
  ]
  paths.forEach(({ tone, points }, pathIndex) => {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)))
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, .035, 6, false), tone)
    group.add(tube)
    for (let index = 0; index < 5; index += 1) {
      const node = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8), tone.clone())
      node.position.copy(curve.getPoint(index / 4))
      node.userData.phase = pathIndex + index * .7
      group.add(node)
      animated.push({ kind: 'pulse', object: node, phase: node.userData.phase })
    }
  })
  return group
}

function createParticles(animated) {
  const count = 160
  const positions = new Float32Array(count * 3)
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (Math.random() - .5) * 36
    positions[index * 3 + 1] = Math.random() * 10 + 1
    positions[index * 3 + 2] = (Math.random() - .5) * 28
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0x42dfff, size: .065, transparent: true, opacity: .62, blending: THREE.AdditiveBlending, depthWrite: false }))
  animated.push({ kind: 'particles', object: points })
  return points
}

function createSiteProps() {
  const group = new THREE.Group()
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x14332d, roughness: .85 })
  const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x0a4a45, roughness: .7, emissive: 0x16c9c3, emissiveIntensity: .09 })
  const treePositions = [[-10, -7], [-8, 7], [-4.5, 7.2], [3.5, 7.4], [7.5, 7], [10, 5.4], [10.3, .3], [9.4, -7], [5, -7.3], [1, 7.4], [-10.4, 3], [-10.2, -3]]
  treePositions.forEach(([x, z], index) => {
    const tree = new THREE.Group()
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, .5, 5), trunkMaterial)
    trunk.position.y = .55
    const crown = new THREE.Mesh(new THREE.ConeGeometry(.32 + (index % 3) * .04, .95, 7), foliageMaterial)
    crown.position.y = 1.15
    tree.position.set(x, .25, z)
    tree.scale.setScalar(.82 + (index % 4) * .08)
    tree.add(trunk, crown)
    group.add(tree)
  })

  const utilityMaterial = new THREE.MeshStandardMaterial({ color: 0x0c3548, metalness: .72, roughness: .25, emissive: 0x19d7ff, emissiveIntensity: .12 })
  for (const [x, z, scale] of [[1.3, 1.3, .8], [3.7, 1.7, .65], [-7.9, 1.2, .7], [5.7, 5.8, .58]]) {
    const utility = new THREE.Mesh(new THREE.CylinderGeometry(.34 * scale, .4 * scale, 1.35 * scale, 12), utilityMaterial)
    utility.position.set(x, .25 + .68 * scale, z)
    group.add(utility)
  }
  return group
}

function createLights() {
  const group = new THREE.Group()
  group.name = 'CampusLightingRig'
  group.visible = false
  const hemisphere = new THREE.HemisphereLight(0xb6f5ff, 0x031422, 2.45)
  hemisphere.name = 'CampusHemisphere'
  group.add(hemisphere)
  const key = new THREE.DirectionalLight(0xa8efff, 2.2)
  key.name = 'CampusKey'
  key.position.set(-8, 16, 8)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  const shadowFill = new THREE.DirectionalLight(0xa8efff, 1.15)
  shadowFill.name = 'CampusShadowFill'
  shadowFill.position.set(9, 12, -10)
  shadowFill.castShadow = false
  const facadeAmbient = new THREE.AmbientLight(0xf4f1e9, 1.2)
  facadeAmbient.name = 'CampusFacadeAmbient'
  const cyan = new THREE.PointLight(0x19d7ff, 42, 24, 2)
  cyan.name = 'CampusRoadGlow'
  cyan.position.set(6, 5, 2)
  const orange = new THREE.PointLight(0xff7138, 48, 19, 2)
  orange.name = 'CampusAccentGlow'
  orange.position.set(-2, 4, -1)
  group.add(key, shadowFill, facadeAmbient, cyan, orange)
  return group
}

function disposeTree(tree) {
  const geometries = new Set()
  const materials = new Set()
  tree.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry)
    const entries = Array.isArray(object.material) ? object.material : [object.material]
    entries.filter(Boolean).forEach((material) => materials.add(material))
  })
  geometries.forEach((geometry) => geometry.dispose())
  materials.forEach((material) => material.dispose())
}

export function createIndustrialScene({
  loadCampus = loadPlantV068Model,
  onAssetStatusChange = () => {},
  onAssetProgress = () => {},
  onAssetError = () => {},
} = {}) {
  const root = new THREE.Group()
  const fallback = new THREE.Group()
  fallback.name = 'ProceduralFallback'
  const interactiveObjects = []
  const animated = []
  const materials = { cyan: createMaterialLibrary('cyan'), orange: createMaterialLibrary('orange') }
  let disposed = false
  let materialTemplatesDisposed = false

  onAssetStatusChange('loading')

  const disposeMaterialTemplates = () => {
    if (materialTemplatesDisposed) return
    materialTemplatesDisposed = true
    Object.values(materials).forEach((library) => Object.values(library).forEach((material) => material.dispose()))
  }

  fallback.add(createBase(), createRoads(), createSiteProps(), createEnergyNetwork(animated), createParticles(animated))
  root.add(fallback, createLights())
  const grid = new THREE.GridHelper(44, 44, 0x075f88, 0x07324c)
  grid.position.y = -.75
  grid.material.transparent = true
  grid.material.opacity = .3
  fallback.add(grid)

  buildingRegistry.forEach((record) => {
    const buildingMaterials = Object.fromEntries(Object.entries(materials[record.tone]).map(([key, material]) => [key, material.clone()]))
    const building = createBuilding(record, buildingMaterials)
    fallback.add(building)
    interactiveObjects.push(building)
    if (record.model === 'chimney' || record.model === 'factory') animated.push({ kind: 'heat', object: building, phase: interactiveObjects.length * .5 })
  })

  const ready = Promise.resolve()
    .then(() => loadCampus({ onProgress: onAssetProgress }))
    .then((campus) => {
      if (disposed) {
        disposeTree(campus.root)
        return { source: 'fallback', error: new Error('scene disposed before campus loaded') }
      }
      root.remove(fallback)
      disposeTree(fallback)
      disposeMaterialTemplates()
      root.add(campus.root)
      interactiveObjects.splice(0, interactiveObjects.length, ...campus.interactiveObjects)
      animated.splice(0, animated.length, ...(campus.animatedObjects ?? []).map((item) => ({
        ...item,
        baseZ: item.object.position.z,
        baseRotationY: item.object.rotation.y,
      })))
      onAssetStatusChange('ready')
      return { source: 'glb' }
    })
    .catch((error) => {
      if (!disposed) {
        onAssetStatusChange('error')
        onAssetError(error)
      }
      return { source: 'fallback', error }
    })

  const dispose = () => {
    if (disposed) return
    disposed = true
    disposeTree(root)
    disposeMaterialTemplates()
  }

  return { root, interactiveObjects, animated, ready, dispose }
}
