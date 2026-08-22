import { createElement as h, useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts/core'
import { GraphChart, PieChart, ScatterChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([GraphChart, PieChart, ScatterChart, GridComponent, TooltipComponent, CanvasRenderer])

const palettes = {
  cyan: ['#c7fbff', '#62effb', '#20d4ef', '#168ec4', '#175276'],
  orange: ['#fff0cc', '#ffc66b', '#ff9c43', '#df642e', '#713c32'],
}

function parseClock(value = '00:00') {
  const [hour = 0, minute = 0] = value.split(':').map(Number)
  return hour + minute / 60
}

function baseOption(colors) {
  return {
    animationDuration: 900,
    animationDurationUpdate: 620,
    animationEasing: 'cubicOut',
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: 'rgba(1, 15, 27, .96)',
      borderColor: colors[2],
      borderWidth: 1,
      padding: [7, 9],
      textStyle: { color: '#dffbff', fontSize: 9 },
      extraCssText: `box-shadow: 0 0 18px ${colors[2]}55;`,
    },
  }
}

export function buildEnergySideChartOption(kind, detail, tone = 'cyan') {
  const colors = palettes[tone] ?? palettes.cyan
  const base = baseOption(colors)

  if (kind === 'breakdown') {
    return {
      ...base,
      tooltip: {
        ...base.tooltip,
        formatter: ({ data }) => `${data.name}<br/><b>${data.rawValue} ${data.unit}</b><br/>占比 ${data.value}%`,
      },
      series: [{
        type: 'pie',
        roseType: 'radius',
        radius: ['25%', '72%'],
        center: ['43%', '53%'],
        minAngle: 12,
        padAngle: 3,
        startAngle: 104,
        data: detail.breakdown.map((item, index) => ({
          name: item.label,
          value: item.share,
          rawValue: item.value,
          unit: item.unit,
          itemStyle: {
            color: colors[index % colors.length],
            shadowBlur: 13,
            shadowColor: `${colors[index % colors.length]}99`,
            borderColor: '#051a29',
            borderWidth: 2,
          },
        })),
        label: {
          color: '#9bc4cd',
          fontSize: 8,
          lineHeight: 12,
          formatter: ({ name, value }) => `${name}\n{value|${value}%}`,
          rich: { value: { color: colors[0], fontSize: 10, fontWeight: 600 } },
        },
        labelLine: {
          length: 8,
          length2: 7,
          smooth: .45,
          lineStyle: { color: `${colors[2]}66` },
        },
        emphasis: { scaleSize: 8 },
      }],
    }
  }

  if (kind === 'network') {
    const nodes = detail.network.map((node, index) => {
      const warning = node.status === '关注'
      return {
        id: String(index),
        name: node.label,
        value: node.value,
        status: node.status,
        x: index % 2 === 0 ? 28 : 72,
        y: 18 + index * 27,
        symbol: 'roundRect',
        symbolSize: [94, 32],
        itemStyle: {
          color: warning ? 'rgba(84, 39, 29, .96)' : 'rgba(4, 44, 61, .96)',
          borderColor: warning ? '#ff9b50' : colors[2],
          borderWidth: 1,
          shadowBlur: warning ? 14 : 11,
          shadowColor: warning ? 'rgba(255, 139, 69, .66)' : `${colors[2]}77`,
        },
      }
    })
    return {
      ...base,
      tooltip: {
        ...base.tooltip,
        formatter: ({ data, dataType }) => dataType === 'node'
          ? `${data.name}<br/><b>${data.value}</b><br/>状态：${data.status}`
          : '实时能源链路',
      },
      series: [{
        type: 'graph',
        layout: 'none',
        left: 20,
        right: 20,
        top: 13,
        bottom: 12,
        roam: false,
        data: nodes,
        links: nodes.slice(1).map((node, index) => ({
          source: String(index),
          target: node.id,
          lineStyle: { curveness: index % 2 === 0 ? .22 : -.22 },
        })),
        lineStyle: {
          color: colors[2],
          width: 2,
          opacity: .72,
          shadowBlur: 9,
          shadowColor: colors[2],
        },
        edgeSymbol: ['circle', 'arrow'],
        edgeSymbolSize: [3, 7],
        label: {
          show: true,
          color: '#d7f7fa',
          fontSize: 8,
          lineHeight: 12,
          formatter: ({ data }) => `{name|${data.name}}\n{value|${data.value}}`,
          rich: {
            name: { color: '#d7f7fa', fontSize: 8, fontWeight: 600 },
            value: { color: '#72a8b4', fontSize: 7 },
          },
        },
        emphasis: { focus: 'adjacency', lineStyle: { width: 3, opacity: 1 } },
      }],
    }
  }

  const alarms = detail.alarms
  return {
    ...base,
    grid: { left: 92, right: 62, top: 13, bottom: 28 },
    tooltip: {
      ...base.tooltip,
      formatter: ({ data }) => `${data.title}<br/><b>${data.time} · ${data.status}</b><br/>${data.detail}`,
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 24,
      interval: 6,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: 'rgba(91, 166, 186, .24)' } },
      axisLabel: { color: '#577f8b', fontSize: 7, formatter: (value) => `${String(value).padStart(2, '0')}:00` },
      splitLine: { lineStyle: { color: 'rgba(82, 151, 171, .10)', type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: alarms.map((alarm) => alarm.title),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: '#88aeb8', fontSize: 8, width: 82, overflow: 'truncate' },
      splitLine: { show: true, lineStyle: { color: 'rgba(82, 151, 171, .08)' } },
    },
    series: [{
      type: 'scatter',
      symbol: 'diamond',
      symbolSize: (value, params) => params.data.level === 'warning' ? 17 : 12,
      data: alarms.map((alarm) => {
        const warning = alarm.level === 'warning'
        return {
          value: [parseClock(alarm.time), alarm.title],
          title: alarm.title,
          detail: alarm.detail,
          time: alarm.time,
          level: alarm.level,
          status: warning ? '待确认' : '监测中',
          itemStyle: {
            color: warning ? '#ff9a4c' : colors[1],
            shadowBlur: warning ? 18 : 13,
            shadowColor: warning ? '#ff7138' : colors[2],
            borderColor: '#f1feff',
            borderWidth: 1,
          },
        }
      }),
      label: {
        show: true,
        position: 'right',
        distance: 8,
        color: '#80a7b1',
        fontSize: 7,
        formatter: ({ data }) => `${data.time}\n${data.status}`,
      },
      emphasis: { scale: 1.3 },
    }],
  }
}

export function EnergySideEChart({ kind, detail, tone, label }) {
  const hostRef = useRef(null)
  const option = useMemo(() => buildEnergySideChartOption(kind, detail, tone), [kind, detail, tone])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    let instance = null
    let frameId = null

    const renderAtCurrentSize = () => {
      frameId = null
      if (host.clientWidth <= 0 || host.clientHeight <= 0) return
      if (!instance) {
        instance = echarts.init(host, null, { renderer: 'canvas' })
        instance.setOption(option, { notMerge: true })
        return
      }
      instance.resize()
    }
    const scheduleRender = () => {
      if (frameId === null) frameId = requestAnimationFrame(renderAtCurrentSize)
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

  return h('div', { className: `energy-side-echart energy-side-echart--${kind}`, 'data-side-echart': kind },
    h('div', { ref: hostRef, className: 'energy-side-echart__canvas', role: 'img', 'aria-label': `${label} ECharts图表` }),
  )
}
