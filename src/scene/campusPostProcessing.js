import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'

export function renderFrameWithAccumulatedStats(renderer, renderFrame) {
  const previousAutoReset = renderer.info.autoReset
  renderer.info.autoReset = false
  renderer.info.reset()
  try {
    renderFrame()
  } finally {
    renderer.info.autoReset = previousAutoReset
  }
}

export function resolveBloomBufferSize(width, height) {
  return {
    width: Math.max(1, Math.floor(width * .25)),
    height: Math.max(1, Math.floor(height * .25)),
  }
}

export function resolvePostProcessingAvailability({ profile = 'campus', focused = false, qualityAllows = true } = {}) {
  return Boolean(qualityAllows && !(profile === 'plant-v068' && focused))
}

export function deriveCampusPostProcessingPolicy({ mode = 'day', reducedMotion = false, pixelRatio = 1, webgl2 = true, bloomStrength, focused = false, profile = 'campus' } = {}) {
  if (reducedMotion) {
    return {
      enabled: false,
      contact: { enabled: false, radius: 0, intensity: 0 },
      bloom: { enabled: false, threshold: 1.08, strength: 0, radius: 0 },
      antialias: 'native',
      renderScale: 1,
    }
  }
  if (!webgl2) {
    return {
      enabled: true,
      contact: { enabled: false, radius: 0, intensity: 0 },
      bloom: { enabled: false, threshold: 2.2, strength: 0, radius: 0 },
      antialias: 'fxaa',
      renderScale: focused && pixelRatio < 1.5 ? 1.35 : pixelRatio < 1.25 ? 1.2 : 1,
    }
  }
  if (profile === 'plant-v068') {
    return {
      enabled: true,
      contact: { enabled: false, radius: 0, intensity: 0 },
      bloom: { enabled: true, threshold: 1.15, strength: .18, radius: .32 },
      antialias: 'smaa',
      renderScale: 1,
    }
  }
  return {
    enabled: true,
    contact: { enabled: true, radius: pixelRatio > 1.5 ? 2.1 : 2.6, intensity: mode === 'evening' ? .36 : .31 },
    bloom: { enabled: true, threshold: 2.35, strength: THREE.MathUtils.clamp(bloomStrength ?? (mode === 'evening' ? .28 : .08), 0, .6), radius: mode === 'evening' ? .22 : .1 },
    antialias: 'smaa',
    renderScale: focused && pixelRatio < 1.5 ? 1.25 : 1,
  }
}

export function configureCampusRenderer(renderer, { exposure = 1.42 } = {}) {
  const boundedExposure = THREE.MathUtils.clamp(exposure, .85, 1.55)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = boundedExposure
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  return { exposure: boundedExposure }
}

export function applyCampusQualityToPostProcessingPolicy(policy, quality) {
  if (quality?.postProcessing !== false) return policy
  return {
    ...policy,
    enabled: false,
    contact: { ...policy.contact, enabled: false },
    bloom: { ...policy.bloom, enabled: false },
    antialias: 'native',
  }
}

