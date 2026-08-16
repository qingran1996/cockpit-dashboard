import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createIndustrialScene } from '../scene/sceneFactory.js'
import { campusSite } from '../scene/factoryCampusFactory.js'
import { factoryCampusById, factoryCampusRegistry } from '../scene/factoryCampusRegistry.js'
import {
  cameraLimits,
  clampPixelRatio,
  factoryCampusFirstPersonSpawn,
  factoryCampusFogDensity,
  factoryCampusInitialView,
  getBuildingFocusView,
  getFirstPersonLookTarget,
  moveFirstPerson,
  normalizePointer,
} from '../scene/sceneMath.js'

const INITIAL_CAMERA = new THREE.Vector3(...factoryCampusInitialView.position)
const INITIAL_TARGET = new THREE.Vector3(...factoryCampusInitialView.target)

function setBuildingHighlight(building, active) {
  if (!building) return
  const materials = new Set()
  building.traverse((object) => {
    if (!object.material) return
    const entries = Array.isArray(object.material) ? object.material : [object.material]
    entries.forEach((material) => materials.add(material))
  })
  materials.forEach((material) => {
    if ('emissiveIntensity' in material) {
      if (material.userData.baseEmissiveIntensity === undefined) material.userData.baseEmissiveIntensity = material.emissiveIntensity
      material.emissiveIntensity = active ? Math.max(.72, material.userData.baseEmissiveIntensity * 4) : material.userData.baseEmissiveIntensity
    }
    if ('opacity' in material && material.transparent) {
      if (material.userData.baseOpacity === undefined) material.userData.baseOpacity = material.opacity
      material.opacity = active ? Math.min(1, material.userData.baseOpacity * 1.25) : material.userData.baseOpacity
    }
  })
}

function findBuildingGroup(object) {
  let current = object
  while (current && !current.userData.buildingId) current = current.parent
  while (current?.parent?.userData?.buildingId === current.userData.buildingId) current = current.parent
  return current
}

