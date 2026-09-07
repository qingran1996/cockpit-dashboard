export const DASHBOARD_MODULES = Object.freeze([
  { id: 'energy', label: '能源驾驶舱' },
  { id: 'aps', label: 'APS排产能耗' },
  { id: 'materials', label: '原材料价格' },
])

const supportedModules = new Set(DASHBOARD_MODULES.map(({ id }) => id))

export function shouldRenderDashboardSideRails(module, surfaceMode = 'campus') {
  return surfaceMode !== 'unity-overlay' && supportedModules.has(module)
}

export function resolveDashboardModule(current = 'energy', action = {}) {
  if (action.type !== 'select' || !supportedModules.has(action.module)) return current
  return action.module
}
