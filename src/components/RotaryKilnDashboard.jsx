import { EChart } from './EChart.jsx'
import { RotaryKilnDashboard as RotaryKilnDashboardView } from './RotaryKilnDashboard.js'
import { energyTrendOption, temperatureTrendOption } from '../data/rotaryKilnData.js'
import { useViewportScale } from '../hooks/useViewportScale.js'
import { RotaryKilnModel } from './RotaryKilnModel.jsx'

export function RotaryKilnDashboardPage() {
  const viewport = useViewportScale()

  return (
    <div className="rotary-kiln-page">
      <div
        className="rotary-kiln-stage"
        style={{ transform: `translate(${viewport.left}px, ${viewport.top}px) scale(${viewport.scale})` }}
      >
        <RotaryKilnDashboardView
          ChartComponent={EChart}
          ModelComponent={RotaryKilnModel}
          temperatureOption={temperatureTrendOption}
          energyOption={energyTrendOption}
        />
      </div>
    </div>
  )
}
