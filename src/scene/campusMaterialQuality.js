import * as THREE from 'three'

const COLOR_TEXTURE_KEYS = ['map', 'emissiveMap']
const DATA_TEXTURE_KEYS = ['normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'alphaMap']
const ALL_TEXTURE_KEYS = [...COLOR_TEXTURE_KEYS, ...DATA_TEXTURE_KEYS]

function materialEntries(object) {
  return (Array.isArray(object.material) ? object.material : [object.material]).filter(Boolean)
}

function isGlass(material) {
  return material.transmission > .01 || /glass|glazing/i.test(material.name)
}

function isMetal(material) {
  return material.metalness >= .35 || /pipe|gutter|metal|bronze|frame/i.test(material.name)
}

function isInterior(material) {
  return /interior|worktop|storage|equipment|workwear|hardhat|skin/i.test(material.name)
}

function isFacade(object, material) {
  return Boolean(object.userData.buildingId) || /industrial-coated|warehouse-sandwich|limestone|factory|warehouse|wall/i.test(material.name)
}

function configureTexture(texture, colorSpace, anisotropy) {
  if (!texture) return
  texture.colorSpace = colorSpace
  texture.anisotropy = anisotropy
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
}

export function applyCampusMaterialQuality({ root, renderer, anisotropy = 8 }) {
  const maximumAnisotropy = Math.max(1, Math.min(anisotropy, renderer.capabilities?.getMaxAnisotropy?.() ?? 1))
  const materials = new Set()
  root.traverse((object) => materialEntries(object).forEach((material) => materials.add([object, material])))
  let materialCount = 0
  for (const [object, material] of materials) {
    COLOR_TEXTURE_KEYS.forEach((key) => configureTexture(material[key], THREE.SRGBColorSpace, maximumAnisotropy))
    DATA_TEXTURE_KEYS.forEach((key) => configureTexture(material[key], THREE.NoColorSpace, maximumAnisotropy))
    if (isGlass(material)) material.envMapIntensity = 1.15
    else if (isInterior(material)) material.envMapIntensity = .36
    else if (isFacade(object, material)) material.envMapIntensity = .72
    else if (isMetal(material)) material.envMapIntensity = 1.0
    else material.envMapIntensity = .62
    if (material.aoMap) material.aoMapIntensity = isInterior(material) ? .88 : .78
    material.needsUpdate = true
    materialCount += 1
  }
  return { maximumAnisotropy, materialCount }
}

export function deriveCampusDistanceQuality(distance, reducedMotion = false) {
  if (reducedMotion || distance > 120) {
    return { tier: 'performance', microdetails: false, branchStructure: false, postProcessing: false, anisotropy: 2 }
  }
  if (distance > 88) {
    return { tier: 'balanced', microdetails: false, branchStructure: true, postProcessing: true, anisotropy: 4 }
  }
  return { tier: 'high', microdetails: true, branchStructure: true, postProcessing: true, anisotropy: 8 }
}

export function applyCampusDistanceQuality(root, policy) {
  root.traverse((object) => {
    if (object.userData.qualityBaseVisible === undefined) object.userData.qualityBaseVisible = object.visible
    if (object.userData.detailTier === 'micro') {
      object.visible = object.userData.qualityBaseVisible && policy.microdetails
    } else if (object.userData.vegetationDetail === 'branch-structure') {
      object.visible = object.userData.qualityBaseVisible && policy.branchStructure
    }
    materialEntries(object).forEach((material) => {
      ALL_TEXTURE_KEYS.forEach((key) => {
        const texture = material[key]
        if (!texture) return
        if (texture.userData.campusBaseAnisotropy === undefined) {
          texture.userData.campusBaseAnisotropy = texture.anisotropy || policy.anisotropy
        }
        texture.anisotropy = Math.min(texture.userData.campusBaseAnisotropy, policy.anisotropy)
      })
    })
  })
  root.userData.campusQualityTier = policy.tier
  return policy
}

export function createCampusQualityController({ root, camera, target, reducedMotion = false, onQualityChange }) {
  let currentTier = null
  let currentPolicy = null
  const update = () => {
    const policy = deriveCampusDistanceQuality(camera.position.distanceTo(target), reducedMotion)
    if (policy.tier !== currentTier) {
      currentTier = policy.tier
      currentPolicy = applyCampusDistanceQuality(root, policy)
      onQualityChange?.(currentPolicy)
    }
    return currentPolicy
  }
  return {
    get currentTier() { return currentTier },
    update,
    refresh() {
      currentTier = null
      return update()
    },
  }
}
