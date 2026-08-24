import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'

function mesh(name, geometry, material, position, userData = {}) {
  const object = new THREE.Mesh(geometry, material)
  object.name = name
  object.position.fromArray(position)
  object.userData = { ...userData }
  return object
}

function meshChildren(parent) {
  return parent.children.filter((object) => object.isMesh)
}

test('instances repeated opaque static siblings while preserving every local transform', async () => {
  const { optimizeCampusStaticInstances } = await import('../src/scene/campusStaticInstancing.js')
  const root = new THREE.Group()
  const facade = new THREE.Group()
  root.add(facade)
  const geometry = new THREE.BoxGeometry(1, 2, 1)
  const material = new THREE.MeshStandardMaterial({ color: 0xf4f5f2, roughness: .72 })
  facade.add(
    mesh('FACADE__panel-01', geometry, material, [1, 2, 3], { detailTier: 'micro', visibilityTier: 'near' }),
    mesh('FACADE__panel-02', geometry, material, [-4, 5, 6], { detailTier: 'micro', visibilityTier: 'near' }),
    mesh('FACADE__panel-03', geometry, material, [7, 8, -9], { detailTier: 'micro', visibilityTier: 'near' }),
  )

  const stats = optimizeCampusStaticInstances(root)
  const [batch] = meshChildren(facade)
  assert.equal(meshChildren(facade).length, 1)
  assert.equal(batch.isInstancedMesh, true)
  assert.equal(batch.count, 3)
  assert.equal(batch.geometry, geometry)
  assert.equal(batch.material, material)
  assert.equal(batch.userData.detailTier, 'micro')
  assert.equal(batch.userData.visibilityTier, 'near')

  const matrix = new THREE.Matrix4()
  const positions = []
  for (let index = 0; index < batch.count; index += 1) {
    batch.getMatrixAt(index, matrix)
    positions.push(new THREE.Vector3().setFromMatrixPosition(matrix).toArray())
  }
  assert.deepEqual(positions, [[1, 2, 3], [-4, 5, 6], [7, 8, -9]])
  assert.deepEqual(stats, {
    sourceMeshes: 3,
    instancedMeshes: 1,
    instancedObjects: 3,
    drawCallsSaved: 2,
  })
})

test('keeps parent visibility and floor transforms isolated by batching siblings only', async () => {
  const { optimizeCampusStaticInstances } = await import('../src/scene/campusStaticInstancing.js')
  const root = new THREE.Group()
  const floorOne = new THREE.Group()
  const floorTwo = new THREE.Group()
  floorOne.name = 'FLOOR__factory__L01'
  floorTwo.name = 'FLOOR__factory__L02'
  floorTwo.position.y = 4
  root.add(floorOne, floorTwo)
  const geometry = new THREE.BoxGeometry()
  const material = new THREE.MeshStandardMaterial()
  floorOne.add(mesh('PROP__desk-01', geometry, material, [0, 0, 0]))
  floorTwo.add(mesh('PROP__desk-02', geometry, material, [0, 0, 0]))

  const stats = optimizeCampusStaticInstances(root)

  assert.notEqual(meshChildren(floorOne)[0].isInstancedMesh, true)
  assert.notEqual(meshChildren(floorTwo)[0].isInstancedMesh, true)
  assert.equal(stats.drawCallsSaved, 0)
})

test('excludes animated, transparent, transmission, and semantically incompatible meshes', async () => {
  const { optimizeCampusStaticInstances } = await import('../src/scene/campusStaticInstancing.js')
  const root = new THREE.Group()
  const geometry = new THREE.BoxGeometry()

  const animated = new THREE.Group()
  animated.userData.motionPath = 'site-patrol'
  const opaque = new THREE.MeshStandardMaterial()
  animated.add(mesh('PROP__animated-01', geometry, opaque, [0, 0, 0]), mesh('PROP__animated-02', geometry, opaque, [2, 0, 0]))

  const glass = new THREE.Group()
  const transparent = new THREE.MeshStandardMaterial({ transparent: true, opacity: .5 })
  glass.add(mesh('FACADE__glass-01', geometry, transparent, [0, 0, 0]), mesh('FACADE__glass-02', geometry, transparent, [2, 0, 0]))

  const glazing = new THREE.Group()
  const transmission = new THREE.MeshPhysicalMaterial({ transmission: .8 })
  glazing.add(mesh('FACADE__glazing-01', geometry, transmission, [0, 0, 0]), mesh('FACADE__glazing-02', geometry, transmission, [2, 0, 0]))

  const mixedDetail = new THREE.Group()
  mixedDetail.add(
    mesh('TREE__branch-01', geometry, opaque, [0, 0, 0], { vegetationDetail: 'branch-structure' }),
    mesh('TREE__branch-02', geometry, opaque, [2, 0, 0], { vegetationDetail: 'canopy' }),
  )
  root.add(animated, glass, glazing, mixedDetail)

  const stats = optimizeCampusStaticInstances(root)

  assert.equal(stats.drawCallsSaved, 0)
  for (const group of [animated, glass, glazing, mixedDetail]) {
    assert.equal(meshChildren(group).length, 2)
    assert.equal(meshChildren(group).some((object) => object.isInstancedMesh), false)
  }
})
