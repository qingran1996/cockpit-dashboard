import { EChart } from './EChart.jsx'
import { TechPanel } from './TechPanel.jsx'

function SectionHeading({ children }) {
  return <h3 className="section-heading"><span>◇</span>{children}</h3>
}

export function WaterPanel({ data, chartOption }) {
  return (
    <TechPanel title="水资源监控" className="water-panel">
      <SectionHeading>月度用水量统计</SectionHeading>
      <EChart option={chartOption} className="water-chart" ariaLabel="一月至六月月度用水量柱状图" />

      <SectionHeading>管网压力监测</SectionHeading>
      <div className="pressure-readout">
        <strong>{data.pressure}</strong><span>MPa</span><em>运行平稳</em>
      </div>
      <div className="progress-track"><i style={{ width: `${data.pressurePercent}%` }} /></div>
      <div className="mini-stat-grid">
        {data.regions.map((region) => (
          <div className="mini-stat" key={region.name}>
            <span>{region.name}</span><strong>{region.value}<small>{region.unit}</small></strong>
          </div>
        ))}
      </div>

      <SectionHeading>漏损率统计</SectionHeading>
      <div className="leakage-row">
        <div><span>管网漏损率</span><strong>{data.leakage}</strong></div>
        <div className="ring ring--cyan" style={{ '--value': '5.9%' }}><i /></div>
      </div>

      <SectionHeading>分区用水量</SectionHeading>
      <div className="usage-grid">
        {data.usage.map((item) => (
          <div className="usage-card" key={item.name}>
            <span><b aria-hidden="true">♦</b>{item.name}</span>
            <strong>{item.value}<small>{item.unit}</small></strong>
          </div>
        ))}
      </div>
    </TechPanel>
  )
}
