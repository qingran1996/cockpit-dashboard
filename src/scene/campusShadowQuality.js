import * as THREE from 'three'

function materialEntries(object) {
  return (Array.isArray(object.material) ? object.material : [object.material]).filter(Boolean)
}

export function configureCampusMeshShadows(root) {
  root.traverse((object) => {
    if (!object.isMesh) return
    const isMicrodetail = object.userData.detailTier === 'micro'
    const isFoliage = Boolean(object.userData.vegetationTier || object.userData.vegetationSpecies)
    const hasTransparentMaterial = materialEntries(object).some((material) => material.transparent || material.opacity < .98)
    object.castShadow = Boolean(object.userData.buildingId) && !isMicrodetail && !isFoliage && !hasTransparentMaterial
    object.receiveShadow = true
  })
  return root
}

export function configureCampusShadowQuality({ renderer, root }) {
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  const key = root.getObjectByName('CampusKey')
  if (!key?.isDirectionalLight) return null

  key.castShadow = true
  key.shadow.mapSize.set(4096, 4096)
  key.shadow.camera.left = -44
  key.shadow.camera.right = 44
  key.shadow.camera.top = 44
  key.shadow.camera.bottom = -44
  key.shadow.camera.near = .5
  key.shadow.camera.far = 110
  key.shadow.bias = -.0002
  key.shadow.normalBias = .045
  key.shadow.radius = 2
  key.shadow.camera.updateProjectionMatrix()
  return key
}
