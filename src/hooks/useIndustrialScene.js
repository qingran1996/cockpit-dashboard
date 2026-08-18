import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createIndustrialScene } from '../scene/sceneFactory.js'
import { applyFloorView, updateFloorAnimations } from '../scene/floorInteraction.js'
import { createFloorCameraPose, getFloorInspectionAnchor } from '../scene/floorCamera.js'
import { buildingById } from '../scene/buildingRegistry.js'
import { cameraLimits, clampPixelRatio, initialCameraView, normalizePointer } from '../scene/sceneMath.js'
import { updateVehicleAnimations } from '../scene/vehicleAnimation.js'
import { updatePersonAnimations } from '../scene/personAnimation.js'
import { updateGateAnimations } from '../scene/gateAnimation.js'
import { createFloorInspectionLighting } from '../scene/floorInspectionLighting.js'
import { applyCampusLightingMode } from '../scene/campusLightingMode.js'

const INITIAL_CAMERA = new THREE.Vector3(...initialCameraView.position)
const INITIAL_TARGET = new THREE.Vector3(...initialCameraView.target)

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

export function useIndustrialScene({ containerRef, onHover, onSelect, reducedMotion, floorView, lightingMode = 'day' }) {
  const [webglError, setWebglError] = useState(false)
  const resetRef = useRef(() => {})
  const focusFloorRef = useRef(() => {})
  const parkRef = useRef(null)
  const floorViewRef = useRef(floorView)
  const lightingModeRef = useRef(lightingMode)
  const lightingControllerRef = useRef(null)

  const resetView = useCallback(() => resetRef.current(), [])
  const focusFloor = useCallback((buildingId, floorId) => focusFloorRef.current(buildingId, floorId), [])

  useEffect(() => {
    floorViewRef.current = floorView
    if (parkRef.current) applyFloorView(parkRef.current.interactiveObjects, floorView)
  }, [floorView])

  useEffect(() => {
    lightingModeRef.current = lightingMode
    if (lightingControllerRef.current) {
      applyCampusLightingMode(lightingControllerRef.current, lightingMode)
    }
  }, [lightingMode])

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
    renderer.toneMappingExposure = initialCameraView.exposure
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.domElement.className = 'industrial-scene__webgl'
    renderer.domElement.setAttribute('aria-label', '可旋转缩放的三维工业园区能源网络')
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x020b14, initialCameraView.fogDensity)
    lightingControllerRef.current = { scene, renderer }
    const camera = new THREE.PerspectiveCamera(initialCameraView.fov, 1, .1, 160)
    camera.position.copy(INITIAL_CAMERA)
    const inspectionLighting = createFloorInspectionLighting()
    scene.add(inspectionLighting.group)

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
    parkRef.current = park
    applyFloorView(park.interactiveObjects, floorViewRef.current)
    park.ready.then(() => {
      if (parkRef.current === park) applyFloorView(park.interactiveObjects, floorViewRef.current)
    })
    park.root.position.y = -1.2
    scene.add(park.root)
    applyCampusLightingMode({ scene, renderer }, lightingModeRef.current)
    park.ready.then(() => {
      if (parkRef.current === park) applyCampusLightingMode({ scene, renderer }, lightingModeRef.current)
    })
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2(2, 2)
    let hovered = null
    let frameId = 0
    let lastInteraction = performance.now() - 4000
    let resetStart = 0
    let resetFromPosition = null
    let resetFromTarget = null
    let focusTransition = null
    let previousFrameTime = 0

    const resolveFloorPose = (buildingId, floorId) => {
      const building = park.interactiveObjects.find((item) => item.userData.buildingId === buildingId)
      const floor = building?.userData.floorRoots?.find((item) => item.userData.floorId === floorId)
      const record = buildingById.get(buildingId)
      if (!floor || !record) return null
      return createFloorCameraPose({
        floorWorldPosition: getFloorInspectionAnchor(floor),
        buildingSize: record.size,
      })
    }

    const updateInspectionLighting = () => {
      const { buildingId, focusedFloorId } = floorViewRef.current ?? {}
      const building = park.interactiveObjects.find((item) => item.userData.buildingId === buildingId)
      const floor = building?.userData.floorRoots?.find((item) => item.userData.floorId === focusedFloorId)
      if (!floor) {
        inspectionLighting.update([0, 0, 0], false)
        return
      }
      inspectionLighting.update(getFloorInspectionAnchor(floor), true)
    }

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

    const pick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const normalized = normalizePointer(event.clientX, event.clientY, rect)
      pointer.set(normalized.x, normalized.y)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(park.interactiveObjects, true)[0]
      return { building: hit ? findBuildingGroup(hit.object) : null, rect }
    }

    const handlePointerMove = (event) => {
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
      setBuildingHighlight(hovered, false)
      hovered = null
      onHover(null, null)
    }

    const handleClick = (event) => {
      const { building } = pick(event)
      onSelect(building?.userData.buildingId ?? null)
    }

    renderer.domElement.addEventListener('pointermove', handlePointerMove)
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave)
    renderer.domElement.addEventListener('click', handleClick)
    controls.addEventListener('start', () => {
      focusTransition = null
      controls.autoRotate = false
      lastInteraction = performance.now()
    })
    controls.addEventListener('end', () => { lastInteraction = performance.now() })

    resetRef.current = () => {
      focusTransition = null
      controls.minDistance = cameraLimits.minDistance
      controls.maxDistance = cameraLimits.maxDistance
      resetStart = performance.now()
      resetFromPosition = camera.position.clone()
      resetFromTarget = controls.target.clone()
      lastInteraction = performance.now()
    }

    focusFloorRef.current = (buildingId, floorId) => {
      const pose = resolveFloorPose(buildingId, floorId)
      if (!pose) return false
      resetStart = 0
      controls.autoRotate = false
      controls.minDistance = 1.2
      controls.maxDistance = Math.min(24, cameraLimits.maxDistance)
      focusTransition = {
        buildingId,
        floorId,
        startedAt: performance.now(),
        duration: pose.duration,
        fromPosition: camera.position.clone(),
        fromTarget: controls.target.clone(),
      }
      lastInteraction = performance.now()
      return true
    }

    const animate = (time) => {
      frameId = window.requestAnimationFrame(animate)
      const seconds = time * .001
      const deltaSeconds = previousFrameTime ? Math.min((time - previousFrameTime) * .001, .1) : 0
      previousFrameTime = time
      controls.autoRotate = !reducedMotion && !resetStart && performance.now() - lastInteraction > 8000
      updateFloorAnimations(park.interactiveObjects, deltaSeconds, reducedMotion)
      updateVehicleAnimations(park.animated, seconds, reducedMotion)
      updatePersonAnimations(park.animated, seconds, reducedMotion)
      updateGateAnimations(park.animated, seconds, reducedMotion)
      updateInspectionLighting()

      if (focusTransition) {
        const pose = resolveFloorPose(focusTransition.buildingId, focusTransition.floorId)
        if (!pose) {
          focusTransition = null
        } else {
          const progress = reducedMotion ? 1 : Math.min((performance.now() - focusTransition.startedAt) / focusTransition.duration, 1)
          const eased = 1 - (1 - progress) ** 3
          camera.position.lerpVectors(focusTransition.fromPosition, new THREE.Vector3(...pose.position), eased)
          controls.target.lerpVectors(focusTransition.fromTarget, new THREE.Vector3(...pose.target), eased)
          if (progress === 1) focusTransition = null
        }
      }

      if (resetStart) {
        const progress = Math.min((performance.now() - resetStart) / 900, 1)
        const eased = 1 - (1 - progress) ** 3
        camera.position.lerpVectors(resetFromPosition, INITIAL_CAMERA, eased)
        controls.target.lerpVectors(resetFromTarget, INITIAL_TARGET, eased)
        if (progress === 1) resetStart = 0
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
          }
        })
      }

      controls.update()
      renderer.render(scene, camera)
    }
    frameId = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(frameId)
      observer.disconnect()
      renderer.domElement.removeEventListener('pointermove', handlePointerMove)
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave)
      renderer.domElement.removeEventListener('click', handleClick)
      setBuildingHighlight(hovered, false)
      controls.dispose()
      inspectionLighting.dispose()
      park.dispose()
      if (parkRef.current === park) parkRef.current = null
      if (lightingControllerRef.current?.scene === scene) lightingControllerRef.current = null
      scene.clear()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
      resetRef.current = () => {}
      focusFloorRef.current = () => false
    }
  }, [containerRef, onHover, onSelect, reducedMotion])

  return { webglError, resetView, focusFloor }
}
