import * as THREE from 'three'

const TEXTURE_KEYS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'alphaMap']

export const CAMPUS_MATERIAL_FAMILIES = Object.freeze([
  Object.freeze({ id: 'industrial-coated-metal', code: 'PCM-01', label: '涂层金属板', description: '冷白喷涂颗粒', pattern: 'coated', scopes: ['facade', 'roof'], roughness: .65, normalStrength: .12, tint: '#ffffff' }),
  Object.freeze({ id: 'warehouse-sandwich-panel', code: 'SWP-02', label: '仓库夹芯板', description: '暖白压型板纹', pattern: 'sandwich', scopes: ['facade'], roughness: .72, normalStrength: .13, tint: '#fffaf0' }),
  Object.freeze({ id: 'administration-limestone', code: 'LST-03', label: '浅色石灰石', description: '米白云纹石材', pattern: 'limestone', scopes: ['facade', 'plinth'], roughness: .78, normalStrength: .14, tint: '#fffaf1' }),
  Object.freeze({ id: 'architectural-concrete', code: 'CON-04', label: '建筑混凝土', description: '浅灰细孔肌理', pattern: 'concrete', scopes: ['facade', 'plinth'], roughness: .82, normalStrength: .16, tint: '#f4f6f5' }),
  Object.freeze({ id: 'galvanized-roof', code: 'GAL-05', label: '镀锌屋面板', description: '银白拉丝镀层', pattern: 'galvanized', scopes: ['roof'], roughness: .62, normalStrength: .15, tint: '#f5f8f8' }),
])

export const CAMPUS_MATERIAL_SCOPES = Object.freeze([
  Object.freeze({ id: 'facade', label: '墙面', code: 'WALL' }),
  Object.freeze({ id: 'roof', label: '屋面', code: 'ROOF' }),
  Object.freeze({ id: 'plinth', label: '勒脚', code: 'BASE' }),
])

const FAMILY_BY_ID = new Map(CAMPUS_MATERIAL_FAMILIES.map((family) => [family.id, family]))
const DEFAULT_SCOPE_FAMILY = Object.freeze({ facade: 'industrial-coated-metal', roof: 'galvanized-roof', plinth: 'architectural-concrete' })

function clamp(value, min, max, fallback) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : fallback
}

function sanitizeTint(value, fallback = '#ffffff') {
  return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : fallback
}

export function createMaterialFamilySettings(familyId) {
  const family = FAMILY_BY_ID.get(familyId) ?? CAMPUS_MATERIAL_FAMILIES[0]
  return {
    family: family.id,
    tint: family.tint,
    roughness: family.roughness,
    normalStrength: family.normalStrength,
    aoIntensity: .78,
    textureScale: 1,
    environmentIntensity: .72,
  }
}

export function createBuildingMaterialSettings(building = {}) {
  const facadeFamily = building.id === 'administration'
    ? 'administration-limestone'
    : String(building.id ?? '').includes('warehouse')
      ? 'warehouse-sandwich-panel'
      : 'industrial-coated-metal'
  return {
    facade: createMaterialFamilySettings(facadeFamily),
    roof: createMaterialFamilySettings('galvanized-roof'),
    plinth: createMaterialFamilySettings('architectural-concrete'),
  }
}

export function updateBuildingMaterialSettings(current, scope, patch = {}) {
  const existing = current?.[scope] ?? createMaterialFamilySettings(DEFAULT_SCOPE_FAMILY[scope] ?? DEFAULT_SCOPE_FAMILY.facade)
  const candidate = patch.family && patch.family !== existing.family
    ? { ...createMaterialFamilySettings(patch.family), ...patch }
    : { ...existing, ...patch }
  const sanitized = sanitizeMaterialSettings(scope, candidate)
  if (!sanitized) return current
  return { ...current, [scope]: sanitized }
}

