import * as THREE from 'three'

export function deriveCampusEnvironmentPolicy(mode) {
  return mode === 'evening'
    ? { intensity: .38, rotation: -.08 }
    : { intensity: .78, rotation: .12 }
}

export function deriveCampusLandscapePolicy(mode) {
  return mode === 'evening'
    ? { horizonLift: .1, groundSeparation: .12, vegetationLift: .08 }
    : { horizonLift: .18, groundSeparation: .16, vegetationLift: .1 }
}

export function installCampusEnvironment(scene, environmentMap, mode = 'day') {
  const policy = deriveCampusEnvironmentPolicy(mode)
  environmentMap.mapping = THREE.CubeUVReflectionMapping
  scene.environment = environmentMap
  scene.environmentIntensity = policy.intensity
  if (scene.environmentRotation) scene.environmentRotation.y = policy.rotation
  scene.userData.campusEnvironment = {
    source: 'pmrem',
    textureUuid: environmentMap.uuid,
    landscape: deriveCampusLandscapePolicy(mode),
  }
  return environmentMap
}
