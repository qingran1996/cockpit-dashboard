import { createElement as h } from 'react'

export function DashboardModuleStage({ module, children }) {
  return h('div', {
    className: `dashboard-module-stage dashboard-module-stage--${module}`,
    'data-effect': 'center-scale',
  }, children)
}
