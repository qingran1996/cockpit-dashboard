import { EChart } from './EChart.jsx'
import { EnergyDetailEntryButton } from './EnergyDetailEntryButton.js'
import { PowerTelemetry } from './HomepageTelemetry.js'
import { TechPanel } from './TechPanel.jsx'

export function PowerPanel({ data, chartOption, onOpenDetails }) {
  return (
    <TechPanel
      title="电力资源监控"
      className="power-panel"
      action={<EnergyDetailEntryButton resource="power" title="电力资源" onOpen={onOpenDetails} />}
    >
      <PowerTelemetry
        data={data}
        chart={<EChart option={chartOption} className="power-chart" ariaLabel="24小时电力负荷对比曲线图" />}
      />
    </TechPanel>
  )
}
