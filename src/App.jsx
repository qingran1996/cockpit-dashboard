import { useEffect, useState } from 'react'
import { BottomMetrics } from './components/BottomMetrics.js'
import { CampusEnergyPulse } from './components/CampusEnergyPulse.js'
import { CampusFocusToggle } from './components/CampusFocusToggle.js'
import { DashboardHeader } from './components/DashboardHeader.jsx'
import { EnergyDetailSidecar } from './components/EnergyDetailSidecar.js'
import { IndustrialScene } from './components/IndustrialScene.jsx'
import { PowerPanel } from './components/PowerPanel.jsx'
import { SideRail } from './components/SideRail.jsx'
import { SteamPanel } from './components/SteamPanel.jsx'
import { WaterPanel } from './components/WaterPanel.jsx'
import { UnityViewport } from './components/UnityViewport.js'
import { APP_SURFACES } from './appSurface.js'
import { chartOptions, dashboardData, energyDetailData } from './data/dashboard.js'
import { resolveDashboardPresentation } from './dashboardPresentation.js'
import { resolveEnergyDetail } from './energyDetailState.js'
import { resolveEnergyDetailWorkspaceLayout } from './energyDetailWorkspaceLayout.js'
import { resolveHomepageSceneControlsLayout } from './homepagePanelLayout.js'
import { useViewportScale } from './hooks/useViewportScale.js'
import { DEFAULT_CAMPUS_LIGHTING_MODE, resolveCampusFocusViewport } from './scene/campusViewDefaults.js'
import { DEFAULT_CAMPUS_SUNLIGHT, resolveCampusSunlight, updateCampusSunlight } from './scene/campusSunlight.js'
import { createCampusLightingProfiles, resetCampusLightingProfile, resolveCampusLightingProfile, updateCampusLightingProfile } from './scene/campusLightingProfiles.js'

const detailWorkspaceLayout = resolveEnergyDetailWorkspaceLayout()
const homepageSceneControlsLayout = resolveHomepageSceneControlsLayout()
const detailOriginTop = 118

