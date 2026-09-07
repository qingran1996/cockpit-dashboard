import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

export const PLANT_V068_MODEL_URL = '/models/0906.glb'

function materialEntries(object) {
  return (Array.isArray(object.material) ? object.material : [object.material]).filter(Boolean)
}

function canCastPracticalShadow(mesh) {
  if (materialEntries(mesh).some((material) => material.transparent || material.opacity < .98)) return false
  if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere()
  return (mesh.geometry.boundingSphere?.radius ?? 0) >= .35
}

function isTiledGroundMaterial(material) {
  return /MI_Floor_Concrete_01a/i.test(material.name)
}

export function preparePlantV068Model(root) {
  let meshes = 0
  let triangles = 0
  root.name = 'CampusLightweightFactory'
  root.userData.assetSource = 'campus-lightweight-glb'
  root.traverse((object) => {
    if (!object.isMesh) return
    meshes += 1
    const positionCount = object.geometry?.attributes?.position?.count ?? 0
    triangles += object.geometry?.index ? object.geometry.index.count / 3 : positionCount / 3
    const materials = materialEntries(object)
    const tiledGround = materials.some(isTiledGroundMaterial)
    object.receiveShadow = true
    object.castShadow = !tiledGround && canCastPracticalShadow(object)
    materials.forEach((material) => {
      if (isTiledGroundMaterial(material)) {
        material.polygonOffset = true
        material.polygonOffsetFactor = 1
        material.polygonOffsetUnits = 1
      }
      if (!('envMapIntensity' in material)) return
      const reflectionCap = material.transparent || material.transmission > .01 ? .82 : .46
      material.userData.environmentIntensityCap = reflectionCap
      material.envMapIntensity = reflectionCap
    })
  })
  root.userData.sourceStats = { meshes, triangles: Math.round(triangles) }
  root.updateMatrixWorld(true)
  return {
    root,
    interactiveObjects: [],
    animatedObjects: [],
    routes: [],
    instancingStats: { sourceMeshes: meshes, instancedMeshes: 0, drawCallReduction: 0 },
  }
}

export function createPlantV068Loader() {
  return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
}

export function frameCampusLightweightModel(root) {
  root.position.set(0, 0, 0)
  root.rotation.set(0, 0, 0)
  root.scale.setScalar(1)
  root.updateMatrixWorld(true)
  return root
}

function translateLoadError(error) {
  const detail = error instanceof Error ? error.message : String(error)
  if (/webp/i.test(detail)) {
    return new Error(`浏览器不支持模型内嵌的 WebP 贴图。请使用最新版 Chrome、Edge 或 Safari。\n${detail}`, { cause: error })
  }
  if (/meshopt|EXT_meshopt_compression/i.test(detail)) {
    return new Error(`Meshopt 压缩几何解码失败。请确认浏览器允许加载解码器。\n${detail}`, { cause: error })
  }
  return new Error(`厂区 GLB 加载失败：${detail}`, { cause: error })
}

export async function loadPlantV068Model({
  loader = createPlantV068Loader(),
  onProgress = () => {},
} = {}) {
  let lastProgress = -1
  const publishProgress = (value) => {
    if (value === lastProgress) return
    lastProgress = value
    onProgress(value)
  }
  try {
    const gltf = await loader.loadAsync(PLANT_V068_MODEL_URL, (event) => {
      if (!event?.lengthComputable || !event.total) return
      publishProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
    })
    publishProgress(100)
    const prepared = preparePlantV068Model(gltf.scene)
    frameCampusLightweightModel(prepared.root)
    return prepared
  } catch (error) {
    throw translateLoadError(error)
  }
}
