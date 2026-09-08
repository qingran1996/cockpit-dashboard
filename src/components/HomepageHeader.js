import { createElement as h } from 'react'
import { DashboardModuleSwitch } from './DashboardModuleSwitch.js'

export function HomepageHeader({ time, lightingMode = 'evening', activeModule = 'energy', onModuleChange = () => {}, showReturnToScene = false }) {
  const isEvening = lightingMode === 'evening'
  return h('header', { className: 'dashboard-header' },
    h('div', { className: 'dashboard-header__status' },
      h('strong', null, h('i', { 'aria-hidden': 'true' }), '系统在线'),
      h('span', null, `数据更新时间：${time}`),
    ),
    h('div', { className: 'dashboard-header__title' },
      h('i', { 'aria-hidden': 'true' }),
      h('h1', null, '大塚综合数字孪生平台'),
      h('i', { 'aria-hidden': 'true' }),
    ),
    h('div', { className: 'dashboard-header__actions' },
      h(DashboardModuleSwitch, { activeModule, onModuleChange }),
      h('div', { className: 'dashboard-header__mode' },
        h('span', null, isEvening ? '傍晚模式' : '日间模式'),
        h('i', { 'aria-hidden': 'true' }, isEvening ? '☾' : '☀'),
      ),
      showReturnToScene && h('button', {
        type: 'button',
        className: 'dashboard-header__return-scene',
        title: '返回场景',
        onClick: () => console.log('UE_DASHBOARD:{"type":"dashboard.close"}'),
      },
      h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' },
        h('path', { d: 'M9 5H4v5M4 5l6 6M13 5h7v15H5v-7' }),
      ),
      h('span', null, '返回场景')),
    ),
  )
}
