import { createElement as h } from 'react'

export function CampusFocusToggle({ active, onToggle }) {
  return h('button', {
    type: 'button',
    className: 'campus-focus-toggle',
    'aria-pressed': active,
    'aria-label': active ? '恢复全部监控面板' : '只看中间厂区建模',
    onClick: onToggle,
  },
  h('span', { className: 'campus-focus-toggle__reticle', 'aria-hidden': 'true' }, h('i'), h('i')),
  h('span', { className: 'campus-focus-toggle__copy' },
    h('small', null, active ? 'FOCUS VIEW' : 'CAMPUS VIEW'),
    h('strong', null, active ? '恢复面板' : '专注厂区'),
  ),
  h('span', { className: 'campus-focus-toggle__status', 'aria-hidden': 'true' }))
}
