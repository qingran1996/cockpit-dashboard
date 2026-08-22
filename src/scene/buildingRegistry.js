const floorPlans = {
  'main-production-hall': [
    { id: 'L01', name: '一层生产作业区', usage: '主生产线与物流通道', level: 1, tone: 'cyan' },
    { id: 'L02', name: '二层设备夹层', usage: '机电设备与检修平台', level: 2, tone: 'orange' },
    { id: 'RF', name: '屋面设备层', usage: '通风、采光与排烟设施', level: 3, tone: 'orange' },
  ],
  'central-processing-hall': [
    { id: 'L01', name: '一层连续生产区', usage: '连续化工艺生产空间', level: 1, tone: 'cyan' },
    { id: 'L02', name: '二层管线夹层', usage: '工艺管线与巡检通道', level: 2, tone: 'orange' },
    { id: 'RF', name: '屋面设备层', usage: '通风与环保处理设备', level: 3, tone: 'orange' },
  ],
  'rear-high-bay': [
    { id: 'L01', name: '一层高跨作业区', usage: '大型设备与吊装作业', level: 1, tone: 'cyan' },
    { id: 'L02', name: '二层检修平台', usage: '设备检修与观察平台', level: 2, tone: 'orange' },
    { id: 'RF', name: '屋面设备层', usage: '高跨排风与采光设施', level: 3, tone: 'orange' },
  ],
  'north-east-workshop': [
    { id: 'L01', name: '一层辅助生产区', usage: '辅助生产与物料周转', level: 1, tone: 'cyan' },
    { id: 'RF', name: '屋面设备层', usage: '通风与屋面检修空间', level: 2, tone: 'orange' },
  ],
  'east-process-hall': [
    { id: 'L01', name: '一层工艺作业区', usage: '工艺设备与操作岗位', level: 1, tone: 'cyan' },
    { id: 'L02', name: '二层管线夹层', usage: '公用管线与仪表桥架', level: 2, tone: 'orange' },
    { id: 'RF', name: '屋面设备层', usage: '排风与维护空间', level: 3, tone: 'orange' },
  ],
  'far-east-utility': [
    { id: 'L01', name: '一层公用工程区', usage: '动力与公用工程设备', level: 1, tone: 'cyan' },
    { id: 'RF', name: '屋面设备平台', usage: '室外机组与检修平台', level: 2, tone: 'orange' },
  ],
  'east-warehouse': [
    { id: 'L01', name: '一层成品仓储区', usage: '成品存储与出入库作业', level: 1, tone: 'cyan' },
    { id: 'L02', name: '二层货架夹层', usage: '轻型物料与盘点通道', level: 2, tone: 'cyan' },
    { id: 'RF', name: '屋面设备层', usage: '消防排烟与采光设施', level: 3, tone: 'orange' },
  ],
  'front-warehouse': [
    { id: 'L01', name: '一层原料仓储区', usage: '原料存储与收发作业', level: 1, tone: 'cyan' },
    { id: 'L02', name: '二层货架夹层', usage: '辅料存储与盘点通道', level: 2, tone: 'cyan' },
    { id: 'RF', name: '屋面设备层', usage: '消防排烟与采光设施', level: 3, tone: 'orange' },
  ],
  'front-utility-annex': [
    { id: 'L01', name: '一层辅助设备区', usage: '公用辅助设备与配电', level: 1, tone: 'cyan' },
    { id: 'RF', name: '屋面维护层', usage: '设备维护与通风空间', level: 2, tone: 'orange' },
  ],
  laboratory: [
    { id: 'L01', name: '一层样品处理区', usage: '收样、制样与留样空间', level: 1, tone: 'cyan' },
    { id: 'L02', name: '二层分析实验区', usage: '仪器分析与质量检测', level: 2, tone: 'cyan' },
    { id: 'RF', name: '屋面设备层', usage: '实验排风与净化设备', level: 3, tone: 'orange' },
  ],
  administration: [
    { id: 'L01', name: '一层接待服务区', usage: '园区接待与综合服务', level: 1, tone: 'cyan' },
    { id: 'L02', name: '二层综合办公区', usage: '行政办公与协同空间', level: 2, tone: 'cyan' },
    { id: 'L03', name: '三层会议指挥区', usage: '会议、调度与应急指挥', level: 3, tone: 'cyan' },
  ],
  gatehouse: [
    { id: 'L01', name: '一层门岗值守区', usage: '人员车辆核验与值守', level: 1, tone: 'cyan' },
    { id: 'RF', name: '屋面设备层', usage: '门禁通信与维护设备', level: 2, tone: 'orange' },
  ],
}

