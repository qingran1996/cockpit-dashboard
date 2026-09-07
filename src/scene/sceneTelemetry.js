function round(value, digits = 1) {
  const scale = 10 ** digits
  return Math.round(value * scale) / scale
}

export function createSceneTelemetrySampler({ publishIntervalMs = 500 } = {}) {
  let windowStartedAt = null
  let frames = 0
  return {
    sample(time, renderer, runtime = globalThis.performance) {
      if (windowStartedAt === null) {
        windowStartedAt = time
        return null
      }
      frames += 1
      const elapsed = time - windowStartedAt
      if (elapsed < publishIntervalMs) return null
      const render = renderer.info?.render ?? {}
      const memory = renderer.info?.memory ?? {}
      const usedHeap = runtime?.memory?.usedJSHeapSize
      const result = {
        fps: round((frames * 1000) / Math.max(1, elapsed)),
        calls: Number(render.calls) || 0,
        triangles: Math.round(Number(render.triangles) || 0),
        geometries: Number(memory.geometries) || 0,
        textures: Number(memory.textures) || 0,
        heapMb: Number.isFinite(usedHeap) ? Math.round(usedHeap / 1048576) : null,
      }
      windowStartedAt = time
      frames = 0
      return result
    },
  }
}
