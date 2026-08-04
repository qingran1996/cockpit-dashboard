import { useCallback, useEffect, useRef, useState } from 'react'
import { useIndustrialScene } from '../hooks/useIndustrialScene.js'
import { buildingById, buildingRegistry } from '../scene/buildingRegistry.js'

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reduced
}

export function IndustrialScene() {
  const canvasRef = useRef(null)
  const reducedMotion = useReducedMotion()
  const [hovered, setHovered] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const handleHover = useCallback((buildingId, point) => {
    setHovered(buildingId && point ? { buildingId, point } : null)
  }, [])
  const handleSelect = useCallback((buildingId) => setSelectedId(buildingId), [])
  const { webglError, resetView } = useIndustrialScene({
    containerRef: canvasRef,
    onHover: handleHover,
    onSelect: handleSelect,
    reducedMotion,
  })

  const selected = selectedId ? buildingById.get(selectedId) : null
  const hoveredBuilding = hovered ? buildingById.get(hovered.buildingId) : null

  return (
    <section className="industrial-scene" data-building-count={buildingRegistry.length} aria-label="交互式三维工业园区">
      <div ref={canvasRef} className="industrial-scene__canvas" />
      <div className="industrial-scene__vignette" />
      <div className="industrial-scene__scanline" />

      {hoveredBuilding && (
        <div className="scene-tooltip" style={{ left: hovered.point.x, top: hovered.point.y }}>
          <b>{hoveredBuilding.name}</b><span>{hoveredBuilding.type}</span>
        </div>
      )}

      {selected && (
        <aside className="scene-detail" aria-live="polite">
          <button type="button" className="scene-detail__close" onClick={() => setSelectedId(null)} aria-label="关闭设备详情">×</button>
          <span className="scene-detail__eyebrow">FACILITY / {selected.id.toUpperCase()}</span>
          <h3>{selected.name}</h3>
          <p>{selected.type}</p>
          <dl>
            <div><dt>{selected.metricLabel}</dt><dd>{selected.metricValue}</dd></div>
            <div><dt>设备温度</dt><dd>{selected.temperature}</dd></div>
            <div><dt>运行状态</dt><dd className="is-normal"><i />{selected.status}</dd></div>
          </dl>
        </aside>
      )}

      <div className="scene-controls-tip"><span>拖拽旋转</span><i />滚轮缩放</div>
      <button type="button" className="scene-reset" onClick={resetView}>复位视角</button>

      {webglError && (
        <div className="industrial-scene__fallback" role="status">
          <strong>3D 场景不可用</strong><span>请确认浏览器已启用 WebGL</span>
        </div>
      )}
    </section>
  )
}
