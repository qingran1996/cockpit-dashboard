import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { createIndustrialScene } from '../scene/sceneFactory.js'
import { applyFloorView, applyInspectionOccluders, updateFloorAnimations } from '../scene/floorInteraction.js'
import { createFloorCameraPose, getFloorInspectionAnchor } from '../scene/floorCamera.js'
import { buildingById } from '../scene/buildingRegistry.js'
import { cameraLimits, clampPixelRatio, focusCameraView, initialCameraView, normalizePointer } from '../scene/sceneMath.js'
import { updateVehicleAnimations } from '../scene/vehicleAnimation.js'
import { updatePersonAnimations } from '../scene/personAnimation.js'
import { updateGateAnimations } from '../scene/gateAnimation.js'
import { updateRobotArmAnimations } from '../scene/robotArmAnimation.js'
import { createFloorInspectionLighting } from '../scene/floorInspectionLighting.js'
import { applyCampusLightingMode, updateCampusBackdropCamera } from '../scene/campusLightingMode.js'
import { configureCampusShadowQuality } from '../scene/campusShadowQuality.js'
import { installCampusEnvironment } from '../scene/campusEnvironment.js'
import { applyCampusMaterialQuality, createCampusQualityController } from '../scene/campusMaterialQuality.js'
import { createCampusMaterialController } from '../scene/campusMaterialLab.js'
import { configureCampusRenderer, createCampusPostProcessing } from '../scene/campusPostProcessing.js'
import { DEFAULT_CAMPUS_LIGHTING_MODE, deriveCampusOrbitPolicy } from '../scene/campusViewDefaults.js'
import { resolveCampusSunlight } from '../scene/campusSunlight.js'
import { DEFAULT_CAMPUS_RENDER_STYLE } from '../scene/campusRenderStyle.js'
import { normalizeCampusTourIndex, resolveCampusTourStop } from '../scene/campusTour.js'
import { createBuildingPickIndex } from '../scene/buildingPickIndex.js'
import { createPointerPickScheduler } from '../scene/pointerPickScheduler.js'

const INITIAL_CAMERA = new THREE.Vector3(...initialCameraView.position)
const INITIAL_TARGET = new THREE.Vector3(...initialCameraView.target)
const FOCUS_CAMERA = new THREE.Vector3(...focusCameraView.position)
const FOCUS_TARGET = new THREE.Vector3(...focusCameraView.target)
const INACTIVE_TOUR_STATE = Object.freeze({ active: false, playing: false, index: 0, progress: 0 })

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

