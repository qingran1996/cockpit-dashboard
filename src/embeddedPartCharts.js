const axisLabel = {
  color: '#6f91a6',
  fontFamily: '"DIN Alternate", "Arial Narrow", sans-serif',
  fontSize: 11,
}

const splitLine = {
  lineStyle: {
    color: 'rgba(91, 151, 178, 0.13)',
    type: 'dashed',
  },
}

const tooltip = {
  trigger: 'axis',
  backgroundColor: 'rgba(3, 17, 29, 0.94)',
  borderColor: 'rgba(63, 222, 255, 0.42)',
  textStyle: { color: '#dff9ff', fontSize: 12 },
  axisPointer: {
    type: 'line',
    lineStyle: { color: 'rgba(99, 231, 255, 0.5)' },
  },
}

const part1 = Object.freeze({
  title: '部件 1 · 实时运行趋势',
  eyebrow: 'COMPONENT 01 / LIVE LOAD',
  status: '运行稳定',
  metric: Object.freeze({ label: '当前负载', value: '78.6', unit: '%' }),
  secondary: Object.freeze([
    Object.freeze({ label: '峰值', value: '84.2%' }),
    Object.freeze({ label: '波动', value: '±2.8%' }),
  ]),
  chartAriaLabel: '部件 1 最近十二分钟运行负载趋势',
  option: Object.freeze({
    animationDuration: 700,
    grid: { left: 44, right: 18, top: 22, bottom: 34 },
    tooltip,
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['-11m', '-10m', '-9m', '-8m', '-7m', '-6m', '-5m', '-4m', '-3m', '-2m', '-1m', '当前'],
      axisLine: { lineStyle: { color: 'rgba(84, 153, 181, 0.34)' } },
      axisTick: { show: false },
      axisLabel,
    },
    yAxis: {
      type: 'value',
      min: 55,
      max: 95,
      interval: 10,
      axisLabel: { ...axisLabel, formatter: '{value}%' },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine,
    },
    series: [
      {
        name: '运行负载',
        type: 'line',
        smooth: 0.34,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        data: [66.2, 68.8, 72.4, 70.9, 74.6, 77.1, 75.8, 80.4, 82.7, 79.9, 81.3, 78.6],
        lineStyle: { width: 3, color: '#35e2ff', shadowBlur: 10, shadowColor: 'rgba(53, 226, 255, 0.5)' },
        itemStyle: { color: '#b9f8ff', borderColor: '#35e2ff', borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(53, 226, 255, 0.34)' },
              { offset: 1, color: 'rgba(53, 226, 255, 0.01)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          label: { formatter: '安全阈值 88%', color: '#ffbf69', position: 'insideEndTop' },
          lineStyle: { color: 'rgba(255, 174, 76, 0.68)', type: 'dashed' },
          data: [{ yAxis: 88 }],
        },
      },
    ],
  }),
})

const part2 = Object.freeze({
  title: '部件 2 · 工况数据对比',
  eyebrow: 'COMPONENT 02 / OPERATING POINTS',
  status: '效率良好',
  metric: Object.freeze({ label: '综合效率', value: '92.4', unit: '%' }),
  secondary: Object.freeze([
    Object.freeze({ label: '达标点', value: '5 / 6' }),
    Object.freeze({ label: '偏差', value: '-3.1%' }),
  ]),
  chartAriaLabel: '部件 2 六个监测点实际值与目标值对比',
  option: Object.freeze({
    animationDuration: 700,
    grid: { left: 44, right: 18, top: 28, bottom: 36 },
    tooltip,
    xAxis: {
      type: 'category',
      data: ['A 点', 'B 点', 'C 点', 'D 点', 'E 点', 'F 点'],
      axisLine: { lineStyle: { color: 'rgba(84, 153, 181, 0.34)' } },
      axisTick: { show: false },
      axisLabel,
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 120,
      interval: 30,
      axisLabel: { ...axisLabel, formatter: '{value}%' },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine,
    },
    series: [
      {
        name: '实际值',
        type: 'bar',
        barWidth: '30%',
        data: [92, 87, 96, 90, 84, 94],
        itemStyle: {
          borderRadius: [3, 3, 0, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#53e7ff' },
              { offset: 1, color: '#0878d8' },
            ],
          },
        },
      },
      {
        name: '目标值',
        type: 'bar',
        barWidth: '16%',
        barGap: '-76%',
        data: [90, 90, 92, 90, 88, 90],
        itemStyle: {
          borderRadius: [2, 2, 0, 0],
          color: 'rgba(255, 184, 92, 0.72)',
        },
      },
    ],
  }),
})

const embeddedPartCharts = Object.freeze({
  'part-1-chart': part1,
  'part-2-chart': part2,
})

export function resolveEmbeddedPartChart(surfaceMode) {
  return embeddedPartCharts[surfaceMode] ?? null
}
