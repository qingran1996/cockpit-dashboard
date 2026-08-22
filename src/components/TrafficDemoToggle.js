import { createElement as h } from 'react'

export function TrafficDemoToggle({ active, onToggle }) {
  return h('button', {
    type: 'button',
    className: 'traffic-demo-toggle',
    'aria-pressed': active,
    'aria-label': active ? '暂停交通演示' : '启动交通演示',
    onClick: onToggle,
  },
  h('span', { className: 'traffic-demo-toggle__route', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
  h('span', { className: 'traffic-demo-toggle__copy' },
    h('small', null, active ? 'TRAFFIC LIVE' : 'TRAFFIC PAUSED'),
    h('strong', null, active ? '交通运行中' : '交通已暂停'),
  ),
  h('span', { className: 'traffic-demo-toggle__status', 'aria-hidden': 'true' }))
}
