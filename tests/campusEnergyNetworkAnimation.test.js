import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'

function makeNetworkSegment(name, energyType, flowDirection, networkRouteId = `${energyType}-main`, networkRouteOrder = 1) {
  const segment = new THREE.Mesh(
    new THREE.BoxGeometry(1, .1, .1),
    new THREE.MeshStandardMaterial({ color: 0x7b858a, roughness: .68, metalness: .32, emissive: 0x000000, emissiveIntensity: .04 }),
  )
  segment.name = name
  segment.userData = { energyType, networkSegmentId: name, flowDirection, networkRouteId, networkRouteOrder }
  return segment
}

function makeNetworks() {
  const water = makeNetworkSegment('water-main', 'water', 'source-to-target')
  const power = makeNetworkSegment('power-tray', 'power', 'source-to-target')
  const steam = makeNetworkSegment('steam-header', 'steam', 'target-to-source')
  return { networks: new Map([['water', [water]], ['power', [power]], ['steam', [steam]]]), water, power, steam }
}

test('highlights exactly one declared energy network and restores original material references', async () => {
  const module = await import('../src/scene/campusEnergyNetworkAnimation.js').catch(() => ({}))
  assert.equal(typeof module.updateCampusEnergyNetworks, 'function', 'campus energy network animator is missing')
  const { networks, water, power, steam } = makeNetworks()
  const original = { water: water.material, power: power.material, steam: steam.material }

  module.updateCampusEnergyNetworks(networks, { activeEnergy: 'water', reducedMotion: true }, 4)
  assert.notEqual(water.material, original.water, 'active water segment should receive an isolated highlight material')
  assert.equal(power.material, original.power, 'unselected power segment must keep its physical material')
  assert.equal(steam.material, original.steam, 'unselected steam segment must keep its physical material')
  assert.equal(water.material.userData.campusEnergyHighlight, 'water')

  module.updateCampusEnergyNetworks(networks, { activeEnergy: 'steam', reducedMotion: true }, 4)
  assert.equal(water.material, original.water, 'switching active detail must restore the prior network exactly')
  assert.notEqual(steam.material, original.steam)

  module.updateCampusEnergyNetworks(networks, { activeEnergy: null, reducedMotion: false }, 5)
  assert.equal(water.material, original.water)
  assert.equal(power.material, original.power)
  assert.equal(steam.material, original.steam)
})

test('uses static reduced-motion highlights and low-frequency directional flow pulses otherwise', async () => {
  const module = await import('../src/scene/campusEnergyNetworkAnimation.js').catch(() => ({}))
  assert.equal(typeof module.updateCampusEnergyNetworks, 'function', 'campus energy network animator is missing')
  const { networks, water, steam } = makeNetworks()

  module.updateCampusEnergyNetworks(networks, { activeEnergy: 'water', reducedMotion: true }, 2)
  const staticIntensity = water.material.emissiveIntensity
  module.updateCampusEnergyNetworks(networks, { activeEnergy: 'water', reducedMotion: true }, 9)
  assert.equal(water.material.emissiveIntensity, staticIntensity)

  module.updateCampusEnergyNetworks(networks, { activeEnergy: 'water', reducedMotion: false }, 2)
  const forwardPulse = water.material.emissiveIntensity
  module.updateCampusEnergyNetworks(networks, { activeEnergy: 'water', reducedMotion: false }, 2.5)
  assert.notEqual(water.material.emissiveIntensity, forwardPulse)

  module.updateCampusEnergyNetworks(networks, { activeEnergy: 'steam', reducedMotion: false }, 2)
  const returnPulse = steam.material.emissiveIntensity
  module.updateCampusEnergyNetworks(networks, { activeEnergy: 'steam', reducedMotion: false }, 2.5)
  assert.notEqual(steam.material.emissiveIntensity, returnPulse)
})

test('moves the brightest wave across explicit route order in opposite directions', async () => {
  const module = await import('../src/scene/campusEnergyNetworkAnimation.js').catch(() => ({}))
  assert.equal(typeof module.updateCampusEnergyNetworks, 'function', 'campus energy network animator is missing')
  const makeRoute = (energyType, flowDirection) => [3, 1, 2].map((order) => makeNetworkSegment(
    `${energyType}-${order}`,
    energyType,
    flowDirection,
    `${energyType}-trunk`,
    order,
  ))
  const water = makeRoute('water', 'source-to-target')
  const steam = makeRoute('steam', 'target-to-source')
  const networks = new Map([['water', water], ['power', []], ['steam', steam]])
  const intensityByOrder = (segments) => Object.fromEntries(segments.map((segment) => [segment.userData.networkRouteOrder, segment.material.emissiveIntensity]))
  const strongestOrder = (intensities) => Number(Object.entries(intensities).sort((left, right) => right[1] - left[1])[0][0])

  module.updateCampusEnergyNetworks(networks, { activeEnergy: 'water', reducedMotion: false }, 0)
  assert.equal(strongestOrder(intensityByOrder(water)), 1, 'source flow must begin at the route source regardless of traversal order')
  module.updateCampusEnergyNetworks(networks, { activeEnergy: 'steam', reducedMotion: false }, 0)
  assert.equal(strongestOrder(intensityByOrder(steam)), 3, 'return flow must begin at the route target')

  const twoRouteSteps = 2 / (3 * .18)
  module.updateCampusEnergyNetworks(networks, { activeEnergy: 'water', reducedMotion: false }, twoRouteSteps)
  assert.equal(strongestOrder(intensityByOrder(water)), 3, 'source flow must progress toward the route target')
  module.updateCampusEnergyNetworks(networks, { activeEnergy: 'steam', reducedMotion: false }, twoRouteSteps)
  assert.equal(strongestOrder(intensityByOrder(steam)), 1, 'return flow must progress toward the route source')
})