export default function App({ surfaceMode = APP_SURFACES.campus }) {
  const { scale, left, top, viewportWidth, viewportHeight } = useViewportScale()
  const [campusFocus, setCampusFocus] = useState(false)
  const [energyDetail, setEnergyDetail] = useState(null)
  const [campusLightingMode, setCampusLightingMode] = useState(DEFAULT_CAMPUS_LIGHTING_MODE)
  const [campusSunlight, setCampusSunlight] = useState(() => ({ ...DEFAULT_CAMPUS_SUNLIGHT }))
  const [campusLightingProfiles, setCampusLightingProfiles] = useState(createCampusLightingProfiles)

  const dispatchEnergyDetail = (action) => {
    setEnergyDetail((current) => resolveEnergyDetail(current, action))
  }

  const openEnergyDetail = (resource) => {
    setCampusFocus(false)
    dispatchEnergyDetail({ type: 'open', resource })
  }

  useEffect(() => {
    if (!energyDetail) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') dispatchEnergyDetail({ type: 'escape' })
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [energyDetail])

  const activeEnergyDetail = energyDetail ? energyDetailData[energyDetail.resource] : null
  const presentation = resolveDashboardPresentation(campusFocus, energyDetail)
  const activeSunlight = resolveCampusSunlight(campusSunlight, campusLightingMode)
  const activeLightingProfile = resolveCampusLightingProfile(campusLightingProfiles, campusLightingMode)

  const resetCurrentLightingMode = () => {
    setCampusLightingProfiles((current) => resetCampusLightingProfile(current, campusLightingMode))
    setCampusSunlight((current) => updateCampusSunlight(current, campusLightingMode, DEFAULT_CAMPUS_SUNLIGHT[campusLightingMode]))
  }

  const resetAllLighting = () => {
    setCampusLightingProfiles(createCampusLightingProfiles())
    setCampusSunlight({ ...DEFAULT_CAMPUS_SUNLIGHT })
  }

  const unityOverlay = surfaceMode === APP_SURFACES.unityOverlay
  const focusViewport = resolveCampusFocusViewport(viewportWidth, viewportHeight)

  return (
    <main className={`dashboard-shell${campusFocus ? ' is-campus-focus' : ''}${unityOverlay ? ' is-unity-overlay' : ''}`}>
      <div className="ambient ambient--one" /><div className="ambient ambient--two" />
      <SideRail side="left" gap={left} />
      <SideRail side="right" gap={left} />
      <div
        className={`dashboard-canvas${campusFocus ? ' is-campus-focus' : ''}${presentation.hasEnergyDetailClass ? ' is-energy-detail-open' : ''}${unityOverlay ? ' is-unity-overlay' : ''}`}
        style={{
          transform: `translate(${left}px, ${top}px) scale(${scale})`,
          '--energy-detail-scene-height': `${detailWorkspaceLayout.scene.height}px`,
          '--energy-detail-tabs-top': `${detailWorkspaceLayout.tabs.top - detailOriginTop}px`,
          '--energy-detail-metrics-top': `${detailWorkspaceLayout.metrics.top - detailOriginTop}px`,
          '--energy-detail-diagnostics-top': `${detailWorkspaceLayout.diagnostics.top - detailOriginTop}px`,
          '--energy-detail-side-top': `${detailWorkspaceLayout.leftZone.top - detailOriginTop}px`,
          '--energy-detail-side-height': `${detailWorkspaceLayout.leftZone.height}px`,
          '--energy-detail-backdrop-width': `${detailWorkspaceLayout.centerBackdrop.widthPercent}%`,
          '--energy-detail-backdrop-height': `${detailWorkspaceLayout.centerBackdrop.height}px`,
          '--energy-detail-lighting-right': `${detailWorkspaceLayout.sceneControls.lightingRight}px`,
          '--energy-detail-lighting-bottom': `${detailWorkspaceLayout.sceneControls.lightingBottom}px`,
          '--energy-detail-reset-right': `${detailWorkspaceLayout.sceneControls.resetRight}px`,
          '--energy-detail-reset-bottom': `${detailWorkspaceLayout.sceneControls.resetBottom}px`,
          '--energy-detail-traffic-right': `${detailWorkspaceLayout.sceneControls.trafficRight}px`,
          '--energy-detail-traffic-bottom': `${detailWorkspaceLayout.sceneControls.trafficBottom}px`,
          '--energy-detail-hint-left': `${detailWorkspaceLayout.sceneControls.hintLeft}px`,
          '--energy-detail-hint-bottom': `${detailWorkspaceLayout.sceneControls.hintBottom}px`,
          '--homepage-lighting-right': `${homepageSceneControlsLayout.lightingRight}px`,
          '--homepage-lighting-bottom': `${homepageSceneControlsLayout.lightingBottom}px`,
          '--homepage-reset-right': `${homepageSceneControlsLayout.resetRight}px`,
          '--homepage-reset-bottom': `${homepageSceneControlsLayout.resetBottom}px`,
          '--homepage-traffic-right': `${homepageSceneControlsLayout.trafficRight}px`,
          '--homepage-traffic-bottom': `${homepageSceneControlsLayout.trafficBottom}px`,
          '--homepage-hint-left': `${homepageSceneControlsLayout.hintLeft}px`,
          '--homepage-hint-bottom': `${homepageSceneControlsLayout.hintBottom}px`,
          '--campus-focus-left': `${focusViewport.scene.left}px`,
          '--campus-focus-top': `${focusViewport.scene.top}px`,
          '--campus-focus-width': `${focusViewport.scene.width}px`,
          '--campus-focus-height': `${focusViewport.scene.height}px`,
          '--campus-focus-control-top': `${focusViewport.controls.top}px`,
          '--campus-focus-control-right': `${focusViewport.controls.right}px`,
          '--energy-detail-footer-top': `${detailWorkspaceLayout.footer.top - detailOriginTop}px`,
          '--energy-detail-footer-height': `${detailWorkspaceLayout.footer.height}px`,
          '--energy-detail-workspace-height': `${detailWorkspaceLayout.footer.bottom - detailOriginTop}px`,
        }}
      >
        <DashboardHeader lightingMode={campusLightingMode} />
        <CampusEnergyPulse />
        <WaterPanel data={dashboardData.water} chartOption={chartOptions.waterUsage} onOpenDetails={() => openEnergyDetail('water')} />
        {unityOverlay ? (
          <UnityViewport />
        ) : (
          <IndustrialScene
            focusMode={campusFocus}
            lightingMode={campusLightingMode}
            onLightingModeChange={setCampusLightingMode}
            sunlightPercent={activeSunlight}
            onSunlightChange={(value) => setCampusSunlight((current) => updateCampusSunlight(current, campusLightingMode, value))}
            lightingProfile={activeLightingProfile}
            onLightingParameterChange={(key, value) => setCampusLightingProfiles((current) => updateCampusLightingProfile(current, campusLightingMode, key, value))}
            onResetLightingMode={resetCurrentLightingMode}
            onResetAllLighting={resetAllLighting}
          />
        )}
        <SteamPanel data={dashboardData.steam} chartOption={chartOptions.steamFlow} onOpenDetails={() => openEnergyDetail('steam')} />
        <PowerPanel data={dashboardData.power} chartOption={chartOptions.powerLoad} onOpenDetails={() => openEnergyDetail('power')} />
        <BottomMetrics metrics={dashboardData.bottomMetrics} onMetricClick={openEnergyDetail} />
        {activeEnergyDetail && presentation.showEnergyDetail && (
          <EnergyDetailSidecar
            resource={energyDetail.resource}
            detail={activeEnergyDetail}
            activeTab={energyDetail.tab}
            onTabChange={(tab) => dispatchEnergyDetail({ type: 'tab', tab })}
            onResourceChange={openEnergyDetail}
            onClose={() => dispatchEnergyDetail({ type: 'close' })}
          />
        )}
        {!unityOverlay && <CampusFocusToggle active={campusFocus} onToggle={() => setCampusFocus((value) => !value)} />}
      </div>
    </main>
  )
}
