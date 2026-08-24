import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { buildingRegistry } from '../src/scene/buildingRegistry.js'
import { prepareFactoryCampusModel } from '../src/scene/factoryCampusAsset.js'

function makeCampus({ omitId = null, includeRoute = false, includeStaticRepeats = false, linkedRoute = 'warehouse-delivery' } = {}) {
  const root = new THREE.Group()
  root.name = 'FactoryCampusGraybox'
  const sharedMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc })
  for (const record of buildingRegistry) {
    if (record.id === omitId) continue
    const building = new THREE.Group()
    building.name = record.nodeName
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      sharedMaterial,
    )
    building.add(mesh)
    for (const floor of record.floors) {
      const floorRoot = new THREE.Group()
      floorRoot.name = `FLOOR__${record.id}__${floor.id}`
      floorRoot.userData = { ...floor, buildingId: record.id, floorId: floor.id }
      floorRoot.add(new THREE.Mesh(new THREE.BoxGeometry(.8, .2, .8), sharedMaterial))
      building.add(floorRoot)
    }
    if (includeStaticRepeats && record.id === 'main-production-hall') {
      const cladding = new THREE.Group()
      cladding.name = 'CLADDING__main-production-hall'
      const panelGeometry = new THREE.BoxGeometry(.2, 1, 1)
      for (let index = 0; index < 3; index += 1) {
        const panel = new THREE.Mesh(panelGeometry, sharedMaterial)
        panel.name = `CLADDING__panel-${index + 1}`
        panel.position.x = index * .4
        panel.userData = { detailTier: 'micro', visibilityTier: 'near' }
        cladding.add(panel)
      }
      building.add(cladding)
    }
    root.add(building)
  }
  const shuttle = new THREE.Group()
  shuttle.name = 'VEHICLE__gate-shuttle__root'
  shuttle.userData = { motionPath: 'gate-lane', motionDistance: 10, motionSpeed: .09 }
  root.add(shuttle)
  const patrol = new THREE.Group()
  patrol.name = 'PATROL__campus-01'
  patrol.position.set(3, .1, -4)
  patrol.userData = { motionPath: 'site-patrol', motionAxis: 'z', motionDistance: 6, motionSpeed: .08, motionPhase: .2 }
  root.add(patrol)
  const taskOperator = new THREE.Group()
  taskOperator.name = 'TASK_OPERATOR__process-inspection-01'
  taskOperator.position.set(-1, .1, 2)
  taskOperator.userData = {
    motionPath: 'task-route',
    motionAxis: 'x',
    motionDistance: 3,
    motionSpeed: .1,
    motionPhase: .05,
    dwellFraction: .16,
    taskRole: 'process-inspection',
    taskStartAnchor: 'TASK_ANCHOR__process-inspection-01__start',
    taskEndAnchor: 'TASK_ANCHOR__process-inspection-01__end',
  }
  root.add(taskOperator)
  const barrier = new THREE.Group()
  barrier.name = 'GATE__barrier-inbound'
  barrier.userData = { motionPath: 'gate-barrier', motionAxis: 'z', motionSpeed: .09, closedAngle: 0, openAngle: 1.22 }
  root.add(barrier)
  const forklift = new THREE.Group()
  forklift.name = 'LOGISTICS_OPS__front-warehouse__forklift'
  forklift.position.set(2, .1, 3)
  forklift.userData = { motionPath: 'yard-shuttle', motionAxis: 'x', motionDistance: 3.2, motionSpeed: .06, motionPhase: .4 }
  root.add(forklift)
  const robot = new THREE.Group()
  robot.name = 'ROBOT_CELL__main-production-hall__L01__assembly-01'
  robot.userData = { motionPath: 'robot-work-cycle', motionSpeed: .18, motionPhase: .08 }
  for (const role of ['turntable', 'shoulder', 'elbow', 'wrist', 'gripper-left', 'gripper-right', 'payload']) {
    const joint = new THREE.Group()
    joint.name = `${robot.name}__joint-${role}`
    joint.userData = { robotJointRole: role }
    robot.add(joint)
  }
  root.add(robot)
  const firstFloor = root.getObjectByName('FLOOR__main-production-hall__L01')
  const walker = new THREE.Group()
  walker.name = 'WALKER__main-production-hall__L01__01'
  walker.position.set(-2, .1, 0)
  walker.userData = { motionPath: 'floor-walk', motionDistance: 4, motionSpeed: .12, motionPhase: .25 }
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(.08, .24, .08), sharedMaterial)
  leftLeg.name = `${walker.name}__leg-left`
  const rightLeg = leftLeg.clone()
  rightLeg.name = `${walker.name}__leg-right`
  walker.add(leftLeg, rightLeg)
  if (firstFloor) firstFloor.add(walker)
  if (includeRoute) {
    const route = new THREE.Group()
    route.name = 'ROUTE__warehouse-delivery'
    route.userData = { routeId: 'warehouse-delivery', loopMode: 'ping-pong', dwellFraction: .14 }
    for (const [order, position] of [[1, [0, 0, 0]], [2, [4, 0, 0]], [3, [4, 0, 3]]]) {
      const waypoint = new THREE.Group()
      waypoint.name = `WAYPOINT__warehouse-delivery__${String(order).padStart(2, '0')}`
      waypoint.position.set(...position)
      waypoint.userData = { routeId: 'warehouse-delivery', waypointOrder: order }
      route.add(waypoint)
    }
    root.add(route)
    const delivery = new THREE.Group()
    delivery.name = 'VEHICLE__delivery-truck__root'
    delivery.userData = { motionPath: 'campus-route', linkedRoute, motionSpeed: .022, motionPhase: .02 }
    root.add(delivery)
  }
  return root
}

