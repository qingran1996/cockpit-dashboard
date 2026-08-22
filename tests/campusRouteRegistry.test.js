import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'

function makeRoute({ routeId = 'warehouse-delivery', orders = [3, 1, 2] } = {}) {
  const root = new THREE.Group()
  const route = new THREE.Group()
  route.name = `ROUTE__${routeId}`
  route.position.set(10, 0, -4)
  route.userData = { routeId, loopMode: 'ping-pong', dwellFraction: .14 }
  const positions = new Map([
    [1, [0, 0, 0]],
    [2, [2, 0, 0]],
    [3, [4, 0, 2]],
  ])
  for (const order of orders) {
    const point = new THREE.Group()
    point.name = `WAYPOINT__${routeId}__${String(order).padStart(2, '0')}`
    point.position.set(...(positions.get(order) ?? [0, 0, 0]))
    point.userData = { routeId, waypointOrder: order }
    route.add(point)
  }
  root.add(route)
  return root
}

test('collects ordered route points in GLB world space', async () => {
  const module = await import('../src/scene/campusRouteRegistry.js').catch(() => ({}))
  assert.equal(typeof module.collectCampusRoutes, 'function', 'campus route collector is missing')

  const routes = module.collectCampusRoutes(makeRoute())
  const route = routes.get('warehouse-delivery')
  assert.equal(route.id, 'warehouse-delivery')
  assert.equal(route.loopMode, 'ping-pong')
  assert.equal(route.dwellFraction, .14)
  assert.deepEqual(route.points.map((point) => point.toArray()), [
    [10, 0, -4],
    [12, 0, -4],
    [14, 0, -2],
  ])
  assert.equal(Object.isFrozen(route), true)
  assert.equal(Object.isFrozen(route.points), true)
})

test('rejects malformed route waypoint contracts', async () => {
  const module = await import('../src/scene/campusRouteRegistry.js').catch(() => ({}))
  assert.equal(typeof module.collectCampusRoutes, 'function', 'campus route collector is missing')
  const { collectCampusRoutes } = module
  assert.throws(() => collectCampusRoutes(makeRoute({ orders: [1] })), /invalid campus route: warehouse-delivery/)
  assert.throws(() => collectCampusRoutes(makeRoute({ orders: [1, 1, 2] })), /duplicate waypoint order: warehouse-delivery/)

  const missingId = makeRoute()
  const route = missingId.getObjectByName('ROUTE__warehouse-delivery')
  route.name = 'ROUTE__'
  route.userData.routeId = ''
  assert.throws(() => collectCampusRoutes(missingId), /invalid campus route: ROUTE__/)
})
