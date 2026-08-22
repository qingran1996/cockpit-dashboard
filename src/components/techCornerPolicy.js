const primaryResourcePanels = new Set(['water-panel', 'power-panel', 'steam-panel'])

export function resolveTechCornerPolicy(className = '') {
  const classes = className.split(/\s+/).filter(Boolean)
  return classes.some((name) => primaryResourcePanels.has(name))
    ? 'tech-panel--hide-top-corners'
    : ''
}
