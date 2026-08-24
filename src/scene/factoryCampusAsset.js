import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { buildingRegistry } from './buildingRegistry.js'
import { prepareBuildingFloors } from './floorInteraction.js'
import { collectCampusRoutes } from './campusRouteRegistry.js'
import { configureCampusMeshShadows } from './campusShadowQuality.js'
import { optimizeCampusStaticInstances } from './campusStaticInstancing.js'

export const FACTORY_CAMPUS_MODEL_URL = '/models/factory-campus-graybox.glb'

export function prepareFactoryCampusModel(root) {
  const buildingNodes = new Map(buildingRegistry.map((record) => {
    const building = root.getObjectByName(record.nodeName)
    if (!building) throw new Error(`missing required building node: ${record.nodeName}`)
    return [record.id, building]
  }))
  const routes = collectCampusRoutes(root)
  const instancingStats = optimizeCampusStaticInstances(root)
  const interactiveObjects = buildingRegistry.map((record) => {
    const building = buildingNodes.get(record.id)

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
  configureCampusMeshShadows(root)

  const animatedObjects = []
  root.traverse((object) => {
    if (!object.userData.motionPath) return
    if (object.userData.motionPath === 'robot-work-cycle') {
      const joints = {}
      object.traverse((child) => {
        const role = child.userData.robotJointRole
        if (role === 'turntable') joints.turntable = child
        if (role === 'shoulder') joints.shoulder = child
        if (role === 'elbow') joints.elbow = child
        if (role === 'wrist') joints.wrist = child
        if (role === 'gripper-left') joints.gripperLeft = child
        if (role === 'gripper-right') joints.gripperRight = child
        if (role === 'payload') joints.payload = child
      })
      animatedObjects.push({
        kind: 'robot-arm',
        object,
        motionPath: object.userData.motionPath,
        speed: Number(object.userData.motionSpeed) || 0,
        phase: Number(object.userData.motionPhase) || 0,
        joints,
        basePose: {
          turntableY: joints.turntable?.rotation.y ?? 0,
          shoulderZ: joints.shoulder?.rotation.z ?? 0,
          elbowZ: joints.elbow?.rotation.z ?? 0,
          wristZ: joints.wrist?.rotation.z ?? 0,
          gripperLeftX: joints.gripperLeft?.position.x ?? 0,
          gripperRightX: joints.gripperRight?.position.x ?? 0,
          payloadY: joints.payload?.position.y ?? 0,
        },
      })
      return
    }
    if (object.userData.motionPath === 'campus-route') {
      const routeId = String(object.userData.linkedRoute || '')
      const route = routes.get(routeId)
      if (!route) throw new Error(`missing campus route for vehicle: ${object.name} -> ${routeId}`)
      animatedObjects.push({
        kind: 'route-vehicle',
        object,
        motionPath: 'campus-route',
        route,
        speed: Number(object.userData.motionSpeed) || 0,
        phase: Number(object.userData.motionPhase) || 0,
        basePosition: object.position.clone(),
        baseRotationY: object.rotation.y,
      })
      return
    }
    if (object.userData.motionPath === 'floor-walk' || object.userData.motionPath === 'site-patrol' || object.userData.motionPath === 'task-route') {
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
        axis: object.userData.motionAxis === 'z' ? 'z' : 'x',
        distance: Number(object.userData.motionDistance) || 0,
        speed: Number(object.userData.motionSpeed) || 0,
        phase: Number(object.userData.motionPhase) || 0,
        dwellFraction: Number(object.userData.dwellFraction) || 0,
        taskRole: object.userData.taskRole || '',
        taskStartAnchor: object.userData.taskStartAnchor || '',
        taskEndAnchor: object.userData.taskEndAnchor || '',
        baseX: object.position.x,
        baseY: object.position.y,
        baseZ: object.position.z,
        baseRotationY: object.rotation.y,
        leftLeg,
        rightLeg,
      })
      return
    }
    if (object.userData.motionPath === 'gate-barrier') {
      animatedObjects.push({
        kind: 'gate',
        object,
        motionPath: object.userData.motionPath,
        axis: object.userData.motionAxis || 'z',
        speed: Number(object.userData.motionSpeed) || 0,
        phase: Number(object.userData.motionPhase) || 0,
        closedAngle: Number(object.userData.closedAngle) || 0,
        openAngle: Number(object.userData.openAngle) || 0,
        baseRotationX: object.rotation.x,
        baseRotationY: object.rotation.y,
        baseRotationZ: object.rotation.z,
      })
      return
    }
    animatedObjects.push({
      kind: 'vehicle',
      object,
      motionPath: object.userData.motionPath,
      axis: object.userData.motionAxis === 'x' ? 'x' : 'z',
      distance: Number(object.userData.motionDistance) || 0,
      speed: Number(object.userData.motionSpeed) || 0,
      phase: Number(object.userData.motionPhase) || 0,
      baseX: object.position.x,
      baseY: object.position.y,
      baseZ: object.position.z,
      baseRotationY: object.rotation.y,
    })
  })

  root.name ||= 'FactoryCampusGraybox'
  root.userData.assetSource = 'blender-glb'
  root.userData.staticInstancing = { ...instancingStats }
  return { root, interactiveObjects, animatedObjects, routes, instancingStats }
}

export async function loadFactoryCampusModel(loader = new GLTFLoader()) {
  const gltf = await loader.loadAsync(FACTORY_CAMPUS_MODEL_URL)
  return prepareFactoryCampusModel(gltf.scene)
}
