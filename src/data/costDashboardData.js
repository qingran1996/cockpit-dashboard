// Source: supplied 大塚化学 proposal, slides 10–19. All figures are demonstrations.
export const costPages = [
  { path: '/cost-overview', key: 'overview', title: '能源费用总览', english: 'ENERGY COST OVERVIEW' },
  { path: '/cost-allocation', key: 'allocation', title: '产线与批次成本', english: 'PRODUCTION COST ACCOUNTING' },
  { path: '/cost-forecast', key: 'forecast', title: '费用预测与偏差', english: 'COST FORECAST & VARIANCE' },
  { path: '/cost-optimization', key: 'optimization', title: '移峰节费分析', english: 'LOAD SHIFTING & SAVINGS' },
]
export const resolveCostPage = (path = '/') => costPages.find(page => page.path === (path.replace(/\/+$/, '') || '/'))
export const energyBills = [
  { name: '电力', quantity: 24000, unit: 'kWh', rate: .8, cost: 19200, previous: 18400, color: '#32a7ff' },
  { name: '蒸汽', quantity: 80, unit: 't', rate: 280, cost: 22400, previous: 20440, color: '#ffa94d' },
  { name: '水', quantity: 600, unit: 'm³', rate: 4, cost: 2400, previous: 2240, color: '#25dfc3' },
]
export const totalCost = energyBills.reduce((sum, item) => sum + item.cost, 0)
export const lines = [
  { name: '摩擦材料产线', direct: 27600, shared: 2040, share: .6, output: 20, total: 29640, unitCost: 1482 },
  { name: '复合材料产线', direct: 13000, shared: 1360, share: .4, output: 16, total: 14360, unitCost: 897.5 },
]
export const batches = [
  { name: 'A01', output: 12, direct: 15960, shared: 1224, total: 17184, plan: 16800, unitCost: 1432 },
  { name: 'A02', output: 8, direct: 11640, shared: 816, total: 12456, plan: 12000, unitCost: 1557 },
]
// Daily splits are illustrative additions; total and 09/10 follow slide 16.
export const forecastDays = ['09/08', '09/09', '09/10', '09/11', '09/12', '09/13', '09/14']
export const forecast = [42000, 44800, 47000, 46200, 41800, 45600, 41200]
export const dailyBudget = 45000
export const tariffs = [
  { name: '谷段', rate: .5, quantity: 8000, color: '#25dfc3' },
  { name: '平段', rate: .8, quantity: 8000, color: '#32a7ff' },
  { name: '峰段', rate: 1.1, quantity: 8000, color: '#ffa94d' },
]
export const shiftScenario = { quantity: 2000, priceDifference: .6, saving: 1200, applicableDays: 250 }
export const money = value => value.toLocaleString('en-US', { maximumFractionDigits: 2 })
