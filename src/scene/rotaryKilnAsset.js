import * as THREE from 'three'

export const ROTARY_KILN_MODEL_URL = '/models/hzy.glb'

export function prepareRotaryKilnModel(root, { maxDimension = 6 } = {}) {
  root.updateMatrixWorld(true)
  const sourceBounds = new THREE.Box3().setFromObject(root)
  const sourceSize = sourceBounds.getSize(new THREE.Vector3())
  const sourceMaxDimension = Math.max(sourceSize.x, sourceSize.y, sourceSize.z)

  if (!Number.isFinite(sourceMaxDimension) || sourceMaxDimension <= 0) {
    throw new Error('rotary kiln GLB has no measurable mesh bounds')
  }

  root.scale.multiplyScalar(maxDimension / sourceMaxDimension)
  root.updateMatrixWorld(true)
  const fittedBounds = new THREE.Box3().setFromObject(root)
  const fittedCenter = fittedBounds.getCenter(new THREE.Vector3())
  root.position.sub(fittedCenter)
  root.updateMatrixWorld(true)

  root.name = 'RotaryKilnHzy'
  root.userData.assetSource = 'hzy-glb'
  root.traverse((object) => {
    if (!object.isMesh) return
    object.castShadow = true
    object.receiveShadow = true
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials.filter(Boolean)) {
      if ('envMapIntensity' in material) material.envMapIntensity = 1.15
    }
  })

  return root
}
