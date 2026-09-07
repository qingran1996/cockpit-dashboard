import assert from 'node:assert/strict'
import test from 'node:test'

test('publishes stabilized renderer telemetry at a bounded cadence', async () => {
  const module = await import('../src/scene/sceneTelemetry.js').catch(() => ({}))
  assert.equal(typeof module.createSceneTelemetrySampler, 'function')
  const sampler = module.createSceneTelemetrySampler({ publishIntervalMs: 500 })
  const renderer = {
    info: {
      render: { calls: 612, triangles: 3_318_910 },
      memory: { geometries: 555, textures: 35 },
    },
  }
  const runtime = { memory: { usedJSHeapSize: 512 * 1024 * 1024 } }

  assert.equal(sampler.sample(0, renderer, runtime), null)
  for (let frame = 1; frame < 30; frame += 1) sampler.sample(frame * (500 / 30), renderer, runtime)
  const result = sampler.sample(500, renderer, runtime)

  assert.equal(result.fps, 60)
  assert.equal(result.calls, 612)
  assert.equal(result.triangles, 3_318_910)
  assert.equal(result.geometries, 555)
  assert.equal(result.textures, 35)
  assert.equal(result.heapMb, 512)
})

test('reports unavailable heap memory without inventing a value', async () => {
  const { createSceneTelemetrySampler } = await import('../src/scene/sceneTelemetry.js')
  const sampler = createSceneTelemetrySampler({ publishIntervalMs: 100 })
  const renderer = { info: { render: { calls: 1, triangles: 12 }, memory: { geometries: 1, textures: 0 } } }
  sampler.sample(0, renderer, {})
  const result = sampler.sample(100, renderer, {})
  assert.equal(result.heapMb, null)
})
