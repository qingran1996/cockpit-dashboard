const axisText = '#6f8fa8'
const gridLine = 'rgba(57, 145, 190, .14)'

export const dashboardData = {
  water: {
    monthly: [120, 132, 145, 138, 152, 168],
    pressure: '0.48',
    pressurePercent: 76,
    regions: [
      { name: '一区压力', value: '0.46', unit: 'MPa' },
      { name: '二区压力', value: '0.51', unit: 'MPa' },
      { name: '三区压力', value: '0.47', unit: 'MPa' },
    ],
    leakage: '5.9%',
    usage: [
      { name: '一区', value: '48.6', unit: '万/m²' },
      { name: '二区', value: '52.3', unit: '万/m²' },
      { name: '三区', value: '67.1', unit: '万/m²' },
    ],
  },
  power: {
    load: '85.6',
    loadSeries: [38, 44, 61, 70, 75, 63, 54, 49, 68, 83, 94, 102, 104, 92, 98],
    periods: [
      { name: '峰段', value: '48.2', accent: 'orange' },
      { name: '平段', value: '36.5', accent: 'cyan' },
      { name: '谷段', value: '22.8', accent: 'blue' },
    ],
    availability: '99.98%',
    devices: ['一号主变', '二号主变', '三号主变'],
  },
  steam: {
    flow: '68.5',
    flowSeries: [20, 24, 34, 52, 67, 43, 36, 33, 58, 81, 94, 98, 90, 78, 66],
    pressure: '1.6',
    temperature: '285',
    efficiency: '82.6%',
    boilers: ['一号锅炉', '二号锅炉', '三号锅炉', '四号锅炉'],
  },
  bottomMetrics: [
    { icon: 'drop', label: '总用水量', value: '986.2', unit: '万/m²', trend: '↑ 3.2%', tone: 'cyan' },
    { icon: 'bolt', label: '总用电量', value: '128.6', unit: '万/kWh', trend: '↑ 4.5%', tone: 'cyan' },
    { icon: 'heat', label: '总用汽量', value: '68.5', unit: '万吨', trend: '↑ 2.8%', tone: 'orange' },
    { icon: 'energy', label: '综合能源能耗', value: '0.38', unit: 't标煤/万元', trend: '↓ 2.1%', tone: 'cyan' },
    { icon: 'carbon', label: '碳排放量', value: '862.4', unit: '吨', trend: '↓ 3.6%', tone: 'cyan' },
  ],
}

const baseAxis = {
  axisLine: { lineStyle: { color: 'rgba(79, 153, 187, .28)' } },
  axisTick: { show: false },
  axisLabel: { color: axisText, fontSize: 10 },
  splitLine: { lineStyle: { color: gridLine } },
}

export const chartOptions = {
  waterUsage: {
    animationDuration: 900,
    grid: { left: 36, right: 12, top: 20, bottom: 22 },
    xAxis: { ...baseAxis, type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'], splitLine: { show: false } },
    yAxis: { ...baseAxis, type: 'value', min: 0, max: 200, interval: 50 },
    tooltip: { trigger: 'axis', backgroundColor: '#061a2b', borderColor: '#18cfff', textStyle: { color: '#d9f7ff' } },
    series: [{
      type: 'bar',
      barWidth: 22,
      data: dashboardData.water.monthly,
      label: { show: true, position: 'top', color: '#d8f7ff', fontSize: 11 },
      itemStyle: {
        borderRadius: [2, 2, 0, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#10bfff' }, { offset: 1, color: '#064a99' }],
        },
      },
    }],
  },
  powerLoad: {
    animationDuration: 1000,
    grid: { left: 40, right: 16, top: 18, bottom: 26 },
    xAxis: { ...baseAxis, type: 'category', boundaryGap: false, data: ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22', '24', '26', '28'], splitLine: { show: false }, axisLabel: { ...baseAxis.axisLabel, interval: 2 } },
    yAxis: { ...baseAxis, type: 'value', min: 0, max: 120, interval: 40 },
    tooltip: { trigger: 'axis', backgroundColor: '#061a2b', borderColor: '#18cfff', textStyle: { color: '#d9f7ff' } },
    series: [{
      type: 'line', data: dashboardData.power.loadSeries, smooth: true, showSymbol: false,
      lineStyle: { width: 2, color: '#1dbdff' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(23, 177, 255, .48)' }, { offset: 1, color: 'rgba(8, 64, 127, .02)' }],
        },
      },
      markPoint: { symbolSize: 7, label: { show: false }, itemStyle: { color: '#8ff9ff' }, data: [{ coord: [12, 104] }] },
    }],
  },
  steamFlow: {
    animationDuration: 1000,
    grid: { left: 38, right: 12, top: 18, bottom: 24 },
    xAxis: { ...baseAxis, type: 'category', boundaryGap: false, data: ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22', '24', '26', '28'], splitLine: { show: false }, axisLabel: { ...baseAxis.axisLabel, interval: 2 } },
    yAxis: { ...baseAxis, type: 'value', min: 0, max: 120, interval: 40 },
    tooltip: { trigger: 'axis', backgroundColor: '#1c1418', borderColor: '#ff7138', textStyle: { color: '#fff0e9' } },
    series: [{
      type: 'line', data: dashboardData.steam.flowSeries, smooth: true, showSymbol: false,
      lineStyle: { width: 2, color: '#39bfff' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(33, 157, 255, .34)' }, { offset: 1, color: 'rgba(255, 113, 56, .02)' }],
        },
      },
      markPoint: { symbolSize: 7, label: { show: false }, itemStyle: { color: '#d8ffff' }, data: [{ coord: [11, 98] }] },
    }],
  },
}
