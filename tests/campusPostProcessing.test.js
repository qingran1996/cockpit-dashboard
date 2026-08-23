import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'

test('derives bounded contact bloom and anti-aliasing without blooming pale walls', async () => {
  const module = await import('../src/scene/campusPostProcessing.js').catch(() => ({}))
  assert.equal(typeof module.deriveCampusPostProcessingPolicy, 'function', 'post-processing policy is missing')

  const day = module.deriveCampusPostProcessingPolicy({ mode: 'day', reducedMotion: false, pixelRatio: 1.5, webgl2: true })
  const evening = module.deriveCampusPostProcessingPolicy({ mode: 'evening', reducedMotion: false, pixelRatio: 1.5, webgl2: true })
  assert.equal(day.enabled, true)
  assert.equal(day.contact.enabled, true)
  assert.ok(day.contact.radius > 0 && day.contact.radius <= 4)
  assert.ok(day.contact.intensity >= .18 && day.contact.intensity <= .45)
  assert.ok(day.contact.intensity >= .3, 'daylight needs enough contact shadow to anchor pale buildings')
  assert.equal(day.antialias, 'smaa')
  assert.ok(day.bloom.threshold >= 2.35, 'pale walls and road paint must stay below bloom threshold')
  assert.ok(day.bloom.strength <= .22)
  assert.ok(evening.bloom.strength > day.bloom.strength && evening.bloom.strength <= .42)
  assert.equal(evening.bloom.threshold, day.bloom.threshold)
  assert.equal(day.renderScale, 1, 'post-processing must not soften roof lines or fence wire through downsampling')
})

test('accepts a bounded operator bloom strength without changing the pale-wall threshold', async () => {
  const module = await import('../src/scene/campusPostProcessing.js').catch(() => ({}))
  const custom = module.deriveCampusPostProcessingPolicy({ mode: 'evening', bloomStrength: .5 })
  const clamped = module.deriveCampusPostProcessingPolicy({ mode: 'evening', bloomStrength: 9 })
  assert.equal(custom.bloom.strength, .5)
  assert.equal(custom.bloom.threshold, 2.35)
  assert.equal(clamped.bloom.strength, .6)
})

test('uses FXAA supersampling on WebGL1 while reduced motion keeps the deterministic native fallback', async () => {
  const module = await import('../src/scene/campusPostProcessing.js').catch(() => ({}))
  const reduced = module.deriveCampusPostProcessingPolicy({ mode: 'evening', reducedMotion: true, pixelRatio: 2, webgl2: true })
  const legacy = module.deriveCampusPostProcessingPolicy({ mode: 'day', reducedMotion: false, pixelRatio: 1, webgl2: false })
  const focusedLegacy = module.deriveCampusPostProcessingPolicy({ mode: 'day', reducedMotion: false, pixelRatio: 1, webgl2: false, focused: true })
  assert.deepEqual(reduced, {
    enabled: false,
    contact: { enabled: false, radius: 0, intensity: 0 },
    bloom: { enabled: false, threshold: 1.08, strength: 0, radius: 0 },
    antialias: 'native',
    renderScale: 1,
  })
  assert.equal(legacy.enabled, true)
  assert.equal(legacy.contact.enabled, false)
  assert.equal(legacy.bloom.enabled, false)
  assert.equal(legacy.antialias, 'fxaa')
  assert.equal(legacy.renderScale, 1.2)
  assert.equal(focusedLegacy.antialias, 'fxaa')
  assert.equal(focusedLegacy.renderScale, 1.35)
})

test('raises the render scale only where low-density focus views benefit from supersampling', async () => {
  const module = await import('../src/scene/campusPostProcessing.js').catch(() => ({}))
  const dashboard = module.deriveCampusPostProcessingPolicy({ webgl2: true, pixelRatio: 1, focused: false })
  const focused = module.deriveCampusPostProcessingPolicy({ webgl2: true, pixelRatio: 1, focused: true })
  const retinaFocused = module.deriveCampusPostProcessingPolicy({ webgl2: true, pixelRatio: 2, focused: true })

  assert.equal(dashboard.renderScale, 1)
  assert.equal(focused.renderScale, 1.25)
  assert.equal(retinaFocused.renderScale, 1)
})

test('configures a color-managed renderer with bounded exposure and soft shadows', async () => {
  const module = await import('../src/scene/campusPostProcessing.js').catch(() => ({}))
  assert.equal(typeof module.configureCampusRenderer, 'function', 'renderer quality configurator is missing')
  const renderer = { shadowMap: { enabled: false, type: null }, toneMappingExposure: 0 }

  const result = module.configureCampusRenderer(renderer, { exposure: 4 })

  assert.equal(renderer.outputColorSpace, THREE.SRGBColorSpace)
  assert.equal(renderer.toneMapping, THREE.ACESFilmicToneMapping)
  assert.equal(renderer.shadowMap.enabled, true)
  assert.equal(renderer.shadowMap.type, THREE.PCFSoftShadowMap)
  assert.equal(renderer.toneMappingExposure, 1.55)
  assert.equal(result.exposure, 1.55)
})

test('keeps post-processing disabled when lighting mode changes in the performance tier', async () => {
  const module = await import('../src/scene/campusPostProcessing.js').catch(() => ({}))
  assert.equal(typeof module.applyCampusQualityToPostProcessingPolicy, 'function', 'post-processing quality merger is missing')
  const evening = module.deriveCampusPostProcessingPolicy({ mode: 'evening', webgl2: true })
  const merged = module.applyCampusQualityToPostProcessingPolicy(evening, { postProcessing: false })
  assert.equal(merged.enabled, false)
  assert.equal(merged.contact.enabled, false)
  assert.equal(merged.bloom.enabled, false)
  assert.equal(merged.antialias, 'native')
})
