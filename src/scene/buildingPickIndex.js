import * as THREE from 'three'

export function createBuildingPickIndex(buildings) {
  const hitPoint = new THREE.Vector3()
  let entries = []

  const refresh = () => {
    entries = buildings.map((building) => {
      building.updateWorldMatrix(true, true)
      return {
        building,
        bounds: new THREE.Box3().setFromObject(building),
      }
    }).filter(({ bounds }) => !bounds.isEmpty())
  }

  const pick = (raycaster) => {
    let nearestBuilding = null
    let nearestDistance = Infinity
    for (const { building, bounds } of entries) {
      const intersection = raycaster.ray.intersectBox(bounds, hitPoint)
      if (!intersection) continue
      const distance = raycaster.ray.origin.distanceToSquared(intersection)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestBuilding = building
      }
    }
    return nearestBuilding
  }

  refresh()
  return { refresh, pick }
}
