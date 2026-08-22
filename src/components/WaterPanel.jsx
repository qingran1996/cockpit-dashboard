import { EChart } from './EChart.jsx'
import { EnergyDetailEntryButton } from './EnergyDetailEntryButton.js'
import { WaterTelemetry } from './HomepageTelemetry.js'
import { TechPanel } from './TechPanel.jsx'

export function WaterPanel({ data, chartOption, onOpenDetails }) {
  return (
    <TechPanel
      title="水资源监控"
      className="water-panel"
      action={<EnergyDetailEntryButton resource="water" title="水资源" onOpen={onOpenDetails} />}
    >
      <WaterTelemetry
        data={data}
        chart={<EChart option={chartOption} className="water-chart" ariaLabel="24小时用水流量对比曲线图" />}
      />
    </TechPanel>
  )
}
