export function collectCampusEnergyNetworks(root) {
  const networks = new Map([['water', []], ['power', []], ['steam', []]])
  root.traverse((object) => {
    const type = object.userData.energyType
    if (!networks.has(type)) return
    if (!object.userData.networkSegmentId) throw new Error(`missing networkSegmentId: ${object.name}`)
    networks.get(type).push(object)
  })
  return networks
}
