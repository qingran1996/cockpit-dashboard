import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useIndustrialScene } from '../hooks/useIndustrialScene.js'
import { buildingById, buildingRegistry } from '../scene/buildingRegistry.js'
import { BuildingFloorPanel } from './BuildingFloorPanel.js'
import { TrafficDemoToggle } from './TrafficDemoToggle.js'
import { SunlightControl } from './SunlightControl.js'
import { AdvancedLightingPanel } from './AdvancedLightingPanel.js'
import { BuildingMaterialLab } from './BuildingMaterialLab.js'
import { DEFAULT_CAMPUS_LIGHTING_MODE } from '../scene/campusViewDefaults.js'
import { DEFAULT_CAMPUS_SUNLIGHT } from '../scene/campusSunlight.js'
import { CAMPUS_LIGHTING_PARAMETER_GROUPS } from '../scene/campusLightingProfiles.js'
import { createBuildingMaterialSettings, updateBuildingMaterialSettings } from '../scene/campusMaterialLab.js'

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

export function IndustrialScene({
  focusMode = false,
  activeEnergy = null,
  lightingMode = DEFAULT_CAMPUS_LIGHTING_MODE,
  onLightingModeChange = () => {},
  sunlightPercent = DEFAULT_CAMPUS_SUNLIGHT[lightingMode],
  onSunlightChange = () => {},
  lightingProfile,
  onLightingParameterChange = () => {},
  onResetLightingMode = () => {},
  onResetAllLighting = () => {},
}) {
  const canvasRef = useRef(null)
  const reducedMotion = useReducedMotion()
  const [hovered, setHovered] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [floorsExploded, setFloorsExploded] = useState(false)
  const [focusedFloorId, setFocusedFloorId] = useState(null)
  const [trafficEnabled, setTrafficEnabled] = useState(true)
  const [lightingPanelOpen, setLightingPanelOpen] = useState(false)
  const [lightingParameterGroup, setLightingParameterGroup] = useState('solar')
  const [materialLabOpen, setMaterialLabOpen] = useState(false)
  const [materialScope, setMaterialScope] = useState('facade')
  const [materialSettingsByBuilding, setMaterialSettingsByBuilding] = useState({})
  const materialSettingsRef = useRef({})

  useEffect(() => {
    if (!lightingPanelOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setLightingPanelOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [lightingPanelOpen])

  useEffect(() => {
    if (!materialLabOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMaterialLabOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [materialLabOpen])

  const handleHover = useCallback((buildingId, point) => {
    setHovered(buildingId && point ? { buildingId, point } : null)
  }, [])
  const handleSelect = useCallback((buildingId) => {
    setSelectedId(buildingId)
    setFloorsExploded(Boolean(buildingId))
    setFocusedFloorId(null)
    setMaterialLabOpen(false)
    setMaterialScope('facade')
  }, [])
  const floorView = useMemo(() => ({
    buildingId: selectedId,
    exploded: floorsExploded,
    focusedFloorId,
  }), [selectedId, floorsExploded, focusedFloorId])
  const { webglError, resetView, focusFloor, applyBuildingMaterial, resetBuildingMaterial } = useIndustrialScene({
    containerRef: canvasRef,
    onHover: handleHover,
    onSelect: handleSelect,
    reducedMotion,
    floorView,
    lightingMode,
    sunlightPercent,
    lightingProfile,
    trafficEnabled,
    focusMode,
    activeEnergy,
  })

  const selected = selectedId ? buildingById.get(selectedId) : null
  const selectedMaterialSettings = selected
    ? materialSettingsByBuilding[selected.id] ?? createBuildingMaterialSettings(selected)
    : null
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
    setMaterialLabOpen(false)
    handleSelect(null)
    resetView()
  }, [handleSelect, resetView])
  const handleReset = useCallback(() => {
    setMaterialLabOpen(false)
    handleSelect(null)
    resetView()
  }, [handleSelect, resetView])

  const handleOpenMaterialLab = useCallback(() => {
    if (!selected) return
    if (!materialSettingsRef.current[selected.id]) {
      const defaults = createBuildingMaterialSettings(selected)
      materialSettingsRef.current = { ...materialSettingsRef.current, [selected.id]: defaults }
      setMaterialSettingsByBuilding(materialSettingsRef.current)
    }
    setLightingPanelOpen(false)
    setMaterialLabOpen(true)
  }, [selected])

  const updateSelectedMaterial = useCallback((patch) => {
    if (!selected) return
    const current = materialSettingsRef.current[selected.id] ?? createBuildingMaterialSettings(selected)
    const next = updateBuildingMaterialSettings(current, materialScope, patch)
    materialSettingsRef.current = { ...materialSettingsRef.current, [selected.id]: next }
    setMaterialSettingsByBuilding(materialSettingsRef.current)
    applyBuildingMaterial(selected.id, materialScope, next[materialScope])
  }, [applyBuildingMaterial, materialScope, selected])

  const handleResetMaterial = useCallback(() => {
    if (!selected) return
    resetBuildingMaterial(selected.id, materialScope)
    const defaults = createBuildingMaterialSettings(selected)
    const current = materialSettingsRef.current[selected.id] ?? defaults
    const next = { ...current, [materialScope]: defaults[materialScope] }
    materialSettingsRef.current = { ...materialSettingsRef.current, [selected.id]: next }
    setMaterialSettingsByBuilding(materialSettingsRef.current)
  }, [materialScope, resetBuildingMaterial, selected])

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

      {selected && !materialLabOpen && (
        <BuildingFloorPanel
          building={selected}
          exploded={floorsExploded}
          focusedFloorId={focusedFloorId}
          onToggleExploded={handleToggleExploded}
          onSelectFloor={handleFloorSelect}
          onOpenMaterialLab={handleOpenMaterialLab}
          onClose={handleClose}
        />
      )}

      {selected && materialLabOpen && selectedMaterialSettings && (
        <BuildingMaterialLab
          building={selected}
          scope={materialScope}
          settings={selectedMaterialSettings[materialScope]}
          onScopeChange={setMaterialScope}
          onFamilyChange={(family) => updateSelectedMaterial({ family })}
          onParameterChange={(key, value) => updateSelectedMaterial({ [key]: value })}
          onReset={handleResetMaterial}
          onBack={() => setMaterialLabOpen(false)}
        />
      )}

      <div className="scene-controls-tip"><span>拖拽旋转</span><i />滚轮缩放</div>
      <TrafficDemoToggle active={trafficEnabled} onToggle={() => setTrafficEnabled((value) => !value)} />
      <SunlightControl
        value={sunlightPercent}
        mode={lightingMode}
        onChange={onSunlightChange}
        onModeChange={onLightingModeChange}
        advancedOpen={lightingPanelOpen}
        onAdvancedToggle={() => {
          setMaterialLabOpen(false)
          setLightingPanelOpen((value) => !value)
        }}
      />
      <AdvancedLightingPanel
        open={lightingPanelOpen}
        mode={lightingMode}
        profile={lightingProfile}
        groups={CAMPUS_LIGHTING_PARAMETER_GROUPS}
        activeGroup={lightingParameterGroup}
        onClose={() => setLightingPanelOpen(false)}
        onGroupChange={setLightingParameterGroup}
        onParameterChange={onLightingParameterChange}
        onResetMode={onResetLightingMode}
        onResetAll={onResetAllLighting}
      />
      <button type="button" className="scene-reset" onClick={handleReset}>复位视角</button>

      {webglError && (
        <div className="industrial-scene__fallback" role="status">
          <strong>3D 场景不可用</strong><span>请确认浏览器已启用 WebGL</span>
        </div>
      )}
    </section>
  )
}
