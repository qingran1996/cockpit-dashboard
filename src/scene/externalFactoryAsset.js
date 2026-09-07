import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

export const EXTERNAL_FACTORY_MODEL_URL = '/models/0827.fbx'
export const EXTERNAL_FACTORY_MAX_DIMENSION = 52

const INDUSTRIAL_MATERIAL_SPECS = {
  'ART__paint-teal-aged': { color: 0x0f5050, metalness: 0.08, roughness: 0.43, repeat: 5, seed: 11 },
  'ART__paint-cool-gray': { color: 0x7d858a, metalness: 0.06, roughness: 0.49, repeat: 6, seed: 23 },
  'ART__stainless-brushed': { color: 0x81898c, metalness: 0.88, roughness: 0.24, repeat: 18, seed: 37, brushed: true },
  'ART__galvanized-steel': { color: 0x8a9193, metalness: 0.76, roughness: 0.38, repeat: 9, seed: 41 },
  'ART__insulation-aluminum': { color: 0xb8bcba, metalness: 0.72, roughness: 0.33, repeat: 8, seed: 53 },
  'ART__paint-safety-yellow': { color: 0xf29a08, metalness: 0.04, roughness: 0.38, repeat: 5, seed: 67 },
  'ART__steel-weathered-light': { color: 0x4a382e, metalness: 0.62, roughness: 0.58, repeat: 4, seed: 79 },
  'ART__concrete-oil-stained': { color: 0x6b6861, metalness: 0, roughness: 0.88, repeat: 3, seed: 83 },
}

const EXTERNAL_FBX_PBR_SPECS = {
  V2_BeadBlasted_Steel: { color: 0x747d80, metalness: 0.72, roughness: 0.58, repeat: 9, seed: 101 },
  V2_Polished_Process_Pipe: { color: 0xa6adb0, metalness: 0.9, roughness: 0.24, repeat: 18, seed: 103, brushed: true },
  V2_Satin_Process_Equipment: { color: 0x858e91, metalness: 0.78, roughness: 0.4, repeat: 12, seed: 107, brushed: true },
  V2_Safety_Gold: { color: 0xd99108, metalness: 0.08, roughness: 0.5, repeat: 6, seed: 109 },
  DT_Safety_Yellow: { color: 0xeda30b, metalness: 0.05, roughness: 0.54, repeat: 6, seed: 113 },
  V2_Deep_Teal_Powdercoat: { color: 0x0d5555, metalness: 0.1, roughness: 0.52, repeat: 7, seed: 127 },
  V2_Warm_Grey_Enclosure: { color: 0x89867f, metalness: 0.08, roughness: 0.6, repeat: 7, seed: 131 },
  V2_Dark_AntiSlip_Deck: { color: 0x343a3d, metalness: 0.28, roughness: 0.8, repeat: 5, seed: 137 },
  DT_Epoxy_Floor: { color: 0x666762, metalness: 0, roughness: 0.84, repeat: 4, seed: 139 },
  V2_Emergency_Red: { color: 0x98150f, metalness: 0.04, roughness: 0.48, repeat: 6, seed: 149 },
}

const roughnessTextures = new Map()

function microNoise(x, y, seed) {
  const value = Math.sin((x + seed * 3.1) * 12.9898 + (y + seed * 7.3) * 78.233) * 43758.5453
  return value - Math.floor(value)
}

function createRoughnessTexture(name, spec) {
  if (roughnessTextures.has(name)) return roughnessTextures.get(name)
  const size = 32
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const noise = microNoise(x, y, spec.seed)
      const brush = spec.brushed ? (Math.sin(x * 2.4 + noise * 1.8) + 1) * 0.5 : noise
      const value = Math.round(190 + brush * 60)
      const offset = (y * size + x) * 4
      data[offset] = value
      data[offset + 1] = value
      data[offset + 2] = value
      data[offset + 3] = 255
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  texture.name = `${name}__micro-roughness`
  texture.colorSpace = THREE.NoColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(spec.repeat, spec.brushed ? 2 : spec.repeat)
  texture.generateMipmaps = true
  texture.needsUpdate = true
  roughnessTextures.set(name, texture)
  return texture
}

function readyTexture(texture) {
  if (!texture?.isTexture || !texture.image) return null
  const image = texture.image
  const width = Number(image.naturalWidth ?? image.videoWidth ?? image.width ?? 0)
  const height = Number(image.naturalHeight ?? image.videoHeight ?? image.height ?? 0)
  return width > 0 && height > 0 ? texture : null
}

function convertExternalFbxMaterial(source, spec) {
  const material = new THREE.MeshStandardMaterial({
    name: source.name,
    color: spec.color,
    metalness: spec.metalness,
    roughness: spec.roughness,
    map: readyTexture(source.map),
    normalMap: readyTexture(source.normalMap),
    side: source.side,
    transparent: source.transparent,
    opacity: source.opacity,
    alphaTest: source.alphaTest,
    vertexColors: source.vertexColors,
  })
  if (material.normalMap && source.normalScale) material.normalScale.copy(source.normalScale)
  material.roughnessMap = createRoughnessTexture(source.name, spec)
  material.envMapIntensity = 1.2
  material.userData = { ...source.userData, externalFbxPbr: true }
  material.needsUpdate = true
  return material
}

