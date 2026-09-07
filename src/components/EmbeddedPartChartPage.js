import { createElement as h } from 'react'
import { resolveEmbeddedPartChart } from '../embeddedPartCharts.js'

function StaticChartHost({ className, ariaLabel }) {
  return h('div', { className: `chart ${className}`, role: 'img', 'aria-label': ariaLabel })
}

export function EmbeddedPartChartPage({ surfaceMode, ChartComponent = StaticChartHost }) {
  const definition = resolveEmbeddedPartChart(surfaceMode)
  if (!definition) return null

  return h('main', { className: `embedded-part-chart embedded-part-chart--${surfaceMode}` },
    h('section', {
      className: 'embedded-part-chart__instrument',
      'aria-labelledby': `${surfaceMode}-title`,
    },
    h('header', { className: 'embedded-part-chart__header' },
      h('div', null,
        h('p', { className: 'embedded-part-chart__eyebrow' }, definition.eyebrow),
        h('h1', { id: `${surfaceMode}-title` }, definition.title),
      ),
      h('span', { className: 'embedded-part-chart__status' },
        h('i', { 'aria-hidden': 'true' }),
        definition.status,
      ),
    ),
    h('div', { className: 'embedded-part-chart__summary' },
      h('div', { className: 'embedded-part-chart__primary-metric' },
        h('span', null, definition.metric.label),
        h('strong', null, definition.metric.value),
        h('em', null, definition.metric.unit),
      ),
      h('dl', { className: 'embedded-part-chart__secondary-metrics' },
        ...definition.secondary.map((metric) => h('div', { key: metric.label },
          h('dt', null, metric.label),
          h('dd', null, metric.value),
        )),
      ),
    ),
    h('div', { className: 'embedded-part-chart__plot' },
      h('div', { className: 'embedded-part-chart__plot-meta', 'aria-hidden': 'true' },
        h('span', null, '实时采样'),
        h('span', null, '刷新周期 1s'),
      ),
      h(ChartComponent, {
        option: definition.option,
        className: 'embedded-part-chart__canvas',
        ariaLabel: definition.chartAriaLabel,
      }),
      h('div', { className: 'embedded-part-chart__legend', 'aria-hidden': 'true' },
        ...definition.option.series.map((series, index) => h('span', {
          key: series.name,
          className: `embedded-part-chart__legend-item is-series-${index + 1}`,
        }, h('i'), series.name)),
      ),
    )),
  )
}
