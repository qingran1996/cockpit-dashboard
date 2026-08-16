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
  const materialTemplates = createFactoryCampusMaterials()

  root.add(
    createFactoryCampusSystems(animated),
    createFactoryCampusLights(),
  )

  factoryCampusRegistry.forEach((record) => {
    const materials = cloneMaterialLibrary(materialTemplates)
    const building = createFactoryCampusBuilding(record, materials)
    root.add(building)
    interactiveObjects.push(building)
  })

  const dispose = () => {
    const geometries = new Set()
    const sceneMaterials = new Set()
    root.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry)
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.filter(Boolean).forEach((material) => sceneMaterials.add(material))
    })
    geometries.forEach((geometry) => geometry.dispose())
    sceneMaterials.forEach((material) => material.dispose())
    Object.values(materialTemplates).forEach((material) => material.dispose())
  }

  return { root, interactiveObjects, animated, dispose }
}
