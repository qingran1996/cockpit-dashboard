import * as THREE from 'three'

export function collectCampusRoutes(root) {
  root.updateMatrixWorld(true)
  const routes = new Map()
  root.traverse((object) => {
    if (!object.name.startsWith('ROUTE__')) return
    const id = String(object.userData.routeId || object.name.slice('ROUTE__'.length))
    const waypoints = object.children
      .filter((child) => child.name.startsWith(`WAYPOINT__${id}__`))
      .map((child) => ({
        order: Number(child.userData.waypointOrder),
        point: child.getWorldPosition(new THREE.Vector3()),
      }))
      .sort((left, right) => left.order - right.order)
    if (!id || waypoints.length < 2) throw new Error(`invalid campus route: ${id || object.name}`)
    if (new Set(waypoints.map(({ order }) => order)).size !== waypoints.length) {
      throw new Error(`duplicate waypoint order: ${id}`)
    }
    routes.set(id, Object.freeze({
      id,
      loopMode: object.userData.loopMode === 'loop' ? 'loop' : 'ping-pong',
      dwellFraction: Math.max(0, Math.min(.3, Number(object.userData.dwellFraction) || 0)),
      points: Object.freeze(waypoints.map(({ point }) => point.clone())),
    }))
  })
  return routes
}
