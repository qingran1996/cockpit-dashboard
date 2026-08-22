import { createElement as h, useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([BarChart, LineChart, GridComponent, MarkLineComponent, TooltipComponent, CanvasRenderer])

const toneColors = {
  cyan: { main: '#28defa', bright: '#a7f8ff', muted: '#277fa4', area: 'rgba(24, 211, 245, .30)' },
  orange: { main: '#ff9e4a', bright: '#ffe2b0', muted: '#9c6035', area: 'rgba(255, 143, 52, .28)' },
}

export function buildEnergyDetailChartOption(chart, tone = 'cyan') {
  const colors = toneColors[tone] ?? toneColors.cyan
  const isBar = chart.type === 'bar'
  const series = [{
    name: '当前',
    type: isBar ? 'bar' : 'line',
    data: chart.values,
    smooth: !isBar,
    showSymbol: !isBar,
    symbol: 'circle',
    symbolSize: 4,
    barMaxWidth: 24,
    lineStyle: { width: 2, color: colors.main, shadowBlur: 10, shadowColor: colors.main },
    itemStyle: isBar
      ? { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colors.bright }, { offset: .32, color: colors.main }, { offset: 1, color: colors.muted }] }, borderColor: colors.bright, borderWidth: .5 }
      : { color: colors.bright, borderColor: colors.main, borderWidth: 1 },
    areaStyle: isBar ? undefined : { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colors.area }, { offset: 1, color: 'rgba(3, 25, 39, 0)' }] } },
    markLine: chart.threshold == null ? undefined : {
      silent: true,
      symbol: 'none',
      label: { formatter: `阈值 ${chart.threshold}`, color: '#ffb269', fontSize: 9, position: 'insideEndTop' },
      lineStyle: { color: '#ff8c4d', type: 'dashed', width: 1 },
      data: [{ yAxis: chart.threshold }],
    },
  }]

  if (chart.secondary?.length) {
    series.push({
      name: '对照 / 预测', type: 'line', data: chart.secondary, smooth: true, showSymbol: false,
      lineStyle: { width: 1.3, type: 'dashed', color: colors.muted },
      itemStyle: { color: colors.muted },
    })
  }

  return {
    animationDuration: 720,
    animationEasing: 'cubicOut',
    grid: { left: 42, right: 18, top: 15, bottom: 27 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(2, 19, 32, .96)',
      borderColor: colors.main,
      borderWidth: 1,
      textStyle: { color: '#dffbff', fontSize: 10 },
      axisPointer: { type: isBar ? 'shadow' : 'line', lineStyle: { color: colors.main, type: 'dashed' } },
      valueFormatter: (value) => `${value} ${chart.unit}`,
    },
    xAxis: {
      type: 'category', data: chart.labels, boundaryGap: isBar,
      axisTick: { show: false }, axisLine: { lineStyle: { color: 'rgba(91, 170, 192, .26)' } },
      axisLabel: { color: '#648d9a', fontSize: 9, interval: 0 },
    },
    yAxis: {
      type: 'value', scale: true,
      axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#517986', fontSize: 9 },
      splitLine: { lineStyle: { color: 'rgba(77, 153, 180, .10)', type: 'dashed' } },
    },
    series,
  }
}

export function EnergyDetailEChart({ chart, tone, context }) {
  const hostRef = useRef(null)
  const option = useMemo(() => buildEnergyDetailChartOption(chart, tone), [chart, tone])

  useEffect(() => {
    if (!hostRef.current) return undefined
    const instance = echarts.init(hostRef.current, null, { renderer: 'canvas' })
    instance.setOption(option, { notMerge: true })
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => instance.resize())
    resizeObserver?.observe(hostRef.current)
    return () => {
      resizeObserver?.disconnect()
      instance.dispose()
    }
  }, [option])

  const peak = Math.max(...chart.values)
  const average = chart.values.reduce((sum, value) => sum + value, 0) / Math.max(chart.values.length, 1)
  const current = chart.values.at(-1)

  return h('section', { className: 'energy-detail-echart-shell', 'data-chart-kind': chart.type, 'aria-label': chart.title },
    h('div', { className: 'energy-detail-section__heading' }, h('h3', null, chart.title), h('span', null, `单位：${chart.unit}`)),
    h('div', { className: 'energy-detail-echart__stats', role: 'group', 'aria-label': '趋势摘要' },
      [['当前', current], ['峰值', peak], ['平均', average]].map(([label, value]) => h('span', { key: label }, label, h('strong', null, Number(value).toFixed(1)))),
      h('span', null, '数据点', h('strong', null, chart.values.length)),
    ),
    h('div', { ref: hostRef, className: 'energy-detail-echart', role: 'img', 'aria-label': `${chart.title} ECharts 图表` }),
    h('div', { className: 'energy-detail-echart__context' },
      h('div', null, h('strong', null, context.title), h('span', null, context.caption)),
      h('ul', null, context.items.map((item) => h('li', { key: item }, item))),
    ),
  )
}
