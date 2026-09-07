const chartText = '#789cb0'
const axisLine = 'rgba(71, 151, 185, .18)'
const splitLine = 'rgba(71, 151, 185, .12)'

const tooltip = {
  trigger: 'axis',
  backgroundColor: 'rgba(2, 17, 30, .96)',
  borderColor: '#147fa6',
  textStyle: { color: '#dff8ff', fontSize: 12 },
}

const axisBase = {
  axisLine: { lineStyle: { color: axisLine } },
  axisTick: { show: false },
  axisLabel: { color: chartText, fontSize: 11 },
  splitLine: { lineStyle: { color: splitLine } },
}

const hours = Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, '0')}:00`)

export const rotaryKilnData = {
  device: { code: 'RK-01', line: '煅烧一线', status: '稳定运行', uptime: '连续运行 126 h', updatedAt: '2026-09-07 14:32:18' },
  kpis: [
    { label: '瞬时产量', value: '18.6', unit: 't/h', delta: '+2.4%', tone: 'cyan', icon: '产' },
    { label: '筒体转速', value: '1.42', unit: 'r/min', delta: '+0.03', tone: 'blue', icon: '转' },
    { label: '窑尾负压', value: '-286', unit: 'Pa', delta: '稳定', tone: 'green', icon: '压' },
    { label: '烧成带温度', value: '1128', unit: '℃', delta: '+8℃', tone: 'orange', icon: '温' },
    { label: '主电机电流', value: '286', unit: 'A', delta: '72.4%', tone: 'blue', icon: '电' },
    { label: '单位热耗', value: '3.42', unit: 'GJ/t', delta: '-1.8%', tone: 'green', icon: '耗' },
  ],
  temperatureZones: [
    { label: '窑尾预热', value: 326, range: '280—360℃', percent: 28, tone: 'cool' },
    { label: '过渡带', value: 682, range: '620—720℃', percent: 54, tone: 'warm' },
    { label: '煅烧带', value: 1038, range: '980—1080℃', percent: 81, tone: 'hot' },
    { label: '烧成带', value: 1128, range: '1080—1160℃', percent: 92, tone: 'hot' },
    { label: '窑头冷却', value: 248, range: '220—280℃', percent: 23, tone: 'cool' },
  ],
  combustion: [
    { label: '天然气流量', value: '1,260', unit: 'Nm³/h', percent: 70 },
    { label: '一次风量', value: '8,420', unit: 'Nm³/h', percent: 62 },
    { label: '二次风量', value: '18,560', unit: 'Nm³/h', percent: 78 },
    { label: '窑尾含氧量', value: '3.2', unit: '%', percent: 42 },
  ],
  process: [
    { label: '原料喂入', value: '18.9 t/h' },
    { label: '预热换热', value: '326℃' },
    { label: '煅烧反应', value: '1038℃' },
    { label: '烧成稳定', value: '1128℃' },
    { label: '熟料冷却', value: '248℃' },
  ],
  health: [
    { label: '主电机', value: '92%', note: '绕组 68℃', level: 92 },
    { label: '减速机', value: '88%', note: '振动 2.1 mm/s', level: 88 },
    { label: '托轮组', value: '91%', note: '轴温 62 / 58℃', level: 91 },
    { label: '液压挡轮', value: '86%', note: '压力 4.8 MPa', level: 86 },
    { label: '润滑系统', value: '95%', note: '油压 0.42 MPa', level: 95 },
  ],
  alarms: [
    { time: '14:26', level: 'warning', title: '窑尾温度偏差', detail: '当前 326℃ · 偏高 8℃' },
    { time: '13:48', level: 'notice', title: '二次风量波动', detail: '已恢复至稳定区间' },
    { time: '11:16', level: 'notice', title: '托轮温升提醒', detail: '3# 托轮 62℃ · 持续观察' },
  ],
  material: [
    { label: '生料仓料位', value: '72.6%', state: '充足' },
    { label: '喂料秤偏差', value: '+0.18%', state: '正常' },
    { label: '熟料合格率', value: '99.2%', state: '达标' },
  ],
  maintenance: { runtime: '3,842 h', next: '126 h', progress: 78, task: '窑尾密封巡检', owner: '设备一组' },
  temperatureTrend: {
    labels: hours,
    series: [
      { name: '烧成带温度', color: '#ff6a2f', data: [1108,1110,1112,1109,1111,1116,1118,1120,1119,1123,1125,1122,1126,1129,1131,1128,1125,1127,1130,1132,1129,1127,1128,1128] },
      { name: '窑尾温度', color: '#14d7ff', data: [318,320,319,322,321,324,326,325,327,328,326,324,325,327,329,330,328,326,325,327,326,324,325,326] },
      { name: '窑尾负压', color: '#34df95', data: [-274,-278,-282,-279,-284,-286,-288,-285,-283,-287,-291,-289,-286,-284,-282,-286,-289,-288,-285,-283,-287,-290,-288,-286] },
    ],
  },
  energyTrend: {
    labels: ['08:00','09:00','10:00','11:00','12:00','13:00','14:00'],
    electricity: [32.8,33.4,33.1,34.2,33.8,34.4,34.1],
    gas: [1240,1268,1251,1282,1270,1262,1260],
  },
}

export const temperatureTrendOption = {
  animationDuration: 800,
  tooltip,
  grid: { left: 48, right: 42, top: 44, bottom: 34 },
  xAxis: { type: 'category', boundaryGap: false, data: hours, ...axisBase, axisLabel: { ...axisBase.axisLabel, interval: 3 } },
  yAxis: [
    { type: 'value', min: 200, max: 1200, ...axisBase },
    { type: 'value', min: -340, max: -220, ...axisBase },
  ],
  series: rotaryKilnData.temperatureTrend.series.map((series, index) => ({
    name: series.name,
    type: 'line',
    yAxisIndex: index === 2 ? 1 : 0,
    data: series.data,
    smooth: true,
    symbol: 'none',
    lineStyle: { width: index === 0 ? 3 : 2, color: series.color },
    areaStyle: index === 0 ? { color: 'rgba(255,106,47,.10)' } : undefined,
  })),
}

export const energyTrendOption = {
  animationDuration: 800,
  tooltip,
  grid: { left: 42, right: 42, top: 28, bottom: 28 },
  xAxis: { type: 'category', data: rotaryKilnData.energyTrend.labels, ...axisBase },
  yAxis: [
    { type: 'value', min: 30, max: 36, ...axisBase, axisLabel: { ...axisBase.axisLabel, formatter: '{value} kWh/t' } },
    { type: 'value', min: 1180, max: 1320, ...axisBase, axisLabel: { ...axisBase.axisLabel, show: false } },
  ],
  series: [
    { name: '电耗', type: 'bar', data: rotaryKilnData.energyTrend.electricity, barWidth: 12, itemStyle: { color: '#168ee8', borderRadius: [3,3,0,0] } },
    { name: '燃气', type: 'line', yAxisIndex: 1, data: rotaryKilnData.energyTrend.gas, smooth: true, symbolSize: 5, lineStyle: { color: '#ff8a38', width: 2 }, itemStyle: { color: '#ffb25c' } },
  ],
}
