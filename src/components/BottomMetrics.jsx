const glyphs = { drop: '♦', bolt: 'ϟ', heat: 'ϟ', energy: 'ϟ', carbon: '▣' }

export function BottomMetrics({ metrics }) {
  return (
    <footer className="bottom-metrics">
      {metrics.map((metric) => (
        <div className={`bottom-metric bottom-metric--${metric.tone}`} key={metric.label}>
          <i aria-hidden="true">{glyphs[metric.icon]}</i>
          <div>
            <span>{metric.label}</span>
            <strong>{metric.value}<small>{metric.unit}</small></strong>
          </div>
          <em>同比 <b>{metric.trend}</b></em>
        </div>
      ))}
    </footer>
  )
}
