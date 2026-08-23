export function collectCampusEnergyNetworks(root) {
  const networks = new Map([['water', []], ['power', []], ['steam', []]])
  root.traverse((object) => {
    const type = object.userData.energyType
    if (!networks.has(type)) return
    for (const field of ['networkSegmentId', 'sourceBuildingId', 'targetBuildingId', 'flowDirection', 'networkRouteId']) {
      if (typeof object.userData[field] !== 'string' || !object.userData[field].trim()) {
        throw new Error(`missing ${field}: ${object.name}`)
      }
    }
    if (!['source-to-target', 'target-to-source'].includes(object.userData.flowDirection)) {
      throw new Error(`invalid flowDirection: ${object.name}`)
    }
    if (!Number.isInteger(object.userData.networkRouteOrder) || object.userData.networkRouteOrder < 1) {
      throw new Error(`invalid networkRouteOrder: ${object.name}`)
    }
    networks.get(type).push(object)
  })
  return networks
}
