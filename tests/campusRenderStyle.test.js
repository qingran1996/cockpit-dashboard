import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'

test('keeps the cockpit policy available while defaulting unsupported render styles to Unity', async () => {
  const module = await import('../src/scene/campusRenderStyle.js').catch(() => ({}))
  assert.equal(typeof module.applyCampusRenderStyleToLightingState, 'function', 'campus render-style policy is missing')

  const state = { exposure: 1.32, skyColor: 0x88adba, fogDensity: .006, environmentIntensity: .1 }
  assert.deepEqual(module.applyCampusRenderStyleToLightingState(state, 'cockpit', 'day'), state)
  assert.equal(module.normalizeCampusRenderStyle(undefined), 'cockpit', 'legacy callers without a style keep the cockpit policy')
  assert.equal(module.normalizeCampusRenderStyle('unsupported'), 'unity')
  assert.equal(module.DEFAULT_CAMPUS_RENDER_STYLE, 'unity')
})

test('resolves a Unity-inspired architectural daylight policy without mutating its input', async () => {
  const module = await import('../src/scene/campusRenderStyle.js').catch(() => ({}))
  const state = {
    exposure: 1.32,
    skyColor: 0x88adba,
    horizonColor: 0xb8d2d4,
    lowColor: 0x6f8778,
    fogColor: 0x789099,
    fogDensity: .006,
    ambientIntensity: 1.4,
    hemisphereSkyColor: 0xeaf4f2,
    hemisphereGroundColor: 0x879080,
    keyColor: 0xffdfb8,
    keyElevation: 34,
    keyAzimuth: 142,
    shadowFillIntensity: .52,
    fillColor: 0xc7dce2,
    facadeAmbientColor: 0xf4f1e9,
    facadeAmbientIntensity: .28,
    environmentIntensity: .1,
    bloomStrength: .08,
    shadowSoftness: 3,
  }
  const unity = module.applyCampusRenderStyleToLightingState(state, 'unity', 'day')

  assert.notEqual(unity, state)
  assert.equal(state.skyColor, 0x88adba, 'the user lighting profile must remain reusable when switching back')
  assert.equal(unity.skyColor, 0x759eb8)
  assert.equal(unity.fogColor, 0x87a3a8)
  assert.equal(unity.keyColor, 0xfff4e0)
  assert.equal(unity.hemisphereSkyColor, 0xa3bdd1)
  assert.equal(unity.hemisphereGroundColor, 0x2b3530)
  assert.equal(unity.environmentIntensity, .35)
  assert.ok(unity.exposure > state.exposure)
  assert.ok(unity.fogDensity < state.fogDensity)
  assert.ok(unity.ambientIntensity > state.ambientIntensity)
  assert.ok(unity.bloomStrength < state.bloomStrength)
})

test('switches the live renderer between ACES cockpit and Neutral Unity tone mapping', async () => {
  const module = await import('../src/scene/campusRenderStyle.js').catch(() => ({}))
  assert.equal(typeof module.resolveCampusRendererPolicy, 'function', 'renderer policy resolver is missing')

  assert.deepEqual(module.resolveCampusRendererPolicy('cockpit'), { toneMapping: THREE.ACESFilmicToneMapping })
  assert.deepEqual(module.resolveCampusRendererPolicy('unity'), { toneMapping: THREE.NeutralToneMapping })
})
