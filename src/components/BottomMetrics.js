import { createElement as h } from 'react'

const glyphs = { drop: '♦', bolt: 'ϟ', heat: 'ϟ', energy: 'ϟ', alarm: '!' }

function metricContents(metric) {
  return [
    h('i', { 'aria-hidden': 'true', key: 'icon' }, glyphs[metric.icon]),
    h('div', { key: 'copy' },
      h('span', null, metric.label),
      h('strong', null, metric.value, h('small', null, metric.unit)),
    ),
    h('div', { className: 'bottom-metric__comparisons', key: 'comparisons' }, metric.comparisons.map((item) =>
      h('em', { className: `comparison comparison--${item.tone} homepage-comparison`, key: item.label }, item.label, ' ', h('b', null, item.value))),
      metric.summary ? h('small', { className: 'bottom-metric__summary' }, metric.summary) : null,
    ),
  ]
}

export function BottomMetrics({ metrics, onMetricClick }) {
  return h('footer', { className: 'bottom-metrics', 'data-density': 'compact' }, metrics.map((metric) => {
    const className = `bottom-metric bottom-metric--${metric.tone}`
    if (metric.detailKey) {
      return h('button', {
        type: 'button',
        className,
        key: metric.label,
        'aria-label': `查看${metric.detailTitle}详情`,
        onClick: () => onMetricClick?.(metric.detailKey),
      }, metricContents(metric))
    }
    return h('div', { className, key: metric.label }, metricContents(metric))
  }))
}