test('instances repeated static GLB siblings before floor materials are prepared', () => {
  const campus = makeCampus({ includeStaticRepeats: true })
  const prepared = prepareFactoryCampusModel(campus)
  const cladding = campus.getObjectByName('CLADDING__main-production-hall')
  const [batch] = cladding.children
  const walker = campus.getObjectByName('WALKER__main-production-hall__L01__01')

  assert.equal(batch.isInstancedMesh, true)
  assert.equal(batch.count, 3)
  assert.equal(batch.userData.buildingId, 'main-production-hall')
  assert.equal(prepared.instancingStats.sourceMeshes, 3)
  assert.equal(prepared.instancingStats.instancedMeshes, 1)
  assert.equal(prepared.instancingStats.drawCallsSaved, 2)
  assert.deepEqual(prepared.root.userData.staticInstancing, prepared.instancingStats)
  assert.equal(walker.children.some((object) => object.isInstancedMesh), false)
})

test('maps every required GLB building node to one interactive building id', () => {
  const campus = makeCampus()
  const prepared = prepareFactoryCampusModel(campus)

  assert.equal(prepared.root, campus)
  assert.deepEqual(
    prepared.interactiveObjects.map(({ userData }) => userData.buildingId),
    buildingRegistry.map(({ id }) => id),
  )
  assert.equal(new Set(prepared.interactiveObjects).size, buildingRegistry.length)
  assert.equal(prepared.animatedObjects?.length, 7)
  const vehicle = prepared.animatedObjects.find(({ object }) => object.name === 'VEHICLE__gate-shuttle__root')
  assert.equal(vehicle.kind, 'vehicle')
  assert.equal(vehicle.motionPath, 'gate-lane')
  assert.equal(vehicle.distance, 10)
  assert.equal(vehicle.speed, .09)
  const person = prepared.animatedObjects.find(({ object }) => object.name === 'WALKER__main-production-hall__L01__01')
  assert.equal(person.kind, 'person')
  assert.equal(person.distance, 4)
  assert.equal(person.speed, .12)
  assert.equal(person.phase, .25)
  assert.equal(person.baseX, -2)
  assert.equal(person.baseY, .1)
  assert.equal(person.leftLeg?.name.endsWith('__leg-left'), true)
  assert.equal(person.rightLeg?.name.endsWith('__leg-right'), true)
  const patrol = prepared.animatedObjects.find(({ object }) => object.name === 'PATROL__campus-01')
  assert.equal(patrol.kind, 'person')
  assert.equal(patrol.axis, 'z')
  assert.equal(patrol.baseZ, -4)
  const taskOperator = prepared.animatedObjects.find(({ object }) => object.name === 'TASK_OPERATOR__process-inspection-01')
  assert.equal(taskOperator.kind, 'person')
  assert.equal(taskOperator.motionPath, 'task-route')
  assert.equal(taskOperator.dwellFraction, .16)
  assert.equal(taskOperator.taskRole, 'process-inspection')
  assert.equal(taskOperator.taskStartAnchor, 'TASK_ANCHOR__process-inspection-01__start')
  assert.equal(taskOperator.taskEndAnchor, 'TASK_ANCHOR__process-inspection-01__end')
  const gate = prepared.animatedObjects.find(({ object }) => object.name === 'GATE__barrier-inbound')
  assert.equal(gate.kind, 'gate')
  assert.equal(gate.axis, 'z')
  assert.equal(gate.speed, .09)
  assert.equal(gate.closedAngle, 0)
  assert.equal(gate.openAngle, 1.22)
  const forklift = prepared.animatedObjects.find(({ object }) => object.name === 'LOGISTICS_OPS__front-warehouse__forklift')
  assert.equal(forklift.kind, 'vehicle')
  assert.equal(forklift.motionPath, 'yard-shuttle')
  assert.equal(forklift.axis, 'x')
  assert.equal(forklift.baseX, 2)
  assert.equal(forklift.baseZ, 3)
  const robot = prepared.animatedObjects.find(({ object }) => object.name === 'ROBOT_CELL__main-production-hall__L01__assembly-01')
  assert.equal(robot.kind, 'robot-arm')
  assert.equal(robot.speed, .18)
  assert.equal(robot.phase, .08)
  assert.equal(robot.joints.turntable.userData.robotJointRole, 'turntable')
  assert.equal(robot.joints.shoulder.userData.robotJointRole, 'shoulder')
  assert.equal(robot.joints.elbow.userData.robotJointRole, 'elbow')
  assert.equal(robot.joints.wrist.userData.robotJointRole, 'wrist')
  assert.equal(robot.joints.gripperLeft.userData.robotJointRole, 'gripper-left')
  assert.equal(robot.joints.gripperRight.userData.robotJointRole, 'gripper-right')
  assert.equal(robot.joints.payload.userData.robotJointRole, 'payload')
  const preparedMaterials = prepared.interactiveObjects.map((building) => building.children[0].material)
  assert.equal(new Set(preparedMaterials).size, buildingRegistry.length)
  for (const building of prepared.interactiveObjects) {
    assert.equal(building.userData.interactive, true)
    const record = buildingRegistry.find(({ id }) => id === building.userData.buildingId)
    assert.deepEqual(
      building.userData.floorRoots.map(({ userData }) => userData.floorId),
      record.floors.map(({ id }) => id),
    )
    assert.ok(building.userData.floorRoots.every(({ visible }) => visible === false))
    assert.equal(building.userData.exteriorMeshes.length, 1)
    building.traverse((object) => {
      if (!object.isMesh) return
      const materials = (Array.isArray(object.material) ? object.material : [object.material]).filter(Boolean)
      const isTransparent = materials.some((material) => material.transparent || material.opacity < .98)
      const isMicrodetail = object.userData.detailTier === 'micro'
      assert.equal(object.castShadow, !isTransparent && !isMicrodetail)
      assert.equal(object.receiveShadow, true)
    })
  }
})

