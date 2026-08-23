const ENERGY_HIGHLIGHT_COLORS = {
  water: 0x3b9ec4,
  power: 0xd7a63b,
  steam: 0xbe7758,
}

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

export function updateCampusEnergyNetworks(networks, state, seconds = 0) {
  const activeEnergy = activeEnergyKey(state)
  const reducedMotion = Boolean(state?.reducedMotion)

  for (const [energyType, segments] of networks) {
    segments.forEach((segment, index) => {
      if (energyType !== activeEnergy) {
        restoreOriginalMaterial(segment)
        return
      }
      const direction = segment.userData.flowDirection === 'target-to-source' ? -1 : 1
      const pulse = reducedMotion ? .5 : (.5 + .5 * Math.sin(seconds * 1.2 * direction + index * .9))
      applyHighlight(segment, energyType, pulse)
    })
  }
}