export const campusPlan = Object.freeze({
  scale: Math.SQRT2,
  width: 58 * Math.SQRT2,
  depth: 42 * Math.SQRT2,
})

export const buildingRegistry = [
  { id: 'main-production-hall', nodeName: 'BLDG__main-production-hall', name: '主生产车间', type: '核心生产厂房', status: '正常', metricLabel: '当前负荷', metricValue: '82%', temperature: '26°C', position: [10, 1.9, -.5], size: [16.8, 3.8, 7], tone: 'cyan', model: 'factory' },
  { id: 'central-processing-hall', nodeName: 'BLDG__central-processing-hall', name: '中央处理车间', type: '连续化生产厂房', status: '正常', metricLabel: '当前负荷', metricValue: '76%', temperature: '29°C', position: [-2.5, 1.725, 5.9], size: [12.9, 3.45, 5.1], tone: 'cyan', model: 'factory' },
  { id: 'rear-high-bay', nodeName: 'BLDG__rear-high-bay', name: '后区高跨厂房', type: '高跨生产设施', status: '正常', metricLabel: '设备利用率', metricValue: '69%', temperature: '25°C', position: [0, 2.85, 13], size: [10.7, 5.7, 4.5], tone: 'cyan', model: 'factory' },
  { id: 'north-east-workshop', nodeName: 'BLDG__north-east-workshop', name: '东北辅助车间', type: '辅助生产厂房', status: '正常', metricLabel: '当前负荷', metricValue: '61%', temperature: '24°C', position: [-11.5, 1.55, 12.5], size: [5.9, 3.1, 3.4], tone: 'cyan', model: 'factory' },
  { id: 'east-process-hall', nodeName: 'BLDG__east-process-hall', name: '东区工艺车间', type: '工艺生产厂房', status: '正常', metricLabel: '当前负荷', metricValue: '73%', temperature: '27°C', position: [-14, 1.675, 5], size: [6.7, 3.35, 4.1], tone: 'cyan', model: 'factory' },
  { id: 'far-east-utility', nodeName: 'BLDG__far-east-utility', name: '东端公用工程站', type: '公用工程设施', status: '正常', metricLabel: '运行负荷', metricValue: '58%', temperature: '31°C', position: [-22, 1.15, -3.2], size: [3.6, 2.3, 2.7], tone: 'orange', model: 'factory' },
  { id: 'east-warehouse', nodeName: 'BLDG__east-warehouse', name: '东区成品仓库', type: '仓储设施', status: '正常', metricLabel: '库容占用', metricValue: '67%', temperature: '22°C', position: [-14, 1.5, -2.2], size: [7.9, 3, 4.5], tone: 'cyan', model: 'factory' },
  { id: 'front-warehouse', nodeName: 'BLDG__front-warehouse', name: '前区原料仓库', type: '原料仓储设施', status: '正常', metricLabel: '库容占用', metricValue: '71%', temperature: '23°C', position: [-3, 1.6, -10], size: [8.1, 3.2, 3.4], tone: 'cyan', model: 'factory' },
  { id: 'front-utility-annex', nodeName: 'BLDG__front-utility-annex', name: '前区辅助用房', type: '公用辅助设施', status: '正常', metricLabel: '运行负荷', metricValue: '46%', temperature: '25°C', position: [-12, 1, -10.5], size: [3.4, 2, 2.25], tone: 'orange', model: 'factory' },
  { id: 'laboratory', nodeName: 'BLDG__laboratory', name: '分析化验楼', type: '质量分析设施', status: '正常', metricLabel: '设备在线率', metricValue: '94%', temperature: '22°C', position: [-19, 2.05, -10.5], size: [3.7, 4.1, 2], tone: 'cyan', model: 'office' },
  { id: 'administration', nodeName: 'BLDG__administration', name: '综合管理中心', type: '园区行政办公楼', status: '正常', metricLabel: '当前负荷', metricValue: '53%', temperature: '23°C', position: [9.5, 3.1, -11.3], size: [8.4, 6.2, 5.4], tone: 'cyan', model: 'office' },
  { id: 'gatehouse', nodeName: 'BLDG__gatehouse', name: '园区门卫室', type: '出入口管理设施', status: '正常', metricLabel: '今日通行', metricValue: '286 辆', temperature: '24°C', position: [23.2, 1, -14.7], size: [2.3, 2, 1.7], tone: 'orange', model: 'office' },
].map((record) => ({
  ...record,
  position: [record.position[0] * campusPlan.scale, record.position[1], record.position[2] * campusPlan.scale],
  floors: floorPlans[record.id],
}))

export const buildingById = new Map(buildingRegistry.map((record) => [record.id, record]))
