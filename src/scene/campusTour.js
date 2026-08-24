function freezeStop(stop) {
  return Object.freeze({
    ...stop,
    position: Object.freeze(stop.position),
    target: Object.freeze(stop.target),
  })
}

export const CAMPUS_TOUR_STOPS = Object.freeze([
  freezeStop({ id: 'gate', label: '园区入口', caption: '车辆门禁与访客核验', position: [44, 12, -35], target: [31, 1.2, -21], transitionMs: 2200, holdMs: 3200 }),
  freezeStop({ id: 'administration', label: '综合管理中心', caption: '行政接待与生产指挥', position: [34, 17, -25], target: [13.5, 3, -16], transitionMs: 2400, holdMs: 3400 }),
  freezeStop({ id: 'production', label: '主生产区', caption: '核心车间与物流通道', position: [34, 20, 9], target: [13, 2.3, -1], transitionMs: 2600, holdMs: 3600 }),
  freezeStop({ id: 'processing', label: '中央处理区', caption: '连续生产与高跨作业', position: [-10, 19, 31], target: [-3, 2.5, 10], transitionMs: 2500, holdMs: 3400 }),
  freezeStop({ id: 'utilities', label: '公用工程区', caption: '动力站与工艺保障设施', position: [-45, 16, 2], target: [-28, 2, -4], transitionMs: 2500, holdMs: 3300 }),
  freezeStop({ id: 'warehouse', label: '仓储物流区', caption: '原料、成品与装卸调度', position: [-31, 15, -29], target: [-13, 2, -11], transitionMs: 2500, holdMs: 3300 }),
  freezeStop({ id: 'overview', label: '厂区总览', caption: '全园区运行态势复核', position: [-47, 29, -58], target: [0, 1.4, -3.2], transitionMs: 2800, holdMs: 4200 }),
])

export function normalizeCampusTourIndex(index) {
  const length = CAMPUS_TOUR_STOPS.length
  const safeIndex = Math.trunc(Number(index) || 0)
  return ((safeIndex % length) + length) % length
}

export function resolveCampusTourStop(index) {
  return CAMPUS_TOUR_STOPS[normalizeCampusTourIndex(index)]
}