export function createCampusPostProcessing({ renderer, scene, camera, mode = 'day', reducedMotion = false, pixelRatio = 1, focused = false, profile = 'campus' }) {
  const webgl2 = Boolean(renderer.capabilities?.isWebGL2)
  let currentPixelRatio = pixelRatio
  let currentMode = mode
  let currentLightingState = {}
  let currentFocused = focused
  const derivePolicy = () => deriveCampusPostProcessingPolicy({
    mode: currentMode,
    reducedMotion,
    pixelRatio: currentPixelRatio,
    webgl2,
    bloomStrength: currentLightingState.bloomStrength,
    focused: currentFocused,
    profile,
  })
  let basePolicy = derivePolicy()
  if (!basePolicy.enabled) {
    return {
      enabled: false,
      render: () => renderer.render(scene, camera),
      setSize: () => {},
      setMode: () => {},
      setFocusMode: () => {},
      setPixelRatio: () => {},
      setQuality: () => {},
      dispose: () => {},
    }
  }

  let policy = basePolicy
  let qualityAllowsPostProcessing = true
  const mergeAvailability = (nextPolicy) => applyCampusQualityToPostProcessingPolicy(nextPolicy, {
    postProcessing: resolvePostProcessingAvailability({ profile, focused: currentFocused, qualityAllows: qualityAllowsPostProcessing }),
  })

  const composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(scene, camera)
  const contactPass = new SSAOPass(scene, camera, 1, 1)
  contactPass.kernelRadius = policy.contact.radius
  contactPass.minDistance = .002
  contactPass.maxDistance = .025 + policy.contact.intensity * .035
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(1, 1),
    policy.bloom.strength,
    policy.bloom.radius,
    policy.bloom.threshold,
  )
  const smaaPass = new SMAAPass(1, 1)
  const fxaaPass = new ShaderPass(FXAAShader)
  const outputPass = new OutputPass()
  composer.addPass(renderPass)
  composer.addPass(contactPass)
  composer.addPass(bloomPass)
  composer.addPass(smaaPass)
  composer.addPass(fxaaPass)
  composer.addPass(outputPass)
  let viewportWidth = 1
  let viewportHeight = 1

  const resizeTargets = () => {
    const scaledWidth = Math.max(1, Math.floor(viewportWidth * policy.renderScale))
    const scaledHeight = Math.max(1, Math.floor(viewportHeight * policy.renderScale))
    const physicalWidth = Math.max(1, scaledWidth * currentPixelRatio)
    const physicalHeight = Math.max(1, scaledHeight * currentPixelRatio)
    composer.setSize(scaledWidth, scaledHeight)
    const bloomSize = resolveBloomBufferSize(scaledWidth, scaledHeight)
    bloomPass.setSize(bloomSize.width, bloomSize.height)
    smaaPass.setSize(physicalWidth, physicalHeight)
    fxaaPass.uniforms.resolution.value.set(1 / physicalWidth, 1 / physicalHeight)
  }

  const applyPolicy = (nextPolicy) => {
    policy = nextPolicy
    contactPass.enabled = policy.enabled && policy.contact.enabled
    contactPass.kernelRadius = policy.contact.radius
    contactPass.maxDistance = .025 + policy.contact.intensity * .035
    bloomPass.enabled = policy.enabled && policy.bloom.enabled
    bloomPass.threshold = policy.bloom.threshold
    bloomPass.strength = policy.bloom.strength
    bloomPass.radius = policy.bloom.radius
    smaaPass.enabled = policy.enabled && policy.antialias === 'smaa'
    fxaaPass.enabled = policy.enabled && policy.antialias === 'fxaa'
    resizeTargets()
  }

  applyPolicy(mergeAvailability(policy))

  return {
    enabled: true,
    render: () => renderFrameWithAccumulatedStats(renderer, () => composer.render()),
    setSize: (width, height) => {
      viewportWidth = width
      viewportHeight = height
      resizeTargets()
    },
    setMode: (nextMode, lightingState = {}) => {
      currentMode = nextMode
      currentLightingState = lightingState
      basePolicy = derivePolicy()
      applyPolicy(mergeAvailability(basePolicy))
    },
    setFocusMode: (nextFocused) => {
      currentFocused = Boolean(nextFocused)
      basePolicy = derivePolicy()
      applyPolicy(mergeAvailability(basePolicy))
    },
    setPixelRatio: (nextPixelRatio) => {
      currentPixelRatio = Math.max(1, Number(nextPixelRatio) || 1)
      basePolicy = derivePolicy()
      applyPolicy(mergeAvailability(basePolicy))
    },
    setQuality: (quality) => {
      qualityAllowsPostProcessing = quality.postProcessing
      applyPolicy(mergeAvailability(basePolicy))
    },
    dispose: () => {
      for (const pass of [contactPass, bloomPass, smaaPass, fxaaPass, outputPass]) pass.dispose?.()
      composer.dispose()
    },
  }
}
