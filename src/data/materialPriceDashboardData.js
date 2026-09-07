const materials = [
  { name: 'PPS树脂', spec: '1130A6', source: '卓创资讯', price: '42,850', numericPrice: 42850, unit: '元/吨', delta: '+2.35%', tone: 'up', high: '43,200', low: '39,500', updatedAt: '10:30', status: '正常', icon: '◆' },
  { name: '玻璃纤维', spec: 'ECR2400', source: '隆众资讯', price: '4,650', numericPrice: 4650, unit: '元/吨', delta: '-1.28%', tone: 'down', high: '4,950', low: '4,420', updatedAt: '10:30', status: '正常', icon: '▧' },
  { name: '碳酸钙', spec: '325目', source: '生意社', price: '850', numericPrice: 850, unit: '元/吨', delta: '+0.59%', tone: 'up', high: '880', low: '820', updatedAt: '10:30', status: '正常', icon: '⬢' },
  { name: '阻燃剂', spec: 'ATH-100', source: '化工在线', price: '5,600', numericPrice: 5600, unit: '元/吨', delta: '-0.88%', tone: 'down', high: '5,900', low: '5,420', updatedAt: '10:30', status: '正常', icon: '♙' },
  { name: 'PA66树脂', spec: '切片', source: '卓创资讯', price: '21,300', numericPrice: 21300, unit: '元/吨', delta: '+1.42%', tone: 'up', high: '21,800', low: '19,600', updatedAt: '10:30', status: '正常', icon: '●' },
  { name: '碳纤维', spec: 'T300-12K', source: '百川盈孚', price: '78,300', numericPrice: 78300, unit: '元/吨', delta: '+1.66%', tone: 'up', high: '80,200', low: '75,000', updatedAt: '10:30', status: '正常', icon: '●' },
  { name: '环氧树脂', spec: 'E-51', source: '化工在线', price: '18,600', numericPrice: 18600, unit: '元/吨', delta: '+0.45%', tone: 'up', high: '19,000', low: '17,200', updatedAt: '10:30', status: '正常', icon: '●' },
  { name: '聚乙烯', spec: 'LLDPE 7042', source: '隆众资讯', price: '8,360', numericPrice: 8360, unit: '元/吨', delta: '-0.73%', tone: 'down', high: '8,750', low: '8,120', updatedAt: '10:30', status: '正常', icon: '●' },
]

