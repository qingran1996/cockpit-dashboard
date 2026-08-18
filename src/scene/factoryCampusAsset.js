import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { buildingRegistry } from './buildingRegistry.js'
import { prepareBuildingFloors } from './floorInteraction.js'

export const FACTORY_CAMPUS_MODEL_URL = '/models/factory-campus-graybox.glb'

export function prepareFactoryCampusModel(root) {
  const interactiveObjects = buildingRegistry.map((record) => {
    const building = root.getObjectByName(record.nodeName)
    if (!building) throw new Error(`missing required building node: ${record.nodeName}`)

    building.userData.buildingId = record.id
    building.userData.interactive = true
    prepareBuildingFloors(building, record)
    building.traverse((object) => {
      object.userData.buildingId = record.id
      if (!object.isMesh) return
      object.castShadow = true
      object.receiveShadow = true
    })
    return building
  })

  const animatedObjects = []
  root.traverse((object) => {
    if (!object.userData.motionPath) return
    if (object.userData.motionPath === 'floor-walk') {
      let leftLeg = null
      let rightLeg = null
      object.traverse((child) => {
        if (child.name.endsWith('__leg-left')) leftLeg = child
        if (child.name.endsWith('__leg-right')) rightLeg = child
      })
      animatedObjects.push({
        kind: 'person',
        object,
        motionPath: object.userData.motionPath,
        distance: Number(object.userData.motionDistance) || 0,
        speed: Number(object.userData.motionSpeed) || 0,
        phase: Number(object.userData.motionPhase) || 0,
        baseX: object.position.x,
        baseY: object.position.y,
        baseRotationY: object.rotation.y,
        leftLeg,
        rightLeg,
      })
      return
    }
    animatedObjects.push({
      kind: 'vehicle',
      object,
      motionPath: object.userData.motionPath,
      distance: Number(object.userData.motionDistance) || 0,
      speed: Number(object.userData.motionSpeed) || 0,
    })
  })

  root.name ||= 'FactoryCampusGraybox'
  root.userData.assetSource = 'blender-glb'
  return { root, interactiveObjects, animatedObjects }
}

export async function loadFactoryCampusModel(loader = new GLTFLoader()) {
  const gltf = await loader.loadAsync(FACTORY_CAMPUS_MODEL_URL)
  return prepareFactoryCampusModel(gltf.scene)
}