export function sanitizeMaterialSettings(scope, settings = {}) {
  const safeScope = CAMPUS_MATERIAL_SCOPES.some((entry) => entry.id === scope) ? scope : 'facade'
  const family = FAMILY_BY_ID.get(settings.family ?? DEFAULT_SCOPE_FAMILY[safeScope])
  if (!family || !family.scopes.includes(safeScope)) return null
  return {
    family: family.id,
    tint: sanitizeTint(settings.tint),
    roughness: clamp(settings.roughness, .45, .9, family.roughness),
    normalStrength: clamp(settings.normalStrength, 0, .3, family.normalStrength),
    aoIntensity: clamp(settings.aoIntensity, .4, 1.2, .78),
    textureScale: clamp(settings.textureScale, .5, 3, 1),
    environmentIntensity: clamp(settings.environmentIntensity, 0, 1.5, .72),
  }
}

function materialEntries(object) {
  return (Array.isArray(object.material) ? object.material : [object.material]).filter(Boolean)
}

function scopeForMaterial(material) {
  const family = material?.userData?.architecturalPbrFamily
  if (family === 'galvanized-roof') return 'roof'
  if (family === 'architectural-concrete') return 'plinth'
  if (family === 'industrial-coated-metal' || family === 'warehouse-sandwich-panel' || family === 'administration-limestone') return 'facade'
  return null
}

function assignMaterial(object, index, material) {
  if (!Array.isArray(object.material)) {
    if (index === 0) object.material = material
    return
  }
  const next = [...object.material]
  next[index] = material
  object.material = next
}

function cloneTexture(texture, scale) {
  if (!texture) return null
  const clone = texture.clone()
  clone.wrapS = THREE.RepeatWrapping
  clone.wrapT = THREE.RepeatWrapping
  clone.repeat.set(scale, scale)
  clone.needsUpdate = true
  return clone
}

function createEditedMaterial(template, settings) {
  const material = template.clone()
  material.name = `${template.name}__lab__${settings.family}`
  material.userData = { ...template.userData, campusMaterialLabClone: true }
  TEXTURE_KEYS.forEach((key) => {
    if (template[key]) material[key] = cloneTexture(template[key], settings.textureScale)
  })
  material.color?.set(settings.tint)
  material.roughness = settings.roughness
  if (material.normalScale) material.normalScale.set(settings.normalStrength, settings.normalStrength)
  material.aoMapIntensity = settings.aoIntensity
  material.envMapIntensity = settings.environmentIntensity
  material.needsUpdate = true
  return material
}

function disposeEditedMaterial(material) {
  const textures = new Set(TEXTURE_KEYS.map((key) => material?.[key]).filter(Boolean))
  textures.forEach((texture) => texture.dispose())
  material?.dispose()
}

export function createCampusMaterialController(root) {
  const templates = new Map()
  const assignments = new Map()
  const applied = new Map()

  root.traverse((object) => {
    if (!object.material) return
    materialEntries(object).forEach((material, index) => {
      const family = material.userData?.architecturalPbrFamily
      if (family && !templates.has(family)) templates.set(family, material)
      const buildingId = object.userData.buildingId
      const scope = scopeForMaterial(material)
      if (!buildingId || !scope) return
      const key = `${buildingId}:${scope}`
      if (!assignments.has(key)) assignments.set(key, [])
      assignments.get(key).push({ object, index, originalMaterial: material })
    })
  })

  const clearApplied = (key, restoreOriginal) => {
    const records = assignments.get(key) ?? []
    const edited = applied.get(key) ?? []
    if (restoreOriginal) records.forEach((record) => assignMaterial(record.object, record.index, record.originalMaterial))
    edited.forEach(disposeEditedMaterial)
    applied.delete(key)
    return records.length > 0
  }

  return {
    apply(buildingId, scope, settings) {
      const safeSettings = sanitizeMaterialSettings(scope, settings)
      const template = safeSettings ? templates.get(safeSettings.family) : null
      const key = `${buildingId}:${scope}`
      const records = assignments.get(key) ?? []
      if (!safeSettings || !template || records.length === 0) return false
      clearApplied(key, true)
      const edited = records.map((record) => {
        const material = createEditedMaterial(template, safeSettings)
        assignMaterial(record.object, record.index, material)
        return material
      })
      applied.set(key, edited)
      return true
    },
    reset(buildingId, scope) {
      const key = `${buildingId}:${scope}`
      if (!assignments.has(key)) return false
      clearApplied(key, true)
      return true
    },
    dispose() {
      [...applied.keys()].forEach((key) => clearApplied(key, true))
    },
  }
}
