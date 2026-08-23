import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'

function makeNetworkSegment(name, energyType, networkSegmentId = `${energyType}-segment`) {
  const segment = new THREE.Mesh(new THREE.BoxGeometry(1, .1, .1), new THREE.MeshStandardMaterial())
  segment.name = name
  segment.userData = { energyType, networkSegmentId }
  return segment
}

test('collects only tagged energy-network segments under their physical type', async () => {
  const module = await import('../src/scene/campusEnergyNetworkRegistry.js').catch(() => ({}))
  assert.equal(typeof module.collectCampusEnergyNetworks, 'function', 'campus energy network collector is missing')

  const root = new THREE.Group()
  root.add(
    makeNetworkSegment('ENERGY_NETWORK__water__supply', 'water', 'water-supply-01'),
    makeNetworkSegment('ENERGY_NETWORK__water__meter', 'water', 'water-meter-01'),
    makeNetworkSegment('ENERGY_NETWORK__power__tray', 'power', 'power-tray-01'),
    makeNetworkSegment('ENERGY_NETWORK__steam__header', 'steam', 'steam-header-01'),
    new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()),
  )

  const networks = module.collectCampusEnergyNetworks(root)
  assert.deepEqual([...networks.keys()], ['water', 'power', 'steam'])
  assert.deepEqual(networks.get('water').map(({ name }) => name), ['ENERGY_NETWORK__water__supply', 'ENERGY_NETWORK__water__meter'])
  assert.deepEqual(networks.get('power').map(({ name }) => name), ['ENERGY_NETWORK__power__tray'])
  assert.deepEqual(networks.get('steam').map(({ name }) => name), ['ENERGY_NETWORK__steam__header'])
})

test('rejects a tagged segment without its network identifier', async () => {
  const module = await import('../src/scene/campusEnergyNetworkRegistry.js').catch(() => ({}))
  assert.equal(typeof module.collectCampusEnergyNetworks, 'function', 'campus energy network collector is missing')
  const root = new THREE.Group()
  root.add(makeNetworkSegment('ENERGY_NETWORK__power__missing-id', 'power', ''))

  assert.throws(() => module.collectCampusEnergyNetworks(root), /missing networkSegmentId: ENERGY_NETWORK__power__missing-id/)
})
