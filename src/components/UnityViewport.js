import { createElement as h } from 'react'

export function UnityViewport() {
  return h('section', {
    className: 'unity-viewport',
    'aria-label': 'Unity 厂区模型透明视口',
  },
  h('span', { className: 'unity-viewport__corner unity-viewport__corner--tl', 'aria-hidden': 'true' }),
  h('span', { className: 'unity-viewport__corner unity-viewport__corner--tr', 'aria-hidden': 'true' }),
  h('span', { className: 'unity-viewport__corner unity-viewport__corner--bl', 'aria-hidden': 'true' }),
  h('span', { className: 'unity-viewport__corner unity-viewport__corner--br', 'aria-hidden': 'true' }),
  )
}