export const materialPriceDashboardData = Object.freeze({
  filters: [
    { id: 'material', label: '材料', value: '全部', options: ['全部', 'PPS树脂', '玻璃纤维', '碳酸钙', '阻燃剂', 'PA66树脂', '碳纤维', '环氧树脂', '聚乙烯'] },
    { id: 'spec', label: '规格', value: '全部', options: ['全部', '1130A6', 'ECR2400', '325目', 'ATH-100', 'T300-12K', 'E-51', 'LLDPE 7042'] },
    { id: 'source', label: '数据来源', value: '全部', options: ['全部', '卓创资讯', '隆众资讯', '生意社', '化工在线', '百川盈孚'] },
    { id: 'date', label: '时间范围', value: '近30天', options: ['近7天', '近30天', '近90天', '近180天'] },
    { id: 'frequency', label: '更新频率', value: '每30分钟', options: ['实时', '每15分钟', '每30分钟', '每小时', '每日'] },
  ],
  collection: { status: '正常', lastUpdated: '10:30' },
  kpis: [
    { label: '监测材料', value: '8', unit: '种', icon: '◆', tone: 'cyan' },
    { label: '今日上涨', value: '3', unit: '种', icon: '↑', tone: 'red' },
    { label: '今日下跌', value: '4', unit: '种', icon: '↓', tone: 'green' },
    { label: '价格预警', value: '2', unit: '条', icon: '!', tone: 'yellow' },
    { label: '原料价格指数', value: '103.6', unit: '', delta: '-0.6%', icon: '↗', tone: 'blue' },
  ],
  materials,
  liveQuotes: materials.slice(0, 4),
  rankings: {
    rising: [materials[0], materials[5], materials[4], materials[2], materials[6]],
    falling: [materials[1], materials[3], materials[7], { name: '钛白粉', price: '15,200', numericPrice: 15200, delta: '-0.62%' }, { name: '聚丙烯', price: '7,650', numericPrice: 7650, delta: '-0.41%' }],
  },
  alerts: [
    { level: '超过上限', material: 'PPS树脂', threshold: '42,000', price: '42,850', delta: '+2.02%', severity: '中等', time: '10:30', tone: 'warning' },
    { level: '严重偏离', material: '玻璃纤维', threshold: '4,800', price: '4,650', delta: '-3.13%', severity: '严重', time: '10:28', tone: 'danger' },
  ],
  costLinks: [
    { product: 'TERRACESS', unit: '元/吨', energyCost: '3,620', energyShare: 72.0, materialCost: '1,400', materialShare: 28.0, impact: '+2.8%', unitEnergyCost: '0.32' },
    { product: 'POTICON', unit: '元/吨', energyCost: '2,860', energyShare: 70.8, materialCost: '1,180', materialShare: 29.2, impact: '+2.8%', unitEnergyCost: '0.29' },
  ],
  trend: {
    labels: ['08-04', '08-05', '08-06', '08-07', '08-08', '08-09', '08-10', '08-11', '08-12', '08-13', '08-14', '08-15', '08-16', '08-17', '08-18', '08-19', '08-20', '08-21', '08-22', '08-23', '08-24', '08-25', '08-26', '08-27', '08-28', '08-29', '08-30', '08-31', '09-01', '09-02', '09-03'],
    pps: [100, 106, 110, 114, 116, 118, 119, 118, 120, 121, 121, 124, 123, 124, 123, 125, 124, 123, 122, 125, 124, 125, 124, 123, 122, 121, 121, 122, 122, 123, 123.6],
    glass: [100, 99, 100, 102, 104, 104, 103, 105, 104, 105, 104, 105, 105, 105, 104, 105, 105, 105, 106, 105, 106, 105, 104, 105, 104, 103, 104, 102, 102, 102, 102.1],
    calcium: [100, 95, 97, 98, 97, 98, 98, 97, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98, 99, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98.4],
    retardant: [100, 90, 92, 94, 94, 93, 93, 92, 93, 92, 93, 93, 93, 93, 93, 93, 93, 93, 94, 93, 93, 93, 93, 92, 93, 93, 92, 93, 93, 93, 94.2],
  },
})

const axis = {
  axisLine: { lineStyle: { color: 'rgba(117, 176, 197, .45)' } },
  axisTick: { show: false },
  axisLabel: { color: '#8daab6', fontSize: 10 },
  splitLine: { lineStyle: { color: 'rgba(61, 116, 139, .15)', type: 'dashed' } },
}

export const materialPriceChartOptions = Object.freeze({
  trend: {
    animationDuration: 850,
    color: ['#48a8ff', '#53d78b', '#ff7b36', '#ffbc22'],
    grid: { left: 55, right: 36, top: 72, bottom: 43 },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(5, 24, 39, .96)', borderColor: '#1bcff2', textStyle: { color: '#e8fbff' } },
    xAxis: { ...axis, type: 'category', boundaryGap: false, data: materialPriceDashboardData.trend.labels, axisLabel: { ...axis.axisLabel, interval: 4 } },
    yAxis: { ...axis, type: 'value', name: '价格指数', nameTextStyle: { color: '#7899a6', fontSize: 10 }, min: 80, max: 130, interval: 10 },
    series: [
      { name: 'PPS树脂', type: 'line', smooth: false, data: materialPriceDashboardData.trend.pps },
      { name: '玻璃纤维', type: 'line', smooth: false, data: materialPriceDashboardData.trend.glass },
      { name: '碳酸钙', type: 'line', smooth: false, data: materialPriceDashboardData.trend.calcium },
      { name: '阻燃剂', type: 'line', smooth: false, data: materialPriceDashboardData.trend.retardant },
    ].map((series) => ({ ...series, showSymbol: true, symbol: 'circle', symbolSize: 4, lineStyle: { width: 2 }, itemStyle: { borderWidth: 1, borderColor: '#dffcff' } })),
  },
})
