export const buildingRegistry = [
  { id: 'water-tank-a', name: '一号储水罐', type: '水资源储备', status: '正常', metricLabel: '当前储量', metricValue: '86%', temperature: '18°C', position: [-8.4, 1.6, -4.8], size: [2.4, 3.2, 2.4], tone: 'cyan', model: 'tank' },
  { id: 'water-tank-b', name: '二号储水罐', type: '水资源储备', status: '正常', metricLabel: '当前储量', metricValue: '78%', temperature: '19°C', position: [-5.5, 1.9, -6.5], size: [2.5, 3.8, 2.5], tone: 'orange', model: 'tank' },
  { id: 'water-tank-c', name: '净水处理罐', type: '水处理设施', status: '正常', metricLabel: '处理能力', metricValue: '52 t/h', temperature: '21°C', position: [-9.6, 1.25, -1.3], size: [2.1, 2.5, 2.1], tone: 'cyan', model: 'tank' },
  { id: 'water-tower', name: '园区高架水塔', type: '稳压供水设施', status: '正常', metricLabel: '液位', metricValue: '72%', temperature: '18°C', position: [-2.8, 2.5, -7.4], size: [2.6, 5.0, 2.6], tone: 'cyan', model: 'waterTower' },
  { id: 'heat-factory-a', name: '热能转换中心', type: '热能厂房', status: '正常', metricLabel: '转换效率', metricValue: '82.6%', temperature: '285°C', position: [-2.0, 1.35, -1.2], size: [4.8, 2.7, 4.0], tone: 'orange', model: 'factory' },
  { id: 'heat-factory-b', name: '蒸汽动力站', type: '蒸汽厂房', status: '正常', metricLabel: '蒸汽流量', metricValue: '68.5 t/h', temperature: '272°C', position: [-5.2, 1.0, 3.4], size: [3.6, 2.0, 3.1], tone: 'orange', model: 'factory' },
  { id: 'chimney-main', name: '主排放烟囱', type: '烟气处理设施', status: '正常', metricLabel: '排放浓度', metricValue: '12 mg/m³', temperature: '168°C', position: [2.6, 3.9, -6.0], size: [1.1, 7.8, 1.1], tone: 'orange', model: 'chimney' },
  { id: 'chimney-a', name: '一号处理塔', type: '烟气处理设施', status: '正常', metricLabel: '运行负荷', metricValue: '66%', temperature: '118°C', position: [0.1, 2.7, -6.7], size: [.8, 5.4, .8], tone: 'cyan', model: 'chimney' },
  { id: 'chimney-b', name: '二号处理塔', type: '烟气处理设施', status: '正常', metricLabel: '运行负荷', metricValue: '71%', temperature: '126°C', position: [5.5, 2.8, -5.4], size: [1.2, 5.6, 1.2], tone: 'cyan', model: 'chimney' },
  { id: 'office-a', name: '能源调度中心', type: '园区办公楼', status: '正常', metricLabel: '当前负荷', metricValue: '68%', temperature: '24°C', position: [7.0, 2.0, -2.9], size: [3.8, 4.0, 3.2], tone: 'cyan', model: 'office' },
  { id: 'office-b', name: '综合管理中心', type: '园区办公楼', status: '正常', metricLabel: '当前负荷', metricValue: '53%', temperature: '23°C', position: [8.4, 1.6, 2.2], size: [4.1, 3.2, 3.4], tone: 'cyan', model: 'office' },
  { id: 'control-center', name: '智慧能源控制中心', type: '能源控制设施', status: '正常', metricLabel: '实时用电', metricValue: '85.6 MW', temperature: '22°C', position: [2.4, 1.45, 4.7], size: [5.4, 2.9, 4.1], tone: 'cyan', model: 'controlCenter' },
]

export const buildingById = new Map(buildingRegistry.map((record) => [record.id, record]))
