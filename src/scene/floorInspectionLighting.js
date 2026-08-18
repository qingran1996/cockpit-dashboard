import * as THREE from 'three'

const INSPECTION_OFFSET = new THREE.Vector3(0, .65, 0)

export function createFloorInspectionLighting() {
  const group = new THREE.Group()
  group.name = 'LIGHTING__floor-inspection'
  group.visible = false

  const key = new THREE.PointLight(0xffd7a0, 0, 8, 2)
  key.name = 'LIGHTING__floor-inspection__warm-key'
  const fill = new THREE.PointLight(0x7adfff, 0, 10, 2)
  fill.name = 'LIGHTING__floor-inspection__cool-fill'
  fill.position.set(-.8, -.3, .8)
  group.add(key, fill)

  return {
    group,
    key,
    fill,
    update(position, active) {
      group.visible = active
      group.position.fromArray(position ?? [0, 0, 0]).add(INSPECTION_OFFSET)
      key.intensity = active ? 2.2 : 0
      fill.intensity = active ? .65 : 0
    },
    dispose() {
      group.remove(key, fill)
    },
  }
}
