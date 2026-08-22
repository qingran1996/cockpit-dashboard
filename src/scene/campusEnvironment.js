import * as THREE from 'three'

export function deriveCampusEnvironmentPolicy(mode) {
  return mode === 'evening'
    ? { intensity: .38, rotation: -.08 }
    : { intensity: .78, rotation: .12 }
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
  }
  return environmentMap
}
