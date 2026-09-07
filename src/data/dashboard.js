const axisText = '#6f8fa8'
const gridLine = 'rgba(57, 145, 190, .14)'

export const dashboardData = {
  water: {
    summary: [
      { label: '今日用水', value: '986.2', unit: 't', comparisons: [{ label: '较昨日', value: '-5.1%', tone: 'good' }, { label: '环比上月', value: '-3.6%', tone: 'good' }] },
      { label: '实时流量', value: '42.8', unit: 'm³/h', comparisons: [{ label: '较昨日', value: '-6.2%', tone: 'good' }, { label: '环比上月', value: '-4.1%', tone: 'good' }] },
      { label: '平均压力', value: '0.48', unit: 'MPa', comparisons: [{ label: '较昨日', value: '+0.02', tone: 'warning' }, { label: '环比上月', value: '+0.01', tone: 'warning' }] },
      { label: '漏损率', value: '5.9', unit: '%', comparisons: [{ label: '较昨日', value: '+0.4%', tone: 'warning' }, { label: '环比上月', value: '+0.6%', tone: 'warning' }] },
    ],
    districts: [
      { name: '一区', value: '28.6', unit: 'm³/h', percent: 65 },
      { name: '二区', value: '10.3', unit: 'm³/h', percent: 45 },
      { name: '三区', value: '8.7', unit: 'm³/h', percent: 35 },
    ],
    meterHealth: { online: 38, total: 40 },
    alert: '二区压力接近高限',
    operations: [
      { icon: '◈', label: '在线水表', value: '38', unit: '/ 40', comparisons: [{ label: '较昨日', value: '+2', tone: 'good' }, { label: '环比上月', value: '+4', tone: 'good' }] },
      { icon: '◯', label: '夜间基流', value: '18.4', unit: 'm³/h', comparisons: [{ label: '较昨日', value: '-0.8', tone: 'good' }, { label: '环比上月', value: '-1.2', tone: 'good' }] },
      { icon: '!', label: '漏损异常', value: '1', unit: '处', tone: 'warning', comparisons: [{ label: '较昨日', value: '持平', tone: 'muted' }, { label: '环比上月', value: '+1', tone: 'warning' }] },
      { icon: '△', label: '二区压力接近高限', value: '0.48', unit: 'MPa', tone: 'warning', comparisons: [{ label: '预警阈值', value: '0.50 MPa', tone: 'muted' }] },
    ],
    terminal: [
      { label: '管网健康', value: '95.0', unit: '%', comparisons: [{ label: '较昨日', value: '+1.2', tone: 'good' }, { label: '环比上月', value: '-0.03', tone: 'good' }] },
      { label: '夜间基流', value: '18.4', unit: 'm³/h', comparisons: [{ label: '较昨日', value: '-0.8', tone: 'good' }, { label: '环比上月', value: '-1.2', tone: 'good' }] },
      { label: '单位水耗', value: '2.81', unit: 't/万元', comparisons: [{ label: '较昨日', value: '-0.03', tone: 'good' }, { label: '环比上月', value: '-0.05', tone: 'good' }] },
    ],
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
    summary: [
      { label: '实时负荷', value: '85.6', unit: 'MW', comparisons: [{ label: '较昨日', value: '+3.2%', tone: 'warning' }, { label: '环比上月', value: '+6.7%', tone: 'warning' }] },
      { label: '最大需量', value: '102.4', unit: 'MW', comparisons: [{ label: '较昨日', value: '-1.5%', tone: 'good' }, { label: '环比上月', value: '+4.3%', tone: 'warning' }] },
      { label: '功率因数', value: '0.96', unit: '', comparisons: [{ label: '较昨日', value: '+0.01', tone: 'warning' }, { label: '环比上月', value: '+0.02', tone: 'warning' }] },
      { label: '频率', value: '50.03', unit: 'Hz', comparisons: [{ label: '较昨日', value: '持平', tone: 'muted' }, { label: '环比上月', value: '持平', tone: 'muted' }] },
    ],
    transformers: [
      { name: '1#主变（高炉）', load: '68.2', percent: 68.2, tone: 'normal', delta: '+2.5%' },
      { name: '2#主变（双螺杆挤出机）', load: '92.1', percent: 92.1, tone: 'warning', delta: '+4.1%' },
      { name: '3#主变（空压机）', load: '54.7', percent: 54.7, tone: 'normal', delta: '-1.8%' },
    ],
    tariffs: [
      { name: '尖时段', value: '785.0', delta: '+15.0' },
      { name: '平时段', value: '456.0', delta: '+6.0' },
      { name: '谷时段', value: '256.0', delta: '-4.0' },
    ],
    quality: { label: 'THD', value: '2.8', unit: '%', delta: '-0.2%' },
    terminal: [
      { label: '供电可用率', value: '99.98', unit: '%', comparisons: [{ label: '较昨日', value: '+0.01%', tone: 'warning' }, { label: '环比上月', value: '-0.03%', tone: 'good' }] },
      { label: '在线电表', value: '64', unit: '/ 65', comparisons: [{ label: '较昨日', value: '+1', tone: 'warning' }, { label: '环比上月', value: '+2', tone: 'warning' }] },
      { label: '需量利用率', value: '85.3', unit: '%', comparisons: [{ label: '较昨日', value: '-1.6%', tone: 'good' }, { label: '环比上月', value: '-2.4%', tone: 'good' }] },
    ],
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
    summary: [
      { label: '实时流量', value: '68.5', unit: 't/h' },
      { label: '今日用汽量', value: '326.4', unit: 't' },
      { label: '供汽压力', value: '1.60', unit: 'MPa', delta: '+0.03' },
      { label: '供汽温度', value: '285', unit: '°C', delta: '+2' },
    ],
    boilerStates: [
      { name: '1#锅炉', state: '运行', tone: 'running' },
      { name: '2#锅炉', state: '运行', tone: 'running' },
      { name: '3#锅炉', state: '备用', tone: 'standby' },
      { name: '4#锅炉', state: '备用', tone: 'standby' },
    ],
    unitCost: '186',
    unitCostDelta: '+8',
    alert: '管网末端压降偏高',
    alerts: [
      { title: '高温偏差', meta: '较昨日 -1' },
      { title: '管网末端压降偏高', meta: '持续 12 分钟' },
    ],
    balance: [
      { label: '锅炉出口', value: '69.3', unit: 't/h' },
      { label: '用户端', value: '68.5', unit: 't/h' },
      { label: '供需差', value: '0.8', unit: 't/h' },
      { label: '热损失', value: '3.82', unit: '%' },
    ],
    flow: '68.5',
    flowSeries: [20, 24, 34, 52, 67, 43, 36, 33, 58, 81, 94, 98, 90, 78, 66],
    pressure: '1.6',
    temperature: '285',
    efficiency: '82.6%',
    boilerLoad: '68.5%',
    alertProgress: '0 / 2',
    alertOwner: '动力运行',
    boilers: ['一号锅炉', '二号锅炉', '三号锅炉', '四号锅炉'],
  },
  bottomMetrics: [
    { icon: 'drop', label: '今日总用水', value: '986.2', unit: 't', tone: 'cyan', detailKey: 'water', detailTitle: '水资源', comparisons: [{ label: '较昨日', value: '-5.1%', tone: 'good' }, { label: '环比上月', value: '-3.6%', tone: 'good' }] },
    { icon: 'bolt', label: '今日总用电', value: '128.6', unit: 'MWh', tone: 'yellow', detailKey: 'power', detailTitle: '电力资源', comparisons: [{ label: '较昨日', value: '+3.2%', tone: 'warning' }, { label: '环比上月', value: '+6.7%', tone: 'good' }] },
    { icon: 'heat', label: '今日总蒸汽', value: '326.4', unit: 't', tone: 'orange', detailKey: 'steam', detailTitle: '蒸汽资源', comparisons: [{ label: '较昨日', value: '+1.8%', tone: 'warning' }, { label: '环比上月', value: '-2.9%', tone: 'good' }] },
    { icon: 'energy', label: '综合能耗', value: '82.6', unit: 'tce', tone: 'cyan', comparisons: [{ label: '较昨日', value: '+1.2%', tone: 'good' }, { label: '环比上月', value: '-1.1%', tone: 'good' }] },
    { icon: 'alarm', label: '告警数量', value: '3', unit: '条', tone: 'warning', comparisons: [{ label: '较昨日', value: '-1', tone: 'good' }, { label: '环比上月', value: '+1', tone: 'warning' }], summary: '严重 1 / 一般 2' },
  ],
}