function applyIndustrialLookdevMaterials(root) {
  const converted = new Map()
  root.traverse((object) => {
    if (!object.isMesh) return
    const entries = Array.isArray(object.material) ? object.material : [object.material]
    const materials = entries.map((material) => {
      const fbxSpec = EXTERNAL_FBX_PBR_SPECS[material?.name]
      if (fbxSpec) {
        if (!converted.has(material.uuid)) converted.set(material.uuid, convertExternalFbxMaterial(material, fbxSpec))
        return converted.get(material.uuid)
      }
      const spec = INDUSTRIAL_MATERIAL_SPECS[material?.name]
      if (!spec) return material
      material.color.setHex(spec.color)
      material.metalness = spec.metalness
      material.roughness = spec.roughness
      material.roughnessMap ||= createRoughnessTexture(material.name, spec)
      material.envMapIntensity = 1.15
      if ('clearcoat' in material) material.clearcoat = Math.max(material.clearcoat, 0.1)
      if ('clearcoatRoughness' in material) material.clearcoatRoughness = Math.min(0.55, spec.roughness * 0.72)
      material.userData.industrialLookdevV4 = true
      material.needsUpdate = true
      return material
    })
    object.material = Array.isArray(object.material) ? materials : materials[0]
  })
}

function meshWorldBounds(mesh) {
  if (!mesh.geometry?.attributes?.position) return null
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
  if (!mesh.geometry.boundingBox || mesh.geometry.boundingBox.isEmpty()) return null
  return mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld)
}

function visibleMeshBounds(root) {
  const bounds = new THREE.Box3()
  root.traverse((object) => {
    if (!object.isMesh || !object.visible) return
    const meshBounds = meshWorldBounds(object)
    if (meshBounds) bounds.union(meshBounds)
  })
  return bounds
}

function hidePresentationOutliers(root) {
  root.updateMatrixWorld(true)
  const records = []
  root.traverse((object) => {
    if (!object.isMesh || !object.visible) return
    const bounds = meshWorldBounds(object)
    if (!bounds) return
    const size = bounds.getSize(new THREE.Vector3())
    const dimensions = [size.x, size.y, size.z].sort((a, b) => a - b)
    records.push({
      object,
      minDimension: dimensions[0],
      maxDimension: dimensions[2],
      bundledHelper: object.name === 'Cube',
      protectedPresentationMesh: object.name === 'ART__industrial-ground'
        || (Array.isArray(object.material) ? object.material : [object.material])
          .some((material) => material?.name === 'ART__concrete-oil-stained'),
    })
  })

  const hidden = []
  for (const record of records) {
    if (record.bundledHelper) {
      record.object.visible = false
      hidden.push(record.object.name || record.object.uuid)
    }
  }

  const volumetric = records
    .filter(({ object, protectedPresentationMesh, minDimension, maxDimension }) => object.visible
      && !protectedPresentationMesh
      && maxDimension > 0
      && minDimension / maxDimension >= 0.02)
    .sort((a, b) => b.maxDimension - a.maxDimension)
  if (volumetric.length > 1 && volumetric[0].maxDimension > volumetric[1].maxDimension * 2.5) {
    volumetric[0].object.visible = false
    hidden.push(volumetric[0].object.name || volumetric[0].object.uuid)
  }

  const referenceDimension = records
    .filter(({ object, protectedPresentationMesh, minDimension, maxDimension }) => object.visible
      && !protectedPresentationMesh
      && maxDimension > 0
      && minDimension / maxDimension >= 0.02)
    .reduce((largest, record) => Math.max(largest, record.maxDimension), 0)

  for (const record of records) {
    const isOversizedTopLevelDatum = record.object.visible
      && !record.protectedPresentationMesh
      && record.object.parent === root
      && record.maxDimension > 0
      && record.minDimension / record.maxDimension < 0.02
      && referenceDimension > 0
      && record.maxDimension > referenceDimension * 3.5
    if (!isOversizedTopLevelDatum) continue
    record.object.visible = false
    hidden.push(record.object.name || record.object.uuid)
  }
  return hidden
}

export function prepareExternalFactoryModel(root, { maxDimension = EXTERNAL_FACTORY_MAX_DIMENSION } = {}) {
  root.updateMatrixWorld(true)
  const presentationHiddenObjects = hidePresentationOutliers(root)
  const sourceBounds = visibleMeshBounds(root)
  const sourceSize = sourceBounds.getSize(new THREE.Vector3())
  const sourceMaxDimension = Math.max(sourceSize.x, sourceSize.y, sourceSize.z)
  if (!Number.isFinite(sourceMaxDimension) || sourceMaxDimension <= 0) {
    throw new Error('external FBX has no measurable mesh bounds')
  }

  root.scale.multiplyScalar(maxDimension / sourceMaxDimension)
  root.updateMatrixWorld(true)

  const scaledBounds = visibleMeshBounds(root)
  const scaledCenter = scaledBounds.getCenter(new THREE.Vector3())
  root.position.x -= scaledCenter.x
  root.position.y -= scaledBounds.min.y
  root.position.z -= scaledCenter.z
  root.updateMatrixWorld(true)

  root.name = 'ExternalFactoryIndustrialLookdev'
  root.userData.assetSource = 'external-fbx-0827'
  root.userData.presentationHiddenObjects = presentationHiddenObjects
  root.userData.originalBounds = {
    size: sourceSize.toArray(),
    center: sourceBounds.getCenter(new THREE.Vector3()).toArray(),
  }
  root.traverse((object) => {
    if (!object.isMesh) return
    object.castShadow = true
    object.receiveShadow = true
  })
  applyIndustrialLookdevMaterials(root)

  return {
    root,
    interactiveObjects: [],
    animatedObjects: [],
    routes: [],
    instancingStats: { sourceMeshes: 0, instancedMeshes: 0, drawCallReduction: 0 },
  }
}

export function createExternalFactoryLoader() {
  return new FBXLoader()
}

export async function loadExternalFactoryModel(loader = createExternalFactoryLoader()) {
  const root = await loader.loadAsync(EXTERNAL_FACTORY_MODEL_URL)
  return prepareExternalFactoryModel(root)
}
