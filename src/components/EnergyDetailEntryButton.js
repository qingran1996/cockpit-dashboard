import { createElement as h } from 'react'

export function EnergyDetailEntryButton({ resource, title, onOpen }) {
  return h('button', {
    type: 'button',
    className: `energy-detail-entry energy-detail-entry--${resource}`,
    'aria-label': `查看${title}详情`,
    onClick: onOpen,
  },
  h('i', { className: 'energy-detail-entry__rail', 'aria-hidden': 'true' }),
  h('span', null, '运行详情'),
  h('i', { className: 'energy-detail-entry__arrow', 'aria-hidden': 'true' }, '›'))
}
