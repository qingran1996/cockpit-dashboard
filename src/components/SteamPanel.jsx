import { EChart } from './EChart.jsx'
import { EnergyDetailEntryButton } from './EnergyDetailEntryButton.js'
import { SteamTelemetry } from './HomepageTelemetry.js'
import { TechPanel } from './TechPanel.jsx'
import { resolveCompactSteamPanelLayout } from '../homepagePanelLayout.js'

const compactLayout = resolveCompactSteamPanelLayout({ panelHeight: 314, titleHeight: 48 })

export function SteamPanel({ data, chartOption, onOpenDetails }) {
  return (
    <TechPanel
      tone="orange"
      title="蒸汽资源监控"
      className="steam-panel"
      style={{
        '--steam-panel-top': `${compactLayout.panelTop}px`,
        '--steam-panel-height': `${compactLayout.panelHeight}px`,
        '--steam-process-height': `${compactLayout.processHeight}px`,
        '--steam-chart-height': `${compactLayout.chartHeight}px`,
      }}
      action={<EnergyDetailEntryButton resource="steam" title="蒸汽资源" onOpen={onOpenDetails} />}
    >
      <SteamTelemetry
        data={data}
        chart={<EChart option={chartOption} className="steam-chart" ariaLabel="24小时蒸汽流量曲线图" />}
      />
    </TechPanel>
  )
}