export const energyDetailData = {
  water: {
    title: '水资源详情',
    eyebrow: 'WATER NETWORK / 供水运行',
    tone: 'cyan',
    tabs: ['总览', '分区', '管网', '告警'],
    metrics: [
      { label: '今日用水', value: '986.2', unit: 't', delta: '较昨日 +3.2%' },
      { label: '实时流量', value: '42.8', unit: 'm³/h', delta: '计划区间内' },
      { label: '平均压力', value: '0.48', unit: 'MPa', delta: '稳定' },
      { label: '管网漏损率', value: '5.9', unit: '%', delta: '目标 ≤ 6.5%' },
    ],
    diagnostics: [
      { label: '供水可用率', value: '99.95%', status: '稳定' },
      { label: '在线阀门', value: '26 / 27', status: '1台检修' },
      { label: '压力合格率', value: '98.7%', status: '达标' },
      { label: '夜间基流', value: '18.4 m³/h', status: '偏高' },
      { label: '单位水耗', value: '2.81 t/万元', status: '待优化' },
      { label: '漏损预算', value: '-0.6 pp', status: '预算内' },
    ],
    trend: {
      title: '24小时用水流量',
      unit: 'm³/h',
      labels: ['00', '03', '06', '09', '12', '15', '18', '21', '24'],
      current: [31, 28, 34, 39, 47, 42, 51, 45, 38],
      previous: [28, 26, 31, 36, 41, 39, 46, 42, 35],
    },
    breakdown: [
      { label: '一区生产用水', value: '456.2', unit: 't', share: 46 },
      { label: '二区工艺用水', value: '312.8', unit: 't', share: 32 },
      { label: '三区生活用水', value: '145.6', unit: 't', share: 15 },
      { label: '行政及绿化', value: '71.6', unit: 't', share: 7 },
    ],
    network: [
      { label: '市政总进水', value: '0.52 MPa', status: '正常' },
      { label: '一区管网', value: '0.46 MPa', status: '正常' },
      { label: '二区管网', value: '0.51 MPa', status: '关注' },
      { label: '三区管网', value: '0.47 MPa', status: '正常' },
    ],
    alarms: [
      { level: 'warning', title: '二区压力接近高限', detail: '当前 0.51 MPa，高限 0.55 MPa', time: '10:42' },
      { level: 'info', title: '北侧管网夜间基流偏高', detail: '建议检查阀井 W-17 至 W-19', time: '08:16' },
    ],
    workOrders: [
      { title: 'W-17 阀井复核', owner: '巡检班组', deadline: '12:30', status: '处理中' },
      { title: '二区压力回差确认', owner: '水务值班', deadline: '14:00', status: '待复核' },
      { title: '离线水表通信恢复', owner: '仪表班组', deadline: '今日', status: '已派单' },
    ],
    health: [
      { label: '供水泵组', value: '3 / 4', percent: 92, status: '1台备用' },
      { label: '在线水表', value: '38 / 40', percent: 95, status: '2台离线' },
      { label: '调节阀门', value: '26 / 27', percent: 96, status: '1台检修' },
      { label: '压力仪表', value: '18 / 18', percent: 100, status: '全部在线' },
    ],
    forecast: {
      title: '七日用水预测',
      unit: 't',
      values: [986, 1012, 978, 1048, 1026, 995, 1008],
      summary: [
        { label: '预计总量', value: '7,053 t' },
        { label: '环比偏差', value: '-2.8%' },
        { label: '节水空间', value: '186 t' },
      ],
    },
    benchmarks: [
      { label: '单位产值水耗', current: '2.81 t/万元', reference: '目标 2.60', status: '偏高 8.1%' },
      { label: '夜间最小流量', current: '18.4 m³/h', reference: '基线 15.0', status: '需关注' },
      { label: '供水压差', current: '0.09 MPa', reference: '目标 ≤0.12', status: '正常' },
      { label: '在线水表', current: '38 / 40', reference: '在线率 95%', status: '2台离线' },
    ],
  },
  power: {
    title: '电力资源详情',
    eyebrow: 'POWER GRID / 配电运行',
    tone: 'cyan',
    tabs: ['总览', '负荷', '需量', '电能质量', '设备'],
    metrics: [
      { label: '实时负荷', value: '85.6', unit: 'MW', delta: '较昨日 +4.5%' },
      { label: '最大需量', value: '102.4', unit: 'MW', delta: '发生于 14:20' },
      { label: '功率因数', value: '0.96', unit: '', delta: '目标 ≥ 0.95' },
      { label: '电网频率', value: '50.03', unit: 'Hz', delta: '运行稳定' },
    ],
    diagnostics: [
      { label: '供电可用率', value: '99.98%', status: '稳定' },
      { label: '在线电表', value: '64 / 65', status: '1台离线' },
      { label: '需量利用率', value: '85.3%', status: '正常' },
      { label: '电压总谐波', value: '2.8%', status: '达标' },
      { label: '无功补偿', value: '6 / 8组', status: '已投入' },
      { label: '峰谷差', value: '52.6 MW', status: '可优化' },
    ],
    trend: {
      title: '24小时负荷曲线',
      unit: 'MW',
      labels: ['00', '03', '06', '09', '12', '15', '18', '21', '24'],
      current: [38, 34, 49, 67, 82, 96, 78, 88, 72],
      previous: [35, 31, 45, 61, 74, 85, 71, 80, 68],
      threshold: 110,
    },
    breakdown: [
      { label: '峰段电量', value: '48.2', unit: '万kWh', share: 40 },
      { label: '平段电量', value: '36.5', unit: '万kWh', share: 30 },
      { label: '谷段电量', value: '22.8', unit: '万kWh', share: 19 },
      { label: '辅助系统', value: '14.1', unit: '万kWh', share: 11 },
    ],
    network: [
      { label: '1#主变', value: '负载率 76%', status: '正常' },
      { label: '2#主变', value: '负载率 92%', status: '关注' },
      { label: '3#主变', value: '负载率 68%', status: '正常' },
      { label: '10kV母联', value: '合闸', status: '正常' },
    ],
    alarms: [
      { level: 'warning', title: '2#主变负载率偏高', detail: '当前 92.3%，持续 18 分钟', time: '14:35' },
      { level: 'info', title: '无功补偿投入', detail: '功率因数已恢复至 0.96', time: '13:58' },
    ],
    workOrders: [
      { title: '2#主变温升复核', owner: '配电班组', deadline: '15:30', status: '处理中' },
      { title: '电表 E-065 通信恢复', owner: '仪表班组', deadline: '今日', status: '已派单' },
      { title: '需量策略校核', owner: '能源调度', deadline: '16:00', status: '待确认' },
    ],
    health: [
      { label: '高压断路器', value: '32 / 32', percent: 100, status: '全部在线' },
      { label: '在线电表', value: '64 / 65', percent: 98, status: '1台离线' },
      { label: '补偿电容组', value: '6 / 8', percent: 75, status: '2组备用' },
      { label: '主变压器', value: '3 / 3', percent: 94, status: '2#关注' },
    ],
    forecast: {
      title: '七日负荷预测',
      unit: 'MW',
      values: [85.6, 91.2, 96.4, 102.1, 98.8, 93.5, 95.2],
      summary: [
        { label: '预测峰值', value: '102.1 MW' },
        { label: '需量余量', value: '17.9 MW' },
        { label: '预计电费', value: '¥ 68.7万' },
      ],
    },
    benchmarks: [
      { label: '单位产值电耗', current: '86.4 kWh/万元', reference: '目标 82.0', status: '偏高 5.4%' },
      { label: '需量利用率', current: '85.3%', reference: '合同 120 MW', status: '正常' },
      { label: '电压总谐波', current: '2.8%', reference: '限值 5.0%', status: '正常' },
      { label: '在线电表', current: '64 / 65', reference: '在线率 98.5%', status: '1台离线' },
    ],
  },
  steam: {
    title: '蒸汽资源详情',
    eyebrow: 'STEAM LOOP / 热力运行',
    tone: 'orange',
    tabs: ['总览', '管网', '锅炉', '效率', '告警'],
    metrics: [
      { label: '实时流量', value: '68.5', unit: 't/h', delta: '较昨日 +2.8%' },
      { label: '累计用汽', value: '326.4', unit: 't', delta: '完成计划 82%' },
      { label: '主管压力', value: '1.60', unit: 'MPa', delta: '稳定' },
      { label: '供汽温度', value: '285', unit: '°C', delta: '目标 280–295°C' },
    ],
    diagnostics: [
      { label: '管网热损率', value: '8.6%', status: '正常' },
      { label: '疏水器在线', value: '42 / 44', status: '2台检修' },
      { label: '锅炉效率', value: '82.6%', status: '可提升' },
      { label: '单位成本', value: '¥186 / t', status: '预算内' },
      { label: '压力合格率', value: '97.4%', status: '达标' },
      { label: '凝结水回收', value: '71.2%', status: '上升' },
    ],
    trend: {
      title: '24小时蒸汽流量',
      unit: 't/h',
      labels: ['00', '03', '06', '09', '12', '15', '18', '21', '24'],
      current: [26, 22, 35, 54, 62, 58, 76, 71, 60],
      previous: [23, 20, 31, 47, 55, 52, 68, 64, 57],
    },
    breakdown: [
      { label: '主生产车间', value: '28.6', unit: 't/h', share: 42 },
      { label: '工艺车间', value: '19.8', unit: 't/h', share: 29 },
      { label: '公用工程区', value: '12.4', unit: 't/h', share: 18 },
      { label: '实验中心', value: '7.7', unit: 't/h', share: 11 },
    ],
    network: [
      { label: '锅炉房', value: '1.62 MPa / 292°C', status: '正常' },
      { label: '主生产车间', value: '1.55 MPa / 288°C', status: '正常' },
      { label: '工艺车间', value: '1.43 MPa / 283°C', status: '正常' },
      { label: '实验中心', value: '1.28 MPa / 278°C', status: '关注' },
    ],
    alarms: [
      { level: 'warning', title: '二区末端压降偏大', detail: '当前压差 0.38 MPa，建议检查疏水器', time: '11:06' },
      { level: 'info', title: '4#锅炉进入热备用', detail: '其余三台锅炉运行正常', time: '09:24' },
    ],
    workOrders: [
      { title: '二区疏水器排查', owner: '巡检班组', deadline: '13:30', status: '处理中' },
      { title: '4#锅炉热备确认', owner: '锅炉班组', deadline: '14:10', status: '待复核' },
      { title: '凝结水回收校核', owner: '能源调度', deadline: '今日', status: '已派单' },
    ],
    health: [
      { label: '运行锅炉', value: '2 / 4', percent: 82, status: '2台备用' },
      { label: '疏水器', value: '42 / 44', percent: 95, status: '2台检修' },
      { label: '调节阀门', value: '34 / 35', percent: 97, status: '1台关注' },
      { label: '温压仪表', value: '28 / 29', percent: 96, status: '1台离线' },
    ],
    forecast: {
      title: '七日用汽预测',
      unit: 't/h',
      values: [68.5, 72.4, 70.8, 76.2, 73.6, 69.8, 71.4],
      summary: [
        { label: '预计用汽', value: '1,092 t' },
        { label: '凝水回收', value: '71.2%' },
        { label: '预计成本', value: '¥ 20.3万' },
      ],
    },
    benchmarks: [
      { label: '单位产值汽耗', current: '0.42 t/万元', reference: '目标 0.39', status: '偏高 7.7%' },
      { label: '管网热损率', current: '8.6%', reference: '目标 ≤9.0%', status: '正常' },
      { label: '锅炉综合效率', current: '82.6%', reference: '标杆 85.0%', status: '可提升' },
      { label: '单位蒸汽成本', current: '¥186 / t', reference: '预算 ¥192', status: '低于预算' },
    ],
  },
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
    grid: { left: 34, right: 12, top: 12, bottom: 22 },
    xAxis: { ...baseAxis, type: 'category', boundaryGap: false, data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'], splitLine: { show: false } },
    yAxis: { ...baseAxis, type: 'value', min: 0, max: 100, interval: 20 },
    tooltip: { trigger: 'axis', backgroundColor: '#061a2b', borderColor: '#18cfff', textStyle: { color: '#d9f7ff' } },
    series: [
      {
        type: 'line', data: [28, 39, 55, 41, 64, 58, 42.8], smooth: true, symbolSize: 5,
        lineStyle: { width: 2, color: '#22e2ff' }, itemStyle: { color: '#8ff8ff' },
        areaStyle: { color: 'rgba(25, 215, 255, .11)' },
      },
      {
        type: 'line', data: [34, 22, 38, 54, 45, 72, 36], smooth: true, symbolSize: 4,
        lineStyle: { width: 2, color: '#147bdf' }, itemStyle: { color: '#2287ec' },
      },
    ],
  },
  powerLoad: {
    animationDuration: 1000,
    grid: { left: 40, right: 16, top: 18, bottom: 26 },
    xAxis: { ...baseAxis, type: 'category', boundaryGap: false, data: ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22', '24', '26', '28'], splitLine: { show: false }, axisLabel: { ...baseAxis.axisLabel, interval: 2 } },
    yAxis: { ...baseAxis, type: 'value', min: 0, max: 120, interval: 40 },
    tooltip: { trigger: 'axis', backgroundColor: '#061a2b', borderColor: '#18cfff', textStyle: { color: '#d9f7ff' } },
    series: [
      {
        type: 'line', data: dashboardData.power.loadSeries, smooth: true, showSymbol: false,
        lineStyle: { width: 2, color: '#1edaff' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(23, 177, 255, .4)' }, { offset: 1, color: 'rgba(8, 64, 127, .02)' }],
          },
        },
        markLine: { symbol: 'none', label: { formatter: '需量限值 110.0 MW', color: '#ff7765', fontSize: 9 }, lineStyle: { color: '#ff6158', type: 'dashed' }, data: [{ yAxis: 110 }] },
      },
      { type: 'line', data: [34, 41, 53, 62, 68, 72, 86, 94, 91, 80, 74, 69, 76, 72, 66], smooth: true, showSymbol: false, lineStyle: { width: 1.5, color: '#166ed0' } },
    ],
  },
  steamFlow: {
    animationDuration: 1000,
    grid: { left: 38, right: 12, top: 18, bottom: 24 },
    xAxis: { ...baseAxis, type: 'category', boundaryGap: false, data: ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22', '24', '26', '28'], splitLine: { show: false }, axisLabel: { ...baseAxis.axisLabel, interval: 2 } },
    yAxis: { ...baseAxis, type: 'value', min: 0, max: 120, interval: 40 },
    tooltip: { trigger: 'axis', backgroundColor: '#1c1418', borderColor: '#ff7138', textStyle: { color: '#fff0e9' } },
    series: [{
      type: 'line', data: dashboardData.steam.flowSeries, smooth: true, showSymbol: false,
      lineStyle: { width: 2, color: '#ff8a24' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(255, 138, 36, .32)' }, { offset: 1, color: 'rgba(255, 113, 56, .02)' }],
        },
      },
      markArea: {
        silent: true,
        itemStyle: { color: 'rgba(125, 153, 164, .13)' },
        data: [[{ yAxis: 42 }, { yAxis: 55 }]],
      },
      markLine: {
        silent: true,
        symbol: 'none',
        label: { show: false },
        lineStyle: { color: 'rgba(105, 178, 197, .72)', width: 1, type: 'dashed' },
        data: [{ yAxis: 50 }],
      },
      markPoint: { symbolSize: 7, label: { show: false }, itemStyle: { color: '#ffd09b' }, data: [{ coord: [11, 98] }] },
    }],
  },
}