export function useIndustrialScene({ containerRef, onHover, onSelect, reducedMotion }) {
  const [webglError, setWebglError] = useState(false)
  const [viewMode, setViewMode] = useState('overview')
  const resetRef = useRef(() => {})
  const toggleFirstPersonRef = useRef(() => {})

  const resetView = useCallback(() => resetRef.current(), [])
  const toggleFirstPerson = useCallback(() => toggleFirstPersonRef.current(), [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch {
      setWebglError(true)
      return undefined
    }

    setWebglError(false)
    renderer.setPixelRatio(clampPixelRatio(window.devicePixelRatio))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.35
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.domElement.className = 'industrial-scene__webgl'
    renderer.domElement.setAttribute('aria-label', '可旋转缩放的三维工业园区能源网络')
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x020b14, factoryCampusFogDensity)
    const camera = new THREE.PerspectiveCamera(factoryCampusInitialView.fov, 1, .1, cameraLimits.farPlane)
    camera.position.copy(INITIAL_CAMERA)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(INITIAL_TARGET)
    controls.enableDamping = true
    controls.dampingFactor = .055
    controls.enablePan = false
    controls.minDistance = cameraLimits.minDistance
    controls.maxDistance = cameraLimits.maxDistance
    controls.minPolarAngle = cameraLimits.minPolarAngle
    controls.maxPolarAngle = cameraLimits.maxPolarAngle
    controls.autoRotateSpeed = .35
    controls.update()

    const park = createIndustrialScene()
    park.root.position.y = -1.2
    scene.add(park.root)
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2(2, 2)
    let hovered = null
    let frameId = 0
    let lastInteraction = performance.now() - 4000
    let lastFrameTime = performance.now()
    let activeMode = 'overview'
    let cameraTween = null
    let firstPersonYaw = factoryCampusFirstPersonSpawn.yaw
    let firstPersonPitch = factoryCampusFirstPersonSpawn.pitch
    const pressedKeys = new Set()

    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    const setMode = (mode) => {
      activeMode = mode
      setViewMode(mode)
      container.dataset.viewMode = mode
      renderer.domElement.setAttribute(
        'aria-label',
        mode === 'first-person'
          ? '第一人称可步行的三维工业园区'
          : '可点击建筑并旋转缩放的三维工业园区',
      )
    }

    const setCameraFov = (fov) => {
      if (Math.abs(camera.fov - fov) < 1e-4) return
      camera.fov = fov
      camera.updateProjectionMatrix()
    }

    const transitionCamera = (position, target, fov, mode) => {
      const toPosition = new THREE.Vector3(...position)
      const toTarget = new THREE.Vector3(...target)
      setMode(mode)
      controls.enabled = true
      controls.autoRotate = false
      controls.minDistance = 5
      lastInteraction = performance.now()
      const finalMinDistance = mode === 'focus' ? 5 : cameraLimits.minDistance

      if (reducedMotion) {
        camera.position.copy(toPosition)
        controls.target.copy(toTarget)
        setCameraFov(fov)
        cameraTween = null
        controls.minDistance = finalMinDistance
        controls.update()
        return
      }

      cameraTween = {
        startedAt: performance.now(),
        fromPosition: camera.position.clone(),
        fromTarget: controls.target.clone(),
        fromFov: camera.fov,
        toPosition,
        toTarget,
        toFov: fov,
        finalMinDistance,
      }
    }

    const clearHover = () => {
      setBuildingHighlight(hovered, false)
      hovered = null
      onHover(null, null)
    }

    const enterFirstPerson = () => {
      cameraTween = null
      pressedKeys.clear()
      clearHover()
      onSelect(null)
      controls.enabled = false
      controls.autoRotate = false
      firstPersonYaw = factoryCampusFirstPersonSpawn.yaw
      firstPersonPitch = factoryCampusFirstPersonSpawn.pitch
      camera.position.set(...factoryCampusFirstPersonSpawn.position)
      setCameraFov(62)
      camera.lookAt(...getFirstPersonLookTarget(camera.position.toArray(), firstPersonYaw, firstPersonPitch))
      renderer.domElement.style.cursor = 'crosshair'
      setMode('first-person')
    }

    const exitToOverview = () => {
      pressedKeys.clear()
      if (activeMode === 'first-person') {
        controls.target.set(...getFirstPersonLookTarget(camera.position.toArray(), firstPersonYaw, firstPersonPitch))
      }
      renderer.domElement.style.cursor = 'grab'
      transitionCamera(factoryCampusInitialView.position, factoryCampusInitialView.target, factoryCampusInitialView.fov, 'overview')
    }

    const pick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const normalized = normalizePointer(event.clientX, event.clientY, rect)
      pointer.set(normalized.x, normalized.y)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(park.interactiveObjects, true)[0]
      return { building: hit ? findBuildingGroup(hit.object) : null, rect }
    }

    const handlePointerMove = (event) => {
      if (activeMode === 'first-person') {
        if (event.buttons & 1) {
          firstPersonYaw -= event.movementX * .0032
          firstPersonPitch = Math.max(-1.05, Math.min(1.05, firstPersonPitch - event.movementY * .0026))
        }
        renderer.domElement.style.cursor = 'crosshair'
        return
      }
      const { building, rect } = pick(event)
      if (building !== hovered) {
        setBuildingHighlight(hovered, false)
        hovered = building
        setBuildingHighlight(hovered, true)
      }
      renderer.domElement.style.cursor = building ? 'pointer' : 'grab'
      onHover(building?.userData.buildingId ?? null, building ? { x: event.clientX - rect.left, y: event.clientY - rect.top } : null)
    }

    const handlePointerLeave = () => {
      clearHover()
    }

    const handleClick = (event) => {
      if (activeMode === 'first-person') return
      const { building } = pick(event)
      const buildingId = building?.userData.buildingId ?? null
      onSelect(buildingId)
      const record = buildingId ? factoryCampusById.get(buildingId) : null
      if (record) {
        const view = getBuildingFocusView(record)
        transitionCamera(view.position, view.target, 44, 'focus')
      }
    }

    const handleKeyDown = (event) => {
      if (activeMode !== 'first-person') return
      if (event.code === 'Escape') {
        event.preventDefault()
        exitToOverview()
        return
      }
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
        event.preventDefault()
        pressedKeys.add(event.code)
      }
    }

    const handleKeyUp = (event) => {
      pressedKeys.delete(event.code)
    }

    renderer.domElement.addEventListener('pointermove', handlePointerMove)
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave)
    renderer.domElement.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    controls.addEventListener('start', () => {
      controls.autoRotate = false
      lastInteraction = performance.now()
    })
    controls.addEventListener('end', () => { lastInteraction = performance.now() })

    setMode('overview')
    resetRef.current = exitToOverview
    toggleFirstPersonRef.current = () => {
      if (activeMode === 'first-person') exitToOverview()
      else enterFirstPerson()
    }

    const animate = (time) => {
      frameId = window.requestAnimationFrame(animate)
      const seconds = time * .001
      const delta = Math.min(Math.max((time - lastFrameTime) * .001, 0), .05)
      lastFrameTime = time
      controls.autoRotate = activeMode === 'overview'
        && !reducedMotion
        && !cameraTween
        && performance.now() - lastInteraction > 8000

      if (cameraTween) {
        const progress = Math.min((performance.now() - cameraTween.startedAt) / 850, 1)
        const eased = 1 - (1 - progress) ** 3
        camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, eased)
        controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, eased)
        setCameraFov(THREE.MathUtils.lerp(cameraTween.fromFov, cameraTween.toFov, eased))
        if (progress === 1) {
          controls.minDistance = cameraTween.finalMinDistance
          cameraTween = null
        }
      }

      if (activeMode === 'first-person') {
        const turningLeft = pressedKeys.has('ArrowLeft')
        const turningRight = pressedKeys.has('ArrowRight')
        firstPersonYaw += (Number(turningLeft) - Number(turningRight)) * 1.35 * delta
        const forward = Number(pressedKeys.has('KeyW') || pressedKeys.has('ArrowUp'))
          - Number(pressedKeys.has('KeyS') || pressedKeys.has('ArrowDown'))
        const strafe = Number(pressedKeys.has('KeyD')) - Number(pressedKeys.has('KeyA'))
        const sprinting = pressedKeys.has('ShiftLeft') || pressedKeys.has('ShiftRight')
        const nextPosition = moveFirstPerson(
          camera.position.toArray(),
          firstPersonYaw,
          { forward, strafe },
          (sprinting ? 8 : 4.5) * delta,
          factoryCampusRegistry,
          campusSite,
        )
        camera.position.set(...nextPosition)
        camera.lookAt(...getFirstPersonLookTarget(nextPosition, firstPersonYaw, firstPersonPitch))
      } else {
        controls.update()
      }

      if (!reducedMotion) {
        park.animated.forEach((item) => {
          if (item.kind === 'pulse') {
            const scale = 1 + Math.sin(seconds * 2.4 + item.phase) * .32
            item.object.scale.setScalar(scale)
            item.object.material.opacity = .5 + Math.sin(seconds * 2.4 + item.phase) * .28
          } else if (item.kind === 'particles') {
            item.object.rotation.y = seconds * .018
          } else if (item.kind === 'heat') {
            item.object.rotation.y += .00045
          } else if (item.kind === 'pedestrian') {
            item.update(seconds)
          } else if (item.kind === 'vehicle') {
            item.update(seconds)
          }
        })
      }

      renderer.render(scene, camera)
    }
    frameId = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(frameId)
      observer.disconnect()
      renderer.domElement.removeEventListener('pointermove', handlePointerMove)
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave)
      renderer.domElement.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      setBuildingHighlight(hovered, false)
      controls.dispose()
      park.dispose()
      scene.clear()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
      delete container.dataset.viewMode
      resetRef.current = () => {}
      toggleFirstPersonRef.current = () => {}
    }
  }, [containerRef, onHover, onSelect, reducedMotion])

  return { webglError, resetView, viewMode, toggleFirstPerson }
}
