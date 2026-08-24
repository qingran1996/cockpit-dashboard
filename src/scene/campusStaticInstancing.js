import * as THREE from 'three'

const SEMANTIC_USER_DATA_KEYS = [
  'detailTier',
  'interactive',
  'layerRole',
  'lightRole',
  'tone',
  'vegetationDetail',
  'vegetationSpecies',
  'vegetationTier',
  'visibilityTier',
]

function materialEntries(object) {
  return (Array.isArray(object.material) ? object.material : [object.material]).filter(Boolean)
}

function hasAnimatedAncestor(object) {
  let current = object
  while (current) {
    if (current.userData.motionPath) return true
    current = current.parent
  }
  return false
}

function hasOrderDependentMaterial(object) {
  return materialEntries(object).some((material) => (
    material.transparent
    || material.opacity < .999
    || material.transmission > 0
  ))
}

function semanticSignature(object) {
  return SEMANTIC_USER_DATA_KEYS
    .map((key) => `${key}:${String(object.userData[key] ?? '')}`)
    .join('|')
}

function nameRole(name = '') {
  return name.split('__')[0]
}

function isProtectedRuntimeName(name = '') {
  return name.startsWith('LIGHT__') || name.startsWith('GATE__reader-')
}

function isEligibleStaticMesh(object) {
  if (!object.isMesh || object.isInstancedMesh || object.isSkinnedMesh) return false
  if (object.children.length > 0 || object.morphTargetInfluences?.length) return false
  if (hasAnimatedAncestor(object) || hasOrderDependentMaterial(object)) return false
  if (isProtectedRuntimeName(object.name)) return false
  object.updateMatrix()
  return object.matrix.determinant() > 0
}

function materialSignature(object) {
  return materialEntries(object).map((material) => material.uuid).join(',')
}

function batchSignature(object) {
  return [
    object.geometry.uuid,
    materialSignature(object),
    nameRole(object.name),
    semanticSignature(object),
    object.visible,
    object.renderOrder,
    object.layers.mask,
    object.frustumCulled,
  ].join('::')
}

function collectParents(root) {
  const parents = []
  root.traverse((object) => parents.push(object))
  return parents
}

function createInstanceBatch(parent, meshes) {
  const first = meshes[0]
  const batch = new THREE.InstancedMesh(first.geometry, first.material, meshes.length)
  batch.name = first.name
  batch.userData = { ...first.userData, staticInstanceBatch: true, instanceCount: meshes.length }
  batch.castShadow = first.castShadow
  batch.receiveShadow = first.receiveShadow
  batch.visible = first.visible
  batch.renderOrder = first.renderOrder
  batch.layers.mask = first.layers.mask
  batch.frustumCulled = first.frustumCulled

  meshes.forEach((mesh, index) => {
    mesh.updateMatrix()
    batch.setMatrixAt(index, mesh.matrix)
  })
  batch.instanceMatrix.setUsage(THREE.StaticDrawUsage)
  batch.instanceMatrix.needsUpdate = true
  batch.computeBoundingBox()
  batch.computeBoundingSphere()

  meshes.forEach((mesh) => parent.remove(mesh))
  parent.add(batch)
  return batch
}

export function optimizeCampusStaticInstances(root) {
  const stats = {
    sourceMeshes: 0,
    instancedMeshes: 0,
    instancedObjects: 0,
    drawCallsSaved: 0,
  }

  for (const parent of collectParents(root)) {
    const groups = new Map()
    for (const child of [...parent.children]) {
      if (!isEligibleStaticMesh(child)) continue
      const signature = batchSignature(child)
      if (!groups.has(signature)) groups.set(signature, [])
      groups.get(signature).push(child)
    }

    for (const meshes of groups.values()) {
      if (meshes.length < 2) continue
      createInstanceBatch(parent, meshes)
      stats.sourceMeshes += meshes.length
      stats.instancedMeshes += 1
      stats.instancedObjects += meshes.length
      stats.drawCallsSaved += meshes.length - 1
    }
  }

  return stats
}
