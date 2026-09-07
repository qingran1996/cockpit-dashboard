import * as THREE from 'three'

function directional(color, intensity, position, name) {
  const light = new THREE.DirectionalLight(color, intensity)
  light.name = name
  light.position.set(...position)
  return light
}

export function createRotaryKilnLighting(scene) {
  const hemisphere = new THREE.HemisphereLight(0xdff7ff, 0x101820, 1.8)
  hemisphere.name = 'Kiln_SkyFill'

  const ambient = new THREE.AmbientLight(0xd8eff7, .55)
  ambient.name = 'Kiln_AmbientLift'

  const key = directional(0xffead4, 4.2, [-5, 8, 7], 'Kiln_WarmKey')
  const fill = directional(0xbdefff, 1.7, [6, 4, 8], 'Kiln_FrontFill')
  const rim = directional(0x35d9ff, 3.2, [7, 5, -7], 'Kiln_CyanRim')
  const groundBounce = directional(0xff8a52, .8, [-3, -4, 4], 'Kiln_WarmGroundBounce')

  scene.add(hemisphere, ambient, key, fill, rim, groundBounce)
  return { hemisphere, ambient, key, fill, rim, groundBounce }
}
