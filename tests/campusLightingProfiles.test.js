import assert from 'node:assert/strict'
import test from 'node:test'

test('creates independent day and evening commissioning profiles', async () => {
  const module = await import('../src/scene/campusLightingProfiles.js').catch(() => ({}))
  assert.equal(typeof module.createCampusLightingProfiles, 'function', 'lighting profile factory is missing')

  const profiles = module.createCampusLightingProfiles()
  assert.equal(profiles.day.exposure, 1.32)
  assert.equal(profiles.evening.exposure, 1.18)
  assert.equal(profiles.day.keyIntensity, 2.35)
  assert.equal(profiles.day.environmentIntensity, .1)
  assert.ok(profiles.day.ambientIntensity >= 1.35, 'day ground needs enough broad fill to separate grass from asphalt')
  assert.ok(profiles.day.facadeAmbientIntensity <= .3, 'lifting the ground must not flatten pale facades')
  assert.equal(profiles.evening.keyIntensity, .88)
  assert.equal(profiles.evening.skyColor, 0x071926)
  assert.equal(profiles.evening.fogColor, 0x163747)
  assert.ok(profiles.evening.fogDensity <= .009, 'evening atmosphere should reveal the rear campus instead of swallowing it')
  assert.ok(profiles.evening.facadeAmbientIntensity >= .42, 'pale walls need a cool architectural fill at blue hour')
  assert.ok(profiles.evening.environmentIntensity <= .3, 'evening reflections must not turn pale wall panels into plastic')
  assert.notEqual(profiles.day, profiles.evening)
})

test('preserves every approved default when a fresh profile is resolved for the UI', async () => {
  const module = await import('../src/scene/campusLightingProfiles.js')
  const resolved = module.resolveCampusLightingProfile(module.createCampusLightingProfiles(), 'evening')
  assert.equal(resolved.keyIntensity, .88)
  assert.equal(resolved.shadowFillIntensity, 1.04)
  assert.equal(resolved.ambientIntensity, 2.18)
  assert.equal(resolved.entryFixtureIntensity, 4.8)
  assert.equal(resolved.taskFixtureIntensity, 4.2)
  assert.equal(resolved.wayfindingFixtureIntensity, 2.7)
  assert.equal(resolved.lobbyFixtureIntensity, 3.4)
})

test('sanitizes numeric and color changes without mutating the other mode', async () => {
  const module = await import('../src/scene/campusLightingProfiles.js').catch(() => ({}))
  assert.equal(typeof module.updateCampusLightingProfile, 'function', 'lighting profile updater is missing')

  const initial = module.createCampusLightingProfiles()
  const bright = module.updateCampusLightingProfile(initial, 'evening', 'keyIntensity', 99)
  assert.equal(bright.evening.keyIntensity, 5)
  assert.equal(bright.day.keyIntensity, 2.35)
  assert.equal(initial.evening.keyIntensity, .88)

  const recolored = module.updateCampusLightingProfile(bright, 'evening', 'skyColor', '#123456')
  assert.equal(recolored.evening.skyColor, 0x123456)
  const ignored = module.updateCampusLightingProfile(recolored, 'evening', 'unknownParameter', 12)
  assert.deepEqual(ignored, recolored)
})

test('resets only the requested mode and exposes four complete parameter groups', async () => {
  const module = await import('../src/scene/campusLightingProfiles.js').catch(() => ({}))
  const changed = module.updateCampusLightingProfile(module.createCampusLightingProfiles(), 'day', 'fogDensity', .02)
  const alsoChanged = module.updateCampusLightingProfile(changed, 'evening', 'roadLightIntensity', 160)
  const resetDay = module.resetCampusLightingProfile(alsoChanged, 'day')

  assert.equal(resetDay.day.fogDensity, .0048)
  assert.equal(resetDay.day.environmentIntensity, .1)
  assert.equal(resetDay.evening.roadLightIntensity, 160)
  assert.deepEqual(module.CAMPUS_LIGHTING_PARAMETER_GROUPS.map((group) => group.id), ['solar', 'environment', 'atmosphere', 'fixtures'])
  assert.ok(module.CAMPUS_LIGHTING_PARAMETER_GROUPS.every((group) => group.parameters.length >= 4))
})
