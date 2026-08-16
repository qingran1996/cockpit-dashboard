import { useCallback, useEffect, useRef, useState } from 'react'
import { useIndustrialScene } from '../hooks/useIndustrialScene.js'
import { factoryCampusById, factoryCampusRegistry } from '../scene/factoryCampusRegistry.js'
import '../styles/industrialSceneControls.css'

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
  const { webglError, resetView, viewMode, pointerLocked, toggleFirstPerson } = useIndustrialScene({
    containerRef: canvasRef,
    onHover: handleHover,
    onSelect: handleSelect,
    reducedMotion,
  })

  const selected = selectedId ? factoryCampusById.get(selectedId) : null
  const hoveredBuilding = hovered ? factoryCampusById.get(hovered.buildingId) : null

  return (
    <section className="industrial-scene" data-building-count={factoryCampusRegistry.length} data-view-mode={viewMode} data-pointer-locked={pointerLocked} aria-label="交互式三维工业园区">
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

      {viewMode === 'first-person' && <div className="scene-immersion-vignette" aria-hidden="true" />}
      {viewMode === 'first-person' && pointerLocked && <div className="scene-walk-reticle" aria-hidden="true" />}
      <div className="scene-controls-tip">
        {viewMode === 'first-person'
          ? pointerLocked
            ? <><span>WASD 人物行走</span><i />鼠标转向 · Shift 奔跑 · Esc 释放鼠标</>
            : <><span>点击场景进入沉浸漫游</span><i />WASD 人物行走</>
          : <><span>点击建筑查看近景</span><i />拖拽旋转 · 滚轮缩放</>}
      </div>
      <div className="scene-view-actions">
        <button
          type="button"
          className={`scene-first-person${viewMode === 'first-person' ? ' is-active' : ''}`}
          onClick={toggleFirstPerson}
          aria-pressed={viewMode === 'first-person'}
        >
          {viewMode === 'first-person' ? '退出漫游' : '第一人称'}
        </button>
        <button type="button" className="scene-reset" onClick={resetView}>复位视角</button>
      </div>

      {webglError && (
        <div className="industrial-scene__fallback" role="status">
          <strong>3D 场景不可用</strong><span>请确认浏览器已启用 WebGL</span>
        </div>
      )}
    </section>
  )
}
