export const factoryCampusRegistry = [
  {
    id: 'main-production-hall', name: '主生产车间', type: '大型生产厂房', status: '正常',
    metricLabel: '当前负荷', metricValue: '78%', temperature: '26°C',
    position: [-8.375, 0, 2.0], size: [14.0, 3.4, 5.6], levels: 1, roofType: 'shallow', accent: 'blue',
  },
  {
    id: 'central-processing-hall', name: '中央处理车间', type: '连续生产厂房', status: '正常',
    metricLabel: '处理能力', metricValue: '86 t/h', temperature: '29°C',
    position: [2.0, 0, -5.875], size: [11.8, 3.4, 3.8], levels: 2, roofType: 'shallow', accent: 'cyan',
  },
  {
    id: 'rear-high-bay', name: '后区高跨车间', type: '高跨生产厂房', status: '正常',
    metricLabel: '设备稼动率', metricValue: '91%', temperature: '27°C',
    position: [1.125, 0, -11.25], size: [8.6, 4.5, 3.6], levels: 2, roofType: 'shallow', accent: 'blue',
  },
  {
    id: 'north-east-workshop', name: '东北辅助车间', type: '生产辅助设施', status: '正常',
    metricLabel: '当前负荷', metricValue: '64%', temperature: '25°C',
    position: [10.0, 0, -13.5], size: [4.8, 2.7, 3.1], levels: 1, roofType: 'flat', accent: 'neutral',
  },
  {
    id: 'east-process-hall', name: '东区工艺车间', type: '工艺生产厂房', status: '正常',
    metricLabel: '生产效率', metricValue: '84%', temperature: '28°C',
    position: [14.375, 0, -8.75], size: [5.8, 2.9, 3.2], levels: 1, roofType: 'flat', accent: 'blue',
  },
  {
    id: 'right-utility', name: '东区动力站', type: '公用工程设施', status: '正常',
    metricLabel: '能源负荷', metricValue: '68%', temperature: '31°C',
    position: [21.25, 0, -9.375], size: [3.9, 2.5, 2.9], levels: 2, roofType: 'stepped', accent: 'cyan',
  },
  {
    id: 'right-warehouse', name: '东区成品仓库', type: '仓储设施', status: '正常',
    metricLabel: '仓储占用率', metricValue: '73%', temperature: '23°C',
    position: [16.0, 0, -.25], size: [8.6, 3.0, 3.8], levels: 1, roofType: 'shallow', accent: 'cyan',
  },
  {
    id: 'front-warehouse', name: '前区原料仓库', type: '仓储设施', status: '正常',
    metricLabel: '仓储占用率', metricValue: '66%', temperature: '22°C',
    position: [6.5, 0, 7.625], size: [9.6, 3.1, 4.2], levels: 1, roofType: 'shallow', accent: 'blue',
  },
  {
    id: 'front-utility-annex', name: '前区公用工程间', type: '公用辅助设施', status: '正常',
    metricLabel: '设备在线率', metricValue: '94%', temperature: '25°C',
    position: [14.375, 0, 5.375], size: [3.0, 2.0, 2.2], levels: 1, roofType: 'flat', accent: 'neutral',
  },
  {
    id: 'laboratory', name: '质量检测中心', type: '检验研发设施', status: '正常',
    metricLabel: '设备在线率', metricValue: '96%', temperature: '24°C',
    position: [8.75, 0, 12.13], size: [4.8, 1.9, 1.8], levels: 1, roofType: 'flat', accent: 'neutral',
  },
  {
    id: 'administration', name: '园区管理中心', type: '综合办公楼', status: '正常',
    metricLabel: '当前用电', metricValue: '12.8 MW', temperature: '24°C',
    position: [-3.125, 0, 14.625], size: [5.6, 4.5, 3.7], levels: 4, roofType: 'flat', accent: 'cyan',
  },
  {
    id: 'gatehouse', name: '园区门卫室', type: '出入口设施', status: '正常',
    metricLabel: '通行状态', metricValue: '畅通', temperature: '24°C',
    position: [-15.0, 0, 18.5], size: [1.8, 1.5, 1.5], levels: 1, roofType: 'flat', accent: 'neutral',
  },
]

export const factoryCampusReferenceFrame = Object.freeze({
  width: 1992,
  height: 1270,
  tolerancePixels: 18,
  roofCenters: Object.freeze({
    'main-production-hall': Object.freeze([720, 570]),
    'central-processing-hall': Object.freeze([1110, 510]),
    'rear-high-bay': Object.freeze([1125, 405]),
    'north-east-workshop': Object.freeze([1390, 460]),
    'east-process-hall': Object.freeze([1500, 540]),
    'right-utility': Object.freeze([1720, 580]),
    'right-warehouse': Object.freeze([1535, 680]),
    'front-warehouse': Object.freeze([1140, 775]),
    'front-utility-annex': Object.freeze([1445, 825]),
    laboratory: Object.freeze([1190, 925]),
    administration: Object.freeze([680, 810]),
    gatehouse: Object.freeze([196, 910]),
  }),
})

export const factoryCampusById = new Map(
  factoryCampusRegistry.map((record) => [record.id, record]),
)
