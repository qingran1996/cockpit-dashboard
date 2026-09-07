import { createElement as h } from 'react'

export function resolveFactorySceneInterfaceProps(status) {
  return status === 'loading' ? { inert: '', 'aria-hidden': true } : {}
}

export function FactoryModelLoading({ status = 'loading', progress = 0, error = '', unavailable = false, onRetry }) {
  if (unavailable || status === 'ready') return null

  if (status === 'error') {
    return h('section', { className: 'industrial-scene__loader industrial-scene__loader--error', role: 'alert' },
      h('div', { className: 'industrial-scene__loader-error' },
        h('small', null, 'PLANT / V068 · LOAD FAILURE'),
        h('strong', null, '厂区模型未能启动'),
        h('p', null, error || 'GLB 资源加载失败，请检查本地服务与浏览器控制台。'),
        h('button', { type: 'button', onClick: onRetry ?? (() => globalThis.location?.reload()) }, '重新加载'),
      ),
    )
  }

  const safeProgress = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)))

  return h('section', {
    className: 'industrial-scene__loader',
    role: 'status',
    'aria-live': 'polite',
    'aria-label': '厂区模型正在加载',
  },
  h('div', { className: 'industrial-scene__loader-energy', 'aria-hidden': 'true' },
    h('div', { className: 'industrial-scene__loader-orbit' },
      h('i', { className: 'industrial-scene__loader-ring industrial-scene__loader-ring--outer' }),
      h('i', { className: 'industrial-scene__loader-ring industrial-scene__loader-ring--inner' }),
      h('i', { className: 'industrial-scene__loader-ring industrial-scene__loader-ring--axis' }),
      h('b', { className: 'industrial-scene__loader-core' }),
    ),
    h('i', { className: 'industrial-scene__loader-shockwave industrial-scene__loader-shockwave--a' }),
    h('i', { className: 'industrial-scene__loader-shockwave industrial-scene__loader-shockwave--b' }),
  ),
  h('div', { className: 'industrial-scene__loader-readout' },
    h('small', null, 'PLANT / V068 · MESHOPT + WEBP'),
    h('strong', null, `厂区模型载入 ${safeProgress}%`),
    h('div', { className: 'industrial-scene__loader-track', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': safeProgress },
      h('i', { style: { width: `${safeProgress}%` } }),
    ),
  ))
}
