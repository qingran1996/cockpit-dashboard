import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'

test('derives a restrained evening state with stronger operational lights', async () => {
  const module = await import('../src/scene/campusLightingMode.js').catch(() => ({}))
  assert.equal(typeof module.deriveCampusLightingState, 'function', 'campus lighting state helper is missing')

  const day = module.deriveCampusLightingState('day')
  const evening = module.deriveCampusLightingState('evening')
  assert.equal(evening.exposure, .82)
  assert.equal(evening.skyColor, 0x061222)
  assert.ok(evening.roadLightIntensity > day.roadLightIntensity)
  assert.ok(evening.keyIntensity < day.keyIntensity)
})

test('applies lighting mode to the renderer, fog, rig, and emissive site fixtures', async () => {
  const module = await import('../src/scene/campusLightingMode.js').catch(() => ({}))
  assert.equal(typeof module.applyCampusLightingMode, 'function', 'campus lighting applicator is missing')

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x000000, .01)
  const hemisphere = new THREE.HemisphereLight()
  hemisphere.name = 'CampusHemisphere'
  const key = new THREE.DirectionalLight()
  key.name = 'CampusKey'
  const road = new THREE.PointLight()
  road.name = 'CampusRoadGlow'
  const fixture = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial())
  fixture.name = 'LIGHT__boulevard-head-01'
  scene.add(hemisphere, key, road, fixture)
  const renderer = { toneMappingExposure: 1 }

  module.applyCampusLightingMode({ scene, renderer }, 'evening')
  assert.equal(renderer.toneMappingExposure, .82)
  assert.equal(scene.fog.color.getHex(), 0x061222)
  assert.ok(road.intensity > 1)
  assert.ok(fixture.material.emissiveIntensity > 1)
})
