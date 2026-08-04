import { EChart } from './EChart.jsx'
import { TechPanel } from './TechPanel.jsx'

function SectionHeading({ children }) {
  return <h3 className="section-heading section-heading--orange"><span>◇</span>{children}</h3>
}

export function SteamPanel({ data, chartOption }) {
  return (
    <TechPanel tone="orange" title="蒸汽资源监控" className="steam-panel">
      <div className="steam-layout">
        <div className="steam-chart-area">
          <SectionHeading>蒸汽流量曲线</SectionHeading>
          <div className="steam-callout"><strong>{data.flow}</strong><span>t/h</span></div>
          <EChart option={chartOption} className="steam-chart" ariaLabel="蒸汽流量曲线图" />
        </div>
        <div className="steam-status-area">
          <SectionHeading>压力温度监测</SectionHeading>
          <div className="thermal-readouts">
            <div><i className="gauge-icon">◔</i><span>压力<strong>{data.pressure}<small>MPa</small></strong></span></div>
            <div><i className="thermo-icon">♨</i><span>温度<strong>{data.temperature}<small>°C</small></strong></span></div>
          </div>
          <SectionHeading>锅炉运行状态</SectionHeading>
          <div className="boiler-list">
            {data.boilers.map((boiler) => <span key={boiler}><i aria-hidden="true">♨</i>{boiler}</span>)}
          </div>
        </div>
        <div className="efficiency-area">
          <SectionHeading>能源转换效率</SectionHeading>
          <div className="efficiency-value"><strong>{data.efficiency}</strong><div className="ring ring--orange"><i /></div></div>
        </div>
      </div>
    </TechPanel>
  )
}
