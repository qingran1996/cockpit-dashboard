import { BottomMetrics } from './components/BottomMetrics.jsx'
import { DashboardHeader } from './components/DashboardHeader.jsx'
import { IndustrialHero } from './components/IndustrialHero.jsx'
import { PowerPanel } from './components/PowerPanel.jsx'
import { SteamPanel } from './components/SteamPanel.jsx'
import { WaterPanel } from './components/WaterPanel.jsx'
import { chartOptions, dashboardData } from './data/dashboard.js'
import { useViewportScale } from './hooks/useViewportScale.js'

export default function App() {
  const { scale, left, top } = useViewportScale()

  return (
    <main className="dashboard-shell">
      <div className="ambient ambient--one" /><div className="ambient ambient--two" />
      <div
        className="dashboard-canvas"
        style={{ transform: `translate(${left}px, ${top}px) scale(${scale})` }}
      >
        <DashboardHeader />
        <WaterPanel data={dashboardData.water} chartOption={chartOptions.waterUsage} />
        <IndustrialHero />
        <SteamPanel data={dashboardData.steam} chartOption={chartOptions.steamFlow} />
        <PowerPanel data={dashboardData.power} chartOption={chartOptions.powerLoad} />
        <BottomMetrics metrics={dashboardData.bottomMetrics} />
      </div>
    </main>
  )
}
