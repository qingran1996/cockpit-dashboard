import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { prepareRotaryKilnModel, ROTARY_KILN_MODEL_URL } from '../scene/rotaryKilnAsset.js'
import { createRotaryKilnLighting } from '../scene/rotaryKilnLighting.js'

function disposeModel(root) {
  root.traverse((object) => {
    if (!object.isMesh) return
    object.geometry?.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials.filter(Boolean)) {
      for (const value of Object.values(material)) {
        if (value?.isTexture) value.dispose()
      }
      material.dispose()
    }
  })
}

export function RotaryKilnModel({ modelUrl = ROTARY_KILN_MODEL_URL, ariaLabel = '回转窑三维设备模型' }) {
  const hostRef = useRef(null)
  const [status, setStatus] = useState('loading')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    let disposed = false
    let model = null
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(30, 1, .1, 100)
    camera.position.set(5.2, 3.2, 4.8)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25))
    host.appendChild(renderer.domElement)

    createRotaryKilnLighting(scene)
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    const roomEnvironment = new RoomEnvironment()
    const environmentTarget = pmremGenerator.fromScene(roomEnvironment, .04)
    scene.environment = environmentTarget.texture
    scene.environmentIntensity = .72
    roomEnvironment.dispose()
    pmremGenerator.dispose()

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 0, 0)
    controls.enablePan = false
    controls.enableDamping = false
    controls.minDistance = 4.5
    controls.maxDistance = 15
    controls.minPolarAngle = Math.PI * .18
    controls.maxPolarAngle = Math.PI * .74

    const render = () => renderer.render(scene, camera)
    controls.addEventListener('change', render)

    const resize = () => {
      const width = Math.max(host.clientWidth, 1)
      const height = Math.max(host.clientHeight, 1)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      render()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    const loader = new GLTFLoader()
    loader.load(modelUrl, (gltf) => {
      if (disposed) {
        disposeModel(gltf.scene)
        return
      }
      model = prepareRotaryKilnModel(gltf.scene, { maxDimension: 6 })
      model.rotation.y = -.34
      model.rotation.x = .03
      scene.add(model)
      controls.update()
      setStatus('ready')
      render()
    }, (event) => {
      if (!event.total) return
      setProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)))
    }, () => {
      if (!disposed) setStatus('error')
    })

    return () => {
      disposed = true
      observer.disconnect()
      controls.removeEventListener('change', render)
      controls.dispose()
      if (model) disposeModel(model)
      environmentTarget.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [modelUrl])

  return (
    <div className="rk-kiln-model" ref={hostRef} role="img" aria-label={ariaLabel}>
      {status !== 'ready' && (
        <div className={`rk-kiln-model__status is-${status}`}>
          <i aria-hidden="true" />
          <span>{status === 'error' ? '模型加载失败' : `设备模型加载中 ${progress}%`}</span>
        </div>
      )}
      <span className="rk-kiln-model__hint">拖拽旋转 · 滚轮缩放</span>
    </div>
  )
}
