import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

export const EXTERNAL_FACTORY_MODEL_URL = '/models/20260824.fbx'
export const EXTERNAL_FACTORY_MAX_DIMENSION = 52

function meshWorldBounds(mesh) {
  if (!mesh.geometry?.attributes?.position) return null
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
  if (!mesh.geometry.boundingBox || mesh.geometry.boundingBox.isEmpty()) return null
  return mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld)
}

function visibleMeshBounds(root) {
  const bounds = new THREE.Box3()
  root.traverse((object) => {
    if (!object.isMesh || !object.visible) return
    const meshBounds = meshWorldBounds(object)
    if (meshBounds) bounds.union(meshBounds)
  })
  return bounds
}

function hidePresentationOutliers(root) {
  root.updateMatrixWorld(true)
  const records = []
  root.traverse((object) => {
    if (!object.isMesh || !object.visible) return
    const bounds = meshWorldBounds(object)
    if (!bounds) return
    const size = bounds.getSize(new THREE.Vector3())
    const dimensions = [size.x, size.y, size.z].sort((a, b) => a - b)
    records.push({
      object,
      minDimension: dimensions[0],
      maxDimension: dimensions[2],
    })
  })

  const hidden = []
  for (const record of records) {
    const isTopLevelDatum = record.object.parent === root
      && record.maxDimension > 0
      && record.minDimension / record.maxDimension < 0.02
    if (!isTopLevelDatum) continue
    record.object.visible = false
    hidden.push(record.object.name || record.object.uuid)
  }

  const remaining = records
    .filter(({ object }) => object.visible)
    .sort((a, b) => b.maxDimension - a.maxDimension)
  if (remaining.length > 1 && remaining[0].maxDimension > remaining[1].maxDimension * 2.5) {
    remaining[0].object.visible = false
    hidden.push(remaining[0].object.name || remaining[0].object.uuid)
  }
  return hidden
}

export function prepareExternalFactoryModel(root, { maxDimension = EXTERNAL_FACTORY_MAX_DIMENSION } = {}) {
  root.rotateX(-Math.PI / 2)
  root.updateMatrixWorld(true)
  const presentationHiddenObjects = hidePresentationOutliers(root)
  const sourceBounds = visibleMeshBounds(root)
  const sourceSize = sourceBounds.getSize(new THREE.Vector3())
  const sourceMaxDimension = Math.max(sourceSize.x, sourceSize.y, sourceSize.z)
  if (!Number.isFinite(sourceMaxDimension) || sourceMaxDimension <= 0) {
    throw new Error('external FBX has no measurable mesh bounds')
  }

  root.scale.multiplyScalar(maxDimension / sourceMaxDimension)
  root.updateMatrixWorld(true)

  const scaledBounds = visibleMeshBounds(root)
  const scaledCenter = scaledBounds.getCenter(new THREE.Vector3())
  root.position.x -= scaledCenter.x
  root.position.y -= scaledBounds.min.y
  root.position.z -= scaledCenter.z
  root.updateMatrixWorld(true)

  root.name = 'ExternalFactoryAssembly20260824'
  root.userData.assetSource = 'external-fbx-20260824'
  root.userData.presentationHiddenObjects = presentationHiddenObjects
  root.userData.originalBounds = {
    size: sourceSize.toArray(),
    center: sourceBounds.getCenter(new THREE.Vector3()).toArray(),
  }
  root.traverse((object) => {
    if (!object.isMesh) return
    object.castShadow = true
    object.receiveShadow = true
  })

  return {
    root,
    interactiveObjects: [],
    animatedObjects: [],
    routes: [],
    instancingStats: { sourceMeshes: 0, instancedMeshes: 0, drawCallReduction: 0 },
  }
}

export async function loadExternalFactoryModel(loader = new FBXLoader()) {
  const root = await loader.loadAsync(EXTERNAL_FACTORY_MODEL_URL)
  return prepareExternalFactoryModel(root)
}
