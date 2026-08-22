const supportedResources = new Set(['water', 'power', 'steam'])

export function resolveEnergyDetail(current, action) {
  if (!action || typeof action.type !== 'string') return current

  if (action.type === 'open') {
    if (!supportedResources.has(action.resource)) return current
    return { resource: action.resource, tab: '总览' }
  }

  if (action.type === 'close' || action.type === 'escape') return null

  if (action.type === 'tab') {
    if (!current || typeof action.tab !== 'string' || !action.tab.trim()) return current
    return { ...current, tab: action.tab }
  }

  return current
}
