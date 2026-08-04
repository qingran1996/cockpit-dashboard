import { EChart } from './EChart.jsx'
import { TechPanel } from './TechPanel.jsx'

const accentIcon = { orange: 'ϟ', cyan: 'ϟ', blue: 'ϟ' }

function SectionHeading({ children }) {
  return <h3 className="section-heading"><span>◇</span>{children}</h3>
}

export function PowerPanel({ data, chartOption }) {
  return (
    <TechPanel title="电力资源监控" className="power-panel">
      <SectionHeading>实时用电负荷</SectionHeading>
      <div className="chart-callout"><strong>{data.load}</strong><span>MW</span></div>
      <EChart option={chartOption} className="power-chart" ariaLabel="实时用电负荷曲线图" />

      <SectionHeading>分时用电量</SectionHeading>
      <div className="period-grid">
        {data.periods.map((period) => (
          <div className={`period-stat period-stat--${period.accent}`} key={period.name}>
            <i>{accentIcon[period.accent]}</i>
            <span>{period.name}<strong>{period.value}<small>万/kWh</small></strong></span>
          </div>
        ))}
      </div>

      <SectionHeading>供电稳定性</SectionHeading>
      <div className="availability-row">
        <div><span>供电可用率</span><strong>{data.availability}</strong></div>
        <div className="ring ring--cyan ring--availability"><i /></div>
      </div>

      <SectionHeading>变电设备状态</SectionHeading>
      <div className="device-list">
        {data.devices.map((device, index) => (
          <div className="device-row" key={device}>
            <b aria-hidden="true">▥</b><span>{device}</span><em>正常</em><i style={{ '--delay': `${index * .3}s` }} />
          </div>
        ))}
      </div>
    </TechPanel>
  )
}
