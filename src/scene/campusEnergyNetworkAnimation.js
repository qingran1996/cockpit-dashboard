const ENERGY_HIGHLIGHT_COLORS = {
  water: 0x3b9ec4,
  power: 0xd7a63b,
  steam: 0xbe7758,
}
const FLOW_CYCLES_PER_SECOND = .18

const originalMaterials = new WeakMap()

function materialEntries(material) {
  return Array.isArray(material) ? material : [material]
}

function cloneMaterialSet(material) {
  const clones = materialEntries(material).map((entry) => entry.clone())
  return Array.isArray(material) ? clones : clones[0]
}

function disposeMaterialSet(material) {
  materialEntries(material).forEach((entry) => entry?.dispose())
}

function restoreOriginalMaterial(segment) {
  const original = originalMaterials.get(segment)
  if (!original || segment.material === original) return
  const highlighted = segment.material
  segment.material = original
  disposeMaterialSet(highlighted)
}

function applyHighlight(segment, energyType, pulse) {
  const original = originalMaterials.get(segment) ?? segment.material
  originalMaterials.set(segment, original)
  if (segment.material === original) segment.material = cloneMaterialSet(original)
  materialEntries(segment.material).forEach((material) => {
    if (!material) return
    material.userData.campusEnergyHighlight = energyType
    if (material.emissive?.setHex) material.emissive.setHex(ENERGY_HIGHLIGHT_COLORS[energyType])
    if ('emissiveIntensity' in material) material.emissiveIntensity = .24 + pulse * .18
  })
}

function activeEnergyKey(state) {
  const value = state?.activeEnergy
  return Object.hasOwn(ENERGY_HIGHLIGHT_COLORS, value) ? value : null
}

function mod1(value) {
  return ((value % 1) + 1) % 1
}

function routePulse(segment, route, seconds, reducedMotion) {
  if (reducedMotion) return .5
  const orders = route.map(({ userData }) => userData.networkRouteOrder)
  const firstOrder = Math.min(...orders)
  const span = Math.max(...orders) - firstOrder + 1
  const progress = (segment.userData.networkRouteOrder - firstOrder) / span
  const direction = segment.userData.flowDirection === 'target-to-source' ? -1 : 1
  const start = direction > 0 ? 0 : 1 - 1 / span
  const center = mod1(start + seconds * FLOW_CYCLES_PER_SECOND * direction)
  const distance = Math.min(Math.abs(progress - center), 1 - Math.abs(progress - center))
  return Math.max(0, 1 - distance * 2)
}

export function updateCampusEnergyNetworks(networks, state, seconds = 0) {
  const activeEnergy = activeEnergyKey(state)
  const reducedMotion = Boolean(state?.reducedMotion)

  for (const [energyType, segments] of networks) {
    const routes = new Map()
    segments.forEach((segment) => {
      const routeId = segment.userData.networkRouteId
      if (!routes.has(routeId)) routes.set(routeId, [])
      routes.get(routeId).push(segment)
    })
    routes.forEach((route) => route.sort((left, right) => left.userData.networkRouteOrder - right.userData.networkRouteOrder))
    segments.forEach((segment) => {
      if (energyType !== activeEnergy) {
        restoreOriginalMaterial(segment)
        return
      }
      const pulse = routePulse(segment, routes.get(segment.userData.networkRouteId), seconds, reducedMotion)
      applyHighlight(segment, energyType, pulse)
    })
  }
}
