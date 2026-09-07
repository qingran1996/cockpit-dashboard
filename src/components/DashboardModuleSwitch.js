import { createElement as h, useState } from 'react'
import { DASHBOARD_MODULES } from '../dashboardModuleState.js'

const secondaryModules = DASHBOARD_MODULES.filter(({ id }) => id !== 'energy')

export function DashboardModuleSwitch({ activeModule = 'energy', onModuleChange = () => {} }) {
  const [open, setOpen] = useState(false)
  const selectedSecondary = secondaryModules.find(({ id }) => id === activeModule) ?? secondaryModules[0]

  const selectModule = (module) => {
    setOpen(false)
    onModuleChange(module)
  }

  return h('nav', {
    className: 'dashboard-module-switch',
    'aria-label': '业务看板切换',
  },
  h('span', { className: 'dashboard-module-switch__border-flow', 'aria-hidden': 'true' }),
  h('button', {
    type: 'button',
    className: `dashboard-module-switch__item dashboard-module-switch__home${activeModule === 'energy' ? ' is-active' : ''}`,
    'data-module': 'energy',
    'aria-current': activeModule === 'energy' ? 'page' : undefined,
    onClick: () => selectModule('energy'),
  },
  h('span', { className: 'dashboard-module-switch__home-content' },
    h('span', { className: 'dashboard-module-switch__icon', 'aria-hidden': 'true' },
      h('i'), h('i'), h('i'), h('i'),
    ),
    h('span', { className: 'dashboard-module-switch__home-label' }, '能源驾驶舱'))),
  h('div', { className: `dashboard-module-switch__dropdown${open ? ' is-open' : ''}` },
    h('button', {
      type: 'button',
      className: `dashboard-module-switch__item dashboard-module-switch__trigger${activeModule !== 'energy' ? ' is-active' : ''}`,
      'data-module': selectedSecondary.id,
      'aria-current': activeModule !== 'energy' ? 'page' : undefined,
      'aria-haspopup': 'menu',
      'aria-expanded': open,
      onClick: () => setOpen((value) => !value),
    }, h('span', { className: 'dashboard-module-switch__trigger-label' }, selectedSecondary.label), h('span', { className: 'dashboard-module-switch__chevron', 'aria-hidden': 'true' })),
    h('div', { className: 'dashboard-module-switch__menu', role: 'menu', hidden: !open }, secondaryModules.map((module) =>
      h('button', {
        key: module.id,
        type: 'button',
        role: 'menuitemradio',
        className: activeModule === module.id ? 'is-selected' : '',
        'aria-checked': activeModule === module.id,
        'data-module': module.id,
        onClick: () => selectModule(module.id),
      }, h('i', { 'aria-hidden': 'true' }), module.label),
    )),
  ),
  )
}