test('rejects a GLB that omits a required building node', () => {
  const missing = buildingRegistry[0]
  const campus = makeCampus({ omitId: missing.id })

  assert.throws(
    () => prepareFactoryCampusModel(campus),
    new RegExp(`missing required building node: ${missing.nodeName}`),
  )
})

test('links route vehicles to immutable GLB route records', () => {
  const campus = makeCampus({ includeRoute: true })
  const prepared = prepareFactoryCampusModel(campus)
  const delivery = prepared.animatedObjects.find(({ object }) => object.name === 'VEHICLE__delivery-truck__root')

  assert.ok(prepared.routes instanceof Map, 'prepared campus is missing its route registry')
  assert.equal(prepared.routes.size, 1)
  assert.equal(delivery.kind, 'route-vehicle')
  assert.equal(delivery.motionPath, 'campus-route')
  assert.equal(delivery.route.id, 'warehouse-delivery')
  assert.deepEqual(delivery.route.points.map((point) => point.toArray()), [[0, 0, 0], [4, 0, 0], [4, 0, 3]])
  assert.equal(delivery.speed, .022)
  assert.equal(delivery.phase, .02)
})

test('rejects a route vehicle that references an unknown GLB route', () => {
  const campus = makeCampus({ includeRoute: true, linkedRoute: 'missing-route' })
  assert.throws(
    () => prepareFactoryCampusModel(campus),
    /missing campus route for vehicle: VEHICLE__delivery-truck__root -> missing-route/,
  )
})
