const DEFAULTS = {
  day: {
    exposure: 1.34,
    skyColor: 0x7299a8,
    fogColor: 0x7299a8,
    fogDensity: .0055,
    ambientIntensity: 1.38,
    keyIntensity: 2.4,
    keyElevation: 55,
    keyAzimuth: 135,
    shadowFillIntensity: .72,
    shadowSoftness: 2,
    hemisphereSkyColor: 0xe5f3f2,
    hemisphereGroundColor: 0x7b8a75,
    keyColor: 0xffe0b8,
    fillColor: 0xc9e0e5,
    facadeAmbientColor: 0xf4f1e9,
    facadeAmbientIntensity: .24,
    environmentIntensity: .1,
    environmentRotation: .12,
    roadLightIntensity: 42,
    accentLightIntensity: 48,
    fixtureEmissiveIntensity: .08,
    entryFixtureIntensity: .18,
    taskFixtureIntensity: .12,
    wayfindingFixtureIntensity: .22,
    lobbyFixtureIntensity: .28,
    bloomStrength: .08,
  },
  evening: {
    exposure: 1.12,
    skyColor: 0x061222,
    fogColor: 0x061222,
    fogDensity: .0115,
    ambientIntensity: 2.32,
    keyIntensity: .74,
    keyElevation: 35,
    keyAzimuth: 155,
    shadowFillIntensity: .88,
    shadowSoftness: 3,
    hemisphereSkyColor: 0x44658b,
    hemisphereGroundColor: 0x07101a,
    keyColor: 0xffb070,
    fillColor: 0xffb070,
    facadeAmbientColor: 0x304663,
    facadeAmbientIntensity: .34,
    environmentIntensity: .38,
    environmentRotation: -.08,
    roadLightIntensity: 108,
    accentLightIntensity: 88,
    fixtureEmissiveIntensity: 3.8,
    entryFixtureIntensity: 4.8,
    taskFixtureIntensity: 4.2,
    wayfindingFixtureIntensity: 2.7,
    lobbyFixtureIntensity: 3.4,
    bloomStrength: .28,
  },
}

const range = (key, label, min, max, step, unit = '') => ({ key, label, type: 'range', min, max, step, unit })
const color = (key, label) => ({ key, label, type: 'color' })

export const CAMPUS_LIGHTING_PARAMETER_GROUPS = Object.freeze([
  {
    id: 'solar',
    label: '日光',
    parameters: [
      range('keyIntensity', '太阳主光', .1, 5, .01),
      range('keyElevation', '太阳高度', 5, 85, 1, '°'),
      range('keyAzimuth', '太阳方位', 0, 360, 1, '°'),
      color('keyColor', '太阳颜色'),
      range('shadowFillIntensity', '阴影补光', 0, 3, .01),
      color('fillColor', '补光颜色'),
      range('shadowSoftness', '阴影柔和', 0, 8, .25),
    ],
  },
  {
    id: 'environment',
    label: '环境',
    parameters: [
      range('exposure', '画面曝光', .85, 1.55, .01),
      range('ambientIntensity', '半球环境光', 0, 4, .01),
      color('hemisphereSkyColor', '天空补光色'),
      color('hemisphereGroundColor', '地面反射色'),
      range('facadeAmbientIntensity', '立面补光', 0, 1, .01),
      color('facadeAmbientColor', '立面补光色'),
      range('environmentIntensity', 'PBR 环境反射', 0, 1.5, .01),
      range('environmentRotation', '环境旋转', -3.14, 3.14, .01, 'rad'),
    ],
  },
  {
    id: 'atmosphere',
    label: '天空氛围',
    parameters: [
      color('skyColor', '天空颜色'),
      color('fogColor', '雾颜色'),
      range('fogDensity', '雾密度', 0, .03, .0005),
      range('bloomStrength', '灯光辉光', 0, .6, .01),
    ],
  },
  {
    id: 'fixtures',
    label: '厂区灯具',
    parameters: [
      range('roadLightIntensity', '道路灯', 0, 180, 1),
      range('accentLightIntensity', '环境强调灯', 0, 180, 1),
      range('fixtureEmissiveIntensity', '通用灯具', 0, 8, .01),
      range('entryFixtureIntensity', '入口灯', 0, 8, .01),
      range('taskFixtureIntensity', '作业灯', 0, 8, .01),
      range('wayfindingFixtureIntensity', '导视灯', 0, 8, .01),
      range('lobbyFixtureIntensity', '大厅灯', 0, 8, .01),
    ],
  },
])

const PARAMETER_BY_KEY = new Map(CAMPUS_LIGHTING_PARAMETER_GROUPS.flatMap((group) => group.parameters).map((parameter) => [parameter.key, parameter]))

function cloneMode(mode) {
  return { ...DEFAULTS[mode === 'evening' ? 'evening' : 'day'] }
}

function parseColor(value, fallback) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.min(0xffffff, Math.max(0, Math.round(value)))
  if (typeof value !== 'string' || !/^#[\da-f]{6}$/i.test(value)) return fallback
  return Number.parseInt(value.slice(1), 16)
}

function sanitize(parameter, value, fallback) {
  if (parameter.type === 'color') return parseColor(value, fallback)
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  const clamped = Math.min(parameter.max, Math.max(parameter.min, numeric))
  const precision = (String(parameter.step).split('.')[1] ?? '').length
  return Number((Math.round(clamped / parameter.step) * parameter.step).toFixed(precision))
}

export function createCampusLightingProfiles() {
  return { day: cloneMode('day'), evening: cloneMode('evening') }
}

export function resolveCampusLightingProfile(profiles, mode) {
  const safeMode = mode === 'evening' ? 'evening' : 'day'
  const defaults = cloneMode(safeMode)
  const source = profiles?.[safeMode] ?? profiles ?? {}
  for (const [key, parameter] of PARAMETER_BY_KEY) defaults[key] = sanitize(parameter, source[key], defaults[key])
  return defaults
}

export function updateCampusLightingProfile(profiles, mode, key, value) {
  const parameter = PARAMETER_BY_KEY.get(key)
  if (!parameter) return profiles
  const safeMode = mode === 'evening' ? 'evening' : 'day'
  const currentProfiles = profiles ?? createCampusLightingProfiles()
  const currentMode = resolveCampusLightingProfile(currentProfiles, safeMode)
  return {
    ...currentProfiles,
    [safeMode]: {
      ...currentMode,
      [key]: sanitize(parameter, value, currentMode[key]),
    },
  }
}

export function resetCampusLightingProfile(profiles, mode) {
  const safeMode = mode === 'evening' ? 'evening' : 'day'
  return {
    ...(profiles ?? createCampusLightingProfiles()),
    [safeMode]: cloneMode(safeMode),
  }
}
