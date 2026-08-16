import * as THREE from 'three'
import {
  createFactoryCampusBuilding,
  createFactoryCampusLights,
  createFactoryCampusMaterials,
  createFactoryCampusSystems,
} from './factoryCampusFactory.js'
import { factoryCampusRegistry } from './factoryCampusRegistry.js'

function cloneMaterialLibrary(library) {
  return Object.fromEntries(
    Object.entries(library).map(([key, material]) => [key, material.clone()]),
  )
}

export function createIndustrialScene() {
  const root = new THREE.Group()
  root.name = 'factory-campus'
  root.userData.sculptRuntime = {
    targetId: 'factory-campus',
    source: 'procedural-img2threejs',
    approximateSingleViewReconstruction: true,
    clickable: true,
    explodable: true,
  }

  const interactiveObjects = []
  const animated = []
  const parts = []
  const materialTemplates = createFactoryCampusMaterials()

  const systems = createFactoryCampusSystems(animated)
  root.add(systems, createFactoryCampusLights())

  const runtimeSystemNames = new Set([
    'road-system',
    'sports-system',
    'pipe-rack-system',
    'parking-system',
    'landscape-system',
    'perimeter-system',
    'pedestrian-system',
    'external-transport-system',
  ])
  systems.children
    .filter((node) => runtimeSystemNames.has(node.name))
    .forEach((node) => {
      parts.push({
        id: node.name,
        name: node.name,
        node,
        selectable: false,
        explodable: false,
        explodeOrigin: node.position.clone(),
        collider: null,
      })
    })

  factoryCampusRegistry.forEach((record) => {
    const materials = cloneMaterialLibrary(materialTemplates)
    const building = createFactoryCampusBuilding(record, materials)
    building.userData.materialLibrary = materials
    root.add(building)
    interactiveObjects.push(building)
    parts.push({
      id: record.id,
      name: record.name,
      node: building,
      selectable: true,
      explodable: true,
      explodeOrigin: building.position.clone(),
      collider: { type: 'box', size: [...record.size] },
    })
  })

  const setExploded = (layoutScale = 1) => {
    const scale = THREE.MathUtils.clamp(layoutScale, 1, 1.8)
    parts.filter((part) => part.explodable).forEach(({ node, explodeOrigin }) => {
      node.position.set(
        explodeOrigin.x * scale,
        explodeOrigin.y,
        explodeOrigin.z * scale,
      )
    })
  }
  root.userData.sculptRuntime = {
    ...root.userData.sculptRuntime,
    parts,
    nodes: Object.fromEntries(parts.map((part) => [part.id, part.node])),
    colliders: Object.fromEntries(
      parts.filter((part) => part.collider).map((part) => [part.id, part.collider]),
    ),
    setExploded,
    resetExplosion: () => setExploded(1),
  }

  const dispose = () => {
    const geometries = new Set()
    const sceneMaterials = new Set()
    root.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry)
      if (object.userData.materialLibrary) {
        Object.values(object.userData.materialLibrary).forEach((material) => sceneMaterials.add(material))
      }
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.filter(Boolean).forEach((material) => sceneMaterials.add(material))
    })
    Object.values(materialTemplates).forEach((material) => sceneMaterials.add(material))
    geometries.forEach((geometry) => geometry.dispose())
    sceneMaterials.forEach((material) => material.dispose())
  }

  return { root, interactiveObjects, animated, dispose }
}
