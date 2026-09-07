const schedule = [
  { workshop: '原料车间', machine: '破碎机-01', product: 'TERRACESS', batch: 'TC26090301', quantity: 80, start: '09-03 00:00', end: '09-03 08:00', status: '已完成', startHour: 0, durationHours: 8 },
  { workshop: '原料车间', machine: '球磨机-01', product: 'TERRACESS', batch: 'TC26090302', quantity: 100, start: '09-03 08:00', end: '09-03 16:00', status: '生产中', startHour: 8, durationHours: 8 },
  { workshop: '原料车间', machine: '球磨机-02', product: 'POTICON', batch: 'PC26090301', quantity: 90, start: '09-03 16:00', end: '09-03 24:00', status: '待开始', startHour: 16, durationHours: 8 },
  { workshop: '混合车间', machine: '混合机-01', product: 'TERRACESS', batch: 'TC26090303', quantity: 70, start: '09-04 00:00', end: '09-04 08:00', status: '待开始', startHour: 0, durationHours: 8 },
  { workshop: '混合车间', machine: '混合机-02', product: 'POTICON', batch: 'PC26090401', quantity: 80, start: '09-04 08:00', end: '09-04 16:00', status: '待开始', startHour: 8, durationHours: 8 },
  { workshop: '成型车间', machine: '压机-01', product: 'TERRACESS', batch: 'TC26090501', quantity: 120, start: '09-03 10:00', end: '09-03 22:00', status: '待开始', startHour: 10, durationHours: 12 },
  { workshop: '成型车间', machine: '压机-02', product: 'POTICON', batch: 'PC26090501', quantity: 100, start: '09-04 00:00', end: '09-04 12:00', status: '待开始', startHour: 0, durationHours: 12 },
  { workshop: '养护车间', machine: '窑炉-01', product: 'TERRACESS', batch: 'TC26090303', quantity: 100, start: '09-03 06:00', end: '09-03 18:00', status: '生产中', startHour: 6, durationHours: 12 },
  { workshop: '养护车间', machine: '窑炉-02', product: 'POTICON', batch: 'PC26090402', quantity: 90, start: '09-04 06:00', end: '09-04 18:00', status: '待开始', startHour: 6, durationHours: 12 },
  { workshop: '包装车间', machine: '包装线-01', product: 'TERRACESS', batch: 'TC26090502', quantity: 60, start: '09-05 08:00', end: '09-05 16:00', status: '待开始', startHour: 16, durationHours: 6 },
]

