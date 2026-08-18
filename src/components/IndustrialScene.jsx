import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useIndustrialScene } from '../hooks/useIndustrialScene.js'
import { buildingById, buildingRegistry } from '../scene/buildingRegistry.js'
import { BuildingFloorPanel } from './BuildingFloorPanel.js'

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
  const [floorsExploded, setFloorsExploded] = useState(false)
  const [focusedFloorId, setFocusedFloorId] = useState(null)

  const handleHover = useCallback((buildingId, point) => {
    setHovered(buildingId && point ? { buildingId, point } : null)
  }, [])
  const handleSelect = useCallback((buildingId) => {
    setSelectedId(buildingId)
    setFloorsExploded(Boolean(buildingId))
    setFocusedFloorId(null)
  }, [])
  const floorView = useMemo(() => ({
    buildingId: selectedId,
    exploded: floorsExploded,
    focusedFloorId,
  }), [selectedId, floorsExploded, focusedFloorId])
  const { webglError, resetView, focusFloor } = useIndustrialScene({
    containerRef: canvasRef,
    onHover: handleHover,
    onSelect: handleSelect,
    reducedMotion,
    floorView,
  })

  const selected = selectedId ? buildingById.get(selectedId) : null
  const hoveredBuilding = hovered ? buildingById.get(hovered.buildingId) : null
  const handleToggleExploded = useCallback(() => {
    if (floorsExploded) {
      setFocusedFloorId(null)
      resetView()
    }
    setFloorsExploded((value) => !value)
  }, [floorsExploded, resetView])
  const handleFloorSelect = useCallback((floorId) => {
    if (!selectedId) return
    setFloorsExploded(true)
    setFocusedFloorId(floorId)
    focusFloor(selectedId, floorId)
  }, [focusFloor, selectedId])
  const handleClose = useCallback(() => {
    handleSelect(null)
    resetView()
  }, [handleSelect, resetView])
  const handleReset = useCallback(() => {
    handleSelect(null)
    resetView()
  }, [handleSelect, resetView])

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
        <BuildingFloorPanel
          building={selected}
          exploded={floorsExploded}
          focusedFloorId={focusedFloorId}
          onToggleExploded={handleToggleExploded}
          onSelectFloor={handleFloorSelect}
          onClose={handleClose}
        />
      )}

      <div className="scene-controls-tip"><span>拖拽旋转</span><i />滚轮缩放</div>
      <button type="button" className="scene-reset" onClick={handleReset}>复位视角</button>

      {webglError && (
        <div className="industrial-scene__fallback" role="status">
          <strong>3D 场景不可用</strong><span>请确认浏览器已启用 WebGL</span>
        </div>
      )}
    </section>
  )
}
