import { createElement as h, useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart, RadarChart } from 'echarts/charts'
import { GridComponent, RadarComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([BarChart, LineChart, PieChart, RadarChart, GridComponent, RadarComponent, TooltipComponent, CanvasRenderer])

const palettes = {
  cyan: ['#98f8ff', '#24dff7', '#1989c5', '#174e7c'],
  orange: ['#ffe0a6', '#ff9d46', '#e7652b', '#7b382b'],
}

const axisStyle = {
  axisTick: { show: false },
  axisLine: { lineStyle: { color: 'rgba(96, 168, 189, .22)' } },
  axisLabel: { color: '#6c929d', fontSize: 8 },
  splitLine: { lineStyle: { color: 'rgba(73, 145, 168, .09)', type: 'dashed' } },
}

export function buildEnergyFooterChartOption(kind, detail, tone = 'cyan') {
  const colors = palettes[tone] ?? palettes.cyan
  const base = {
    animationDuration: 900,
    animationEasing: 'cubicOut',
    tooltip: { trigger: 'item', backgroundColor: 'rgba(2, 18, 31, .96)', borderColor: colors[1], textStyle: { color: '#e5fbff', fontSize: 9 } },
  }

  if (kind === 'ranking') {
    return {
      ...base,
      grid: { left: 96, right: 25, top: 10, bottom: 14 },
      xAxis: { ...axisStyle, type: 'value', max: 50, axisLabel: { show: false }, splitLine: { show: false } },
      yAxis: { ...axisStyle, type: 'category', inverse: true, data: detail.breakdown.map((item) => item.label), axisLine: { show: false }, axisLabel: { color: '#91b3bc', fontSize: 8, width: 86, overflow: 'truncate' } },
      series: [{
        type: 'bar', data: detail.breakdown.map((item) => item.share), barWidth: 9,
        showBackground: true, backgroundStyle: { color: 'rgba(57, 99, 115, .16)' },
        itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: colors[3] }, { offset: .62, color: colors[1] }, { offset: 1, color: colors[0] }] }, shadowBlur: 8, shadowColor: colors[1] },
        label: { show: true, position: 'right', color: colors[0], fontSize: 8, formatter: '{c}%' },
      }],
    }
  }

  if (kind === 'closure') {
    const slices = detail.workOrders.map((item, index) => ({ value: 1, name: item.status, itemStyle: { color: colors[index % colors.length], shadowBlur: 9, shadowColor: colors[index % colors.length] } }))
    return {
      ...base,
      series: [{
        type: 'pie', radius: ['45%', '68%'], center: ['50%', '52%'], data: slices,
        padAngle: 3, itemStyle: { borderColor: '#061827', borderWidth: 2 },
        label: { color: '#94b6bf', fontSize: 8, formatter: '{b}\n{c}项' },
        labelLine: { length: 8, length2: 7, lineStyle: { color: 'rgba(87, 159, 179, .34)' } },
      }],
    }
  }

  if (kind === 'health') {
    return {
      ...base,
      radar: {
        center: ['50%', '53%'], radius: '70%', splitNumber: 5,
        indicator: detail.health.map((item) => ({ name: item.label, max: 100 })),
        axisName: { color: '#789eaa', fontSize: 7 },
        axisLine: { lineStyle: { color: 'rgba(76, 149, 171, .15)' } },
        splitLine: { lineStyle: { color: 'rgba(76, 149, 171, .18)' } },
        splitArea: { areaStyle: { color: ['rgba(20, 92, 116, .03)', 'rgba(20, 92, 116, .08)'] } },
      },
      series: [{
        type: 'radar', symbol: 'circle', symbolSize: 4,
        data: [{ value: detail.health.map((item) => item.percent), name: '健康度' }],
        lineStyle: { color: colors[1], width: 2, shadowBlur: 8, shadowColor: colors[1] },
        itemStyle: { color: colors[0] }, areaStyle: { color: `${colors[1]}44` },
      }],
    }
  }

  const dayLabels = ['今', '明', '后', '+3', '+4', '+5', '+6']
  return {
    ...base,
    grid: { left: 35, right: 12, top: 16, bottom: 22 },
    xAxis: { ...axisStyle, type: 'category', boundaryGap: false, data: dayLabels, splitLine: { show: false } },
    yAxis: { ...axisStyle, type: 'value', scale: true, axisLine: { show: false }, axisLabel: { color: '#5f8793', fontSize: 7 } },
    series: [{
      type: 'line', data: detail.forecast.values, smooth: true, symbol: 'circle', symbolSize: 5,
      lineStyle: { color: colors[1], width: 2, shadowBlur: 9, shadowColor: colors[1] },
      itemStyle: { color: colors[0], borderColor: colors[1] },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${colors[1]}66` }, { offset: 1, color: `${colors[3]}00` }] } },
    }],
  }
}

export function hasRenderableChartSize(element) {
  return Boolean(element && element.clientWidth > 0 && element.clientHeight > 0)
}

export function EnergyFooterEChart({ kind, detail, tone, label }) {
  const hostRef = useRef(null)
  const option = useMemo(() => buildEnergyFooterChartOption(kind, detail, tone), [kind, detail, tone])

  useEffect(() => {
    if (!hostRef.current) return undefined
    const host = hostRef.current
    let instance = null
    let frameId = null

    const renderAtCurrentSize = () => {
      frameId = null
      if (!hasRenderableChartSize(host)) return
      if (!instance) {
        instance = echarts.init(host, null, { renderer: 'canvas' })
        instance.setOption(option, { notMerge: true })
        return
      }
      instance.resize()
    }

    const scheduleRender = () => {
      if (frameId !== null) return
      frameId = requestAnimationFrame(renderAtCurrentSize)
    }

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleRender)
    observer?.observe(host)
    scheduleRender()

    return () => {
      observer?.disconnect()
      if (frameId !== null) cancelAnimationFrame(frameId)
      instance?.dispose()
    }
  }, [option])

  return h('div', { className: `energy-footer-echart energy-footer-echart--${kind}`, 'data-footer-echart': kind },
    h('div', { ref: hostRef, className: 'energy-footer-echart__canvas', role: 'img', 'aria-label': `${label} ECharts图表` }),
  )
}