export const apsDashboardData = Object.freeze({
  filters: [
    { id: 'date', label: '时间范围', value: '2026-09-03  —  2026-09-09', type: 'date', start: '2026-09-03', end: '2026-09-09' },
    { id: 'product', label: '产品', value: '全部', options: ['全部', 'TERRACESS', 'POTICON'] },
    { id: 'workshop', label: '车间/工序', value: '全部', options: ['全部', '原料车间', '混合车间', '成型车间', '养护车间', '包装车间'] },
    { id: 'machine', label: '机台', value: '全部', options: ['全部', '破碎机-01', '球磨机-01', '球磨机-02', '混合机-01', '压机-01', '窑炉-01', '包装线-01'] },
  ],
  connection: '已连接',
  kpis: [
    { label: '今日排产批次', value: '12', unit: '', icon: '▤', tone: 'cyan' },
    { label: '计划产量', value: '386', unit: 't', icon: '◆', tone: 'blue' },
    { label: '预测综合能耗', value: '92.6', unit: 'tce', icon: 'ϟ', tone: 'yellow' },
    { label: '预计吨耗', value: '0.24', unit: 'tce/t', icon: '◎', tone: 'blue' },
    { label: '偏差告警', value: '2', unit: '', icon: '!', tone: 'red' },
  ],
  utilization: [
    { label: '原料车间', value: 78 },
    { label: '混合车间', value: 82 },
    { label: '成型车间', value: 74 },
    { label: '养护车间', value: 68 },
    { label: '包装车间', value: 65 },
  ],
  products: [
    { name: 'TERRACESS', status: '主产', water: '0.18', power: '0.22', steam: '0.36', total: '0.50' },
    { name: 'POTICON', status: '主产', water: '0.15', power: '0.19', steam: '0.31', total: '0.43' },
  ],
  schedule,
  currentHour: 10.92,
  planActual: [
    { label: '用水量', planned: 120.6, actual: 113.2, unit: 'm³', delta: '-6.1%', tone: 'good' },
    { label: '用电量', planned: 256.8, actual: 241.3, unit: 'MWh', delta: '-6.0%', tone: 'good' },
    { label: '蒸汽量', planned: 186.4, actual: 201.6, unit: 't', delta: '+8.2%', tone: 'warning' },
    { label: '综合能耗', planned: 92.6, actual: 96.3, unit: 'tce', delta: '+4.0%', tone: 'warning' },
  ],
  deviations: [
    { level: '中等偏差', metric: '蒸汽量偏差', batch: 'PC26090301', workshop: '原料车间', delta: '+8.2%', tone: 'warning' },
    { level: '严重偏差', metric: '综合能耗偏差', batch: 'TC26090501', workshop: '成型车间', delta: '+12.5%', tone: 'danger' },
  ],
  forecast: {
    labels: ['09-03（四）', '09-04（五）', '09-05（六）', '09-06（日）', '09-07（一）', '09-08（二）', '09-09（三）'],
    water: [112, 121, 118, 124, 126, 132, 120],
    power: [86, 91, 89, 95, 97, 101, 94],
    steam: [55, 61, 58, 63, 67, 71, 66],
    total: [29, 32, 31, 35, 36, 38, 34],
  },
  ranking: [
    { rank: 1, workshop: '成型车间', product: 'TERRACESS', value: 0.46 },
    { rank: 2, workshop: '养护车间', product: 'POTICON', value: 0.39 },
    { rank: 3, workshop: '混合车间', product: 'TERRACESS', value: 0.32 },
    { rank: 4, workshop: '原料车间', product: 'POTICON', value: 0.28 },
    { rank: 5, workshop: '包装车间', product: 'TERRACESS', value: 0.24 },
  ],
})

const axis = {
  axisLine: { lineStyle: { color: 'rgba(117, 176, 197, .48)' } },
  axisTick: { show: false },
  axisLabel: { color: '#8daab6', fontSize: 10 },
  splitLine: { lineStyle: { color: 'rgba(61, 116, 139, .16)' } },
}

export const apsChartOptions = Object.freeze({
  forecast: {
    animationDuration: 900,
    color: ['#47a9ff', '#ffc332', '#ff7738', '#27d8d2'],
    grid: { left: 52, right: 24, top: 42, bottom: 34 },
    tooltip: { trigger: 'axis', backgroundColor: '#071b2b', borderColor: '#1bcff2', textStyle: { color: '#e8fbff' } },
    xAxis: { ...axis, type: 'category', boundaryGap: false, data: apsDashboardData.forecast.labels, splitLine: { show: false } },
    yAxis: { ...axis, type: 'value', min: 0, max: 150, interval: 30 },
    series: [
      { name: '用水量（m³）', type: 'line', smooth: true, symbolSize: 5, data: apsDashboardData.forecast.water },
      { name: '用电量（MWh）', type: 'line', smooth: true, symbolSize: 5, data: apsDashboardData.forecast.power },
      { name: '蒸汽量（t）', type: 'line', smooth: true, symbolSize: 5, data: apsDashboardData.forecast.steam },
      { name: '综合能耗（tce）', type: 'line', smooth: true, symbolSize: 5, data: apsDashboardData.forecast.total },
    ].map((series) => ({ ...series, lineStyle: { width: 2 }, itemStyle: { borderWidth: 1, borderColor: '#dffcff' } })),
  },
})