export function useIndustrialScene({ containerRef, onHover, onSelect, reducedMotion, floorView, lightingMode = DEFAULT_CAMPUS_LIGHTING_MODE, renderStyle = DEFAULT_CAMPUS_RENDER_STYLE, sunlightPercent, lightingProfile, trafficEnabled = true, focusMode = false }) {
  const [webglError, setWebglError] = useState(false)
  const [tourState, setTourState] = useState(INACTIVE_TOUR_STATE)
  const resetRef = useRef(() => {})
  const focusFloorRef = useRef(() => {})
  const parkRef = useRef(null)
  const floorViewRef = useRef(floorView)
  const lightingModeRef = useRef(lightingMode)
  const renderStyleRef = useRef(renderStyle)
  const sunlightPercentRef = useRef(resolveCampusSunlight({ [lightingMode]: sunlightPercent }, lightingMode))
  const lightingProfileRef = useRef(lightingProfile)
  const lightingControllerRef = useRef(null)
  const focusModeRef = useRef(focusMode)
  const focusModeControllerRef = useRef(() => {})
  const materialControllerRef = useRef(null)
  const materialEditsRef = useRef(new Map())
  const trafficEnabledRef = useRef(trafficEnabled)
  const tourActionRef = useRef({ start: () => {}, toggle: () => {}, previous: () => {}, next: () => {}, stop: () => {} })

  const resetView = useCallback(() => resetRef.current(), [])
  const focusFloor = useCallback((buildingId, floorId) => focusFloorRef.current(buildingId, floorId), [])
  const applyBuildingMaterial = useCallback((buildingId, scope, settings) => {
    const key = `${buildingId}:${scope}`
    materialEditsRef.current.set(key, { buildingId, scope, settings: { ...settings } })
    return materialControllerRef.current?.apply(buildingId, scope, settings) ?? false
  }, [])
  const resetBuildingMaterial = useCallback((buildingId, scope) => {
    materialEditsRef.current.delete(`${buildingId}:${scope}`)
    return materialControllerRef.current?.reset(buildingId, scope) ?? false
  }, [])
  const startTour = useCallback(() => tourActionRef.current.start(), [])
  const toggleTour = useCallback(() => tourActionRef.current.toggle(), [])
  const previousTourStop = useCallback(() => tourActionRef.current.previous(), [])
  const nextTourStop = useCallback(() => tourActionRef.current.next(), [])
  const stopTour = useCallback(() => tourActionRef.current.stop(), [])

  useEffect(() => {
    floorViewRef.current = floorView
    if (parkRef.current) {
      applyFloorView(parkRef.current.interactiveObjects, floorView)
      applyInspectionOccluders(parkRef.current.root, Boolean(floorView?.focusedFloorId))
    }
  }, [floorView])

  useEffect(() => {
    lightingModeRef.current = lightingMode
    renderStyleRef.current = renderStyle
    sunlightPercentRef.current = resolveCampusSunlight({ [lightingMode]: sunlightPercent }, lightingMode)
    lightingProfileRef.current = lightingProfile
    if (lightingControllerRef.current) {
      applyCampusLightingMode(lightingControllerRef.current, lightingMode, sunlightPercentRef.current, lightingProfileRef.current, renderStyleRef.current)
    }
  }, [lightingMode, renderStyle, sunlightPercent, lightingProfile])

  useEffect(() => {
    trafficEnabledRef.current = trafficEnabled
  }, [trafficEnabled])

  useEffect(() => {
    focusModeRef.current = focusMode
    lightingControllerRef.current?.postProcessing?.setFocusMode?.(focusMode)
    focusModeControllerRef.current(focusMode)
  }, [focusMode])

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
    const pixelRatio = clampPixelRatio(window.devicePixelRatio)
    renderer.setPixelRatio(pixelRatio)
    renderer.setClearColor(0x000000, 0)
    configureCampusRenderer(renderer, { exposure: initialCameraView.exposure })
    renderer.domElement.className = 'industrial-scene__webgl'
    renderer.domElement.setAttribute('aria-label', '可旋转缩放的三维工业园区能源网络')
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    const environmentScene = new RoomEnvironment()
    const environmentTarget = pmremGenerator.fromScene(environmentScene, .04)
    pmremGenerator.dispose()
    environmentScene.dispose()
    installCampusEnvironment(scene, environmentTarget.texture, lightingModeRef.current)
    scene.fog = new THREE.FogExp2(0x020b14, initialCameraView.fogDensity)
    const camera = new THREE.PerspectiveCamera(initialCameraView.fov, 1, .1, 160)
    camera.position.copy(focusMode ? FOCUS_CAMERA : INITIAL_CAMERA)
    const postProcessing = createCampusPostProcessing({
      renderer,
      scene,
      camera,
      mode: lightingModeRef.current,
      reducedMotion,
      pixelRatio,
      focused: focusMode,
    })
    lightingControllerRef.current = { scene, camera, renderer, postProcessing }
    const inspectionLighting = createFloorInspectionLighting()
    scene.add(inspectionLighting.group)

    const controls = new OrbitControls(camera, renderer.domElement)
    const orbitPolicy = deriveCampusOrbitPolicy({ reducedMotion })
    controls.target.copy(focusMode ? FOCUS_TARGET : INITIAL_TARGET)
    controls.enableDamping = orbitPolicy.enableDamping
    controls.dampingFactor = orbitPolicy.dampingFactor
    controls.enablePan = false
    controls.minDistance = cameraLimits.minDistance
    controls.maxDistance = cameraLimits.maxDistance
    controls.minPolarAngle = cameraLimits.minPolarAngle
    controls.maxPolarAngle = cameraLimits.maxPolarAngle
    controls.autoRotate = orbitPolicy.autoRotate
    controls.update()

    const park = createIndustrialScene()
    configureCampusShadowQuality({ renderer, root: park.root })
    applyCampusMaterialQuality({ root: park.root, renderer })
    const qualityController = createCampusQualityController({
      root: park.root,
      camera,
      target: controls.target,
      reducedMotion,
      onQualityChange: (quality) => postProcessing.setQuality(quality),
    })
    qualityController.update()
    parkRef.current = park
    let buildingPickIndex = null
    applyFloorView(park.interactiveObjects, floorViewRef.current)
    park.ready.then(() => {
      if (parkRef.current === park) {
        applyCampusMaterialQuality({ root: park.root, renderer })
        materialControllerRef.current?.dispose()
        materialControllerRef.current = createCampusMaterialController(park.root)
        materialEditsRef.current.forEach(({ buildingId, scope, settings }) => {
          materialControllerRef.current.apply(buildingId, scope, settings)
        })
        qualityController.refresh()
        applyFloorView(park.interactiveObjects, floorViewRef.current)
        applyInspectionOccluders(park.root, Boolean(floorViewRef.current?.focusedFloorId))
        buildingPickIndex?.refresh()
      }
    })
    park.root.position.y = -1.2
    scene.add(park.root)
    park.root.updateMatrixWorld(true)
    buildingPickIndex = createBuildingPickIndex(park.interactiveObjects)
    applyInspectionOccluders(park.root, Boolean(floorViewRef.current?.focusedFloorId))
    applyCampusLightingMode({ scene, camera, renderer, postProcessing }, lightingModeRef.current, sunlightPercentRef.current, lightingProfileRef.current, renderStyleRef.current)
    park.ready.then(() => {
      if (parkRef.current === park) applyCampusLightingMode({ scene, camera, renderer, postProcessing }, lightingModeRef.current, sunlightPercentRef.current, lightingProfileRef.current, renderStyleRef.current)
    })
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2(2, 2)
    let hovered = null
    let frameId = 0
    let resetStart = 0
    let resetFromPosition = null
    let resetFromTarget = null
    let resetToPosition = focusMode ? FOCUS_CAMERA : INITIAL_CAMERA
    let resetToTarget = focusMode ? FOCUS_TARGET : INITIAL_TARGET
    let focusTransition = null
    let previousFrameTime = 0
    let tourPublishTime = 0
    const tour = {
      active: false,
      playing: false,
      index: 0,
      transition: null,
      arrivedAt: 0,
    }

    const publishTourState = (progress = 0, force = false) => {
      const now = performance.now()
      if (!force && now - tourPublishTime < 120) return
      tourPublishTime = now
      setTourState({
        active: tour.active,
        playing: tour.playing,
        index: tour.index,
        progress: Math.max(0, Math.min(1, progress)),
      })
    }

    const leaveTour = () => {
      tour.active = false
      tour.playing = false
      tour.transition = null
      tour.arrivedAt = 0
      publishTourState(0, true)
    }

    const flyToTourStop = (index, playing = tour.playing) => {
      const safeIndex = normalizeCampusTourIndex(index)
      const stop = resolveCampusTourStop(safeIndex)
      tour.active = true
      tour.playing = playing
      tour.index = safeIndex
      tour.arrivedAt = 0
      tour.transition = {
        startedAt: performance.now(),
        duration: reducedMotion ? 0 : stop.transitionMs,
        fromPosition: camera.position.clone(),
        fromTarget: controls.target.clone(),
      }
      resetStart = 0
      focusTransition = null
      publishTourState(0, true)
    }

    tourActionRef.current = {
      start: () => flyToTourStop(0, true),
      toggle: () => {
        if (!tour.active) return flyToTourStop(0, true)
        if (tour.playing) {
          tour.playing = false
          tour.transition = null
          publishTourState(0, true)
        } else {
          flyToTourStop(tour.index, true)
        }
      },
      previous: () => flyToTourStop(tour.index - 1, tour.playing),
      next: () => flyToTourStop(tour.index + 1, tour.playing),
      stop: () => {
        leaveTour()
        resetRef.current()
      },
    }

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
      postProcessing.setSize(width, height)
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
      return { building: buildingPickIndex.pick(raycaster), rect }
    }

    const publishPointerPick = (result, event) => {
      const building = result?.building ?? null
      if (building !== hovered) {
        setBuildingHighlight(hovered, false)
        hovered = building
        setBuildingHighlight(hovered, true)
      }
      renderer.domElement.style.cursor = building ? 'pointer' : 'grab'
      onHover(building?.userData.buildingId ?? null, building && event ? { x: event.clientX - result.rect.left, y: event.clientY - result.rect.top } : null)
    }

    const pointerPickScheduler = createPointerPickScheduler({
      requestFrame: (callback) => window.requestAnimationFrame(callback),
      cancelFrame: (id) => window.cancelAnimationFrame(id),
      pick,
      publish: publishPointerPick,
    })

    const handlePointerMove = (event) => pointerPickScheduler.move(event)
    const handlePointerLeave = () => pointerPickScheduler.leave()

    const handleClick = (event) => {
      if (tour.active) return
      const { building } = pick(event)
      onSelect(building?.userData.buildingId ?? null)
    }

    renderer.domElement.addEventListener('pointermove', handlePointerMove)
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave)
    renderer.domElement.addEventListener('click', handleClick)
    const handleControlsStart = () => {
      pointerPickScheduler.setInteracting(true)
      pointerPickScheduler.leave()
      focusTransition = null
      if (tour.active && tour.playing) {
        tour.playing = false
        tour.transition = null
        publishTourState(0, true)
      }
    }
    const handleControlsEnd = () => pointerPickScheduler.setInteracting(false)
    controls.addEventListener('start', handleControlsStart)
    controls.addEventListener('end', handleControlsEnd)

    resetRef.current = () => {
      if (tour.active) leaveTour()
      focusTransition = null
      controls.minDistance = cameraLimits.minDistance
      controls.maxDistance = cameraLimits.maxDistance
      resetStart = performance.now()
      resetFromPosition = camera.position.clone()
      resetFromTarget = controls.target.clone()
      resetToPosition = focusModeRef.current ? FOCUS_CAMERA : INITIAL_CAMERA
      resetToTarget = focusModeRef.current ? FOCUS_TARGET : INITIAL_TARGET
    }

    focusModeControllerRef.current = (focused) => {
      if (tour.active) leaveTour()
      focusTransition = null
      controls.minDistance = cameraLimits.minDistance
      controls.maxDistance = cameraLimits.maxDistance
      resetStart = performance.now()
      resetFromPosition = camera.position.clone()
      resetFromTarget = controls.target.clone()
      resetToPosition = focused ? FOCUS_CAMERA : INITIAL_CAMERA
      resetToTarget = focused ? FOCUS_TARGET : INITIAL_TARGET
    }

    focusFloorRef.current = (buildingId, floorId) => {
      const pose = resolveFloorPose(buildingId, floorId)
      if (!pose) return false
      if (tour.active) leaveTour()
      resetStart = 0
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
      return true
    }

    const animate = (time) => {
      frameId = window.requestAnimationFrame(animate)
      const seconds = time * .001
      const deltaSeconds = previousFrameTime ? Math.min((time - previousFrameTime) * .001, .1) : 0
      previousFrameTime = time
      updateFloorAnimations(park.interactiveObjects, deltaSeconds, reducedMotion)
      updateVehicleAnimations(park.animated, seconds, reducedMotion, trafficEnabledRef.current)
      updatePersonAnimations(park.animated, seconds, reducedMotion)
      updateGateAnimations(park.animated, seconds, reducedMotion)
      updateRobotArmAnimations(park.animated, seconds, reducedMotion)
      updateInspectionLighting()

      if (tour.active) {
        const stop = resolveCampusTourStop(tour.index)
        const totalDuration = stop.transitionMs + stop.holdMs
        if (tour.transition) {
          const elapsed = performance.now() - tour.transition.startedAt
          const progress = tour.transition.duration ? Math.min(elapsed / tour.transition.duration, 1) : 1
          const eased = progress * progress * (3 - 2 * progress)
          camera.position.lerpVectors(tour.transition.fromPosition, new THREE.Vector3(...stop.position), eased)
          controls.target.lerpVectors(tour.transition.fromTarget, new THREE.Vector3(...stop.target), eased)
          publishTourState((progress * stop.transitionMs) / totalDuration)
          if (progress === 1) {
            tour.transition = null
            tour.arrivedAt = performance.now()
            publishTourState(stop.transitionMs / totalDuration, true)
          }
        } else if (tour.playing) {
          const holdElapsed = Math.max(0, performance.now() - tour.arrivedAt)
          publishTourState((stop.transitionMs + Math.min(holdElapsed, stop.holdMs)) / totalDuration)
          if (holdElapsed >= stop.holdMs) flyToTourStop(tour.index + 1, true)
        }
      }

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
        camera.position.lerpVectors(resetFromPosition, resetToPosition, eased)
        controls.target.lerpVectors(resetFromTarget, resetToTarget, eased)
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
      updateCampusBackdropCamera(scene, camera)
      qualityController.update()
      postProcessing.render()
    }
    frameId = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(frameId)
      observer.disconnect()
      renderer.domElement.removeEventListener('pointermove', handlePointerMove)
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave)
      renderer.domElement.removeEventListener('click', handleClick)
      controls.removeEventListener('start', handleControlsStart)
      controls.removeEventListener('end', handleControlsEnd)
      pointerPickScheduler.dispose()
      setBuildingHighlight(hovered, false)
      controls.dispose()
      inspectionLighting.dispose()
      materialControllerRef.current?.dispose()
      materialControllerRef.current = null
      park.dispose()
      postProcessing.dispose()
      environmentTarget.dispose()
      if (parkRef.current === park) parkRef.current = null
      if (lightingControllerRef.current?.scene === scene) lightingControllerRef.current = null
      scene.clear()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
      resetRef.current = () => {}
      focusFloorRef.current = () => false
      focusModeControllerRef.current = () => {}
      tourActionRef.current = { start: () => {}, toggle: () => {}, previous: () => {}, next: () => {}, stop: () => {} }
    }
  }, [containerRef, onHover, onSelect, reducedMotion])

  return {
    webglError,
    resetView,
    focusFloor,
    applyBuildingMaterial,
    resetBuildingMaterial,
    tourState,
    startTour,
    toggleTour,
    previousTourStop,
    nextTourStop,
    stopTour,
  }
}
