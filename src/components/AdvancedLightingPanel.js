import { createElement as h } from 'react'

function colorHex(value) {
  return `#${Math.min(0xffffff, Math.max(0, Number(value) || 0)).toString(16).padStart(6, '0')}`
}

function formatValue(parameter, value) {
  if (parameter.type === 'color') return colorHex(value).toUpperCase()
  const precision = (String(parameter.step).split('.')[1] ?? '').length
  return `${Number(value).toFixed(Math.min(4, precision))}${parameter.unit ?? ''}`
}

function ParameterControl({ parameter, value, onChange }) {
  const id = `campus-lighting-${parameter.key}`
  if (parameter.type === 'color') {
    const hex = colorHex(value)
    return h('div', { className: 'advanced-lighting-panel__parameter advanced-lighting-panel__parameter--color' },
      h('label', { htmlFor: id }, parameter.label),
      h('span', null, formatValue(parameter, value)),
      h('input', {
        id,
        type: 'color',
        value: hex,
        'aria-label': parameter.label,
        onChange: (event) => onChange?.(parameter.key, event.currentTarget.value),
      }),
    )
  }
  const percent = ((Number(value) - parameter.min) / (parameter.max - parameter.min)) * 100
  return h('div', { className: 'advanced-lighting-panel__parameter', style: { '--parameter-percent': `${Math.min(100, Math.max(0, percent))}%` } },
    h('label', { htmlFor: id }, parameter.label),
    h('output', { htmlFor: id }, formatValue(parameter, value)),
    h('input', {
      id,
      type: 'range',
      min: parameter.min,
      max: parameter.max,
      step: parameter.step,
      value,
      'aria-label': parameter.label,
      'aria-valuetext': formatValue(parameter, value),
      onChange: (event) => onChange?.(parameter.key, event.currentTarget.value),
    }),
  )
}

export function AdvancedLightingPanel({
  open,
  mode,
  profile,
  groups,
  activeGroup,
  onClose,
  onGroupChange,
  onParameterChange,
  onResetMode,
  onResetAll,
}) {
  const group = groups.find((entry) => entry.id === activeGroup) ?? groups[0]
  return h('aside', {
    id: 'campus-lighting-panel',
    className: 'advanced-lighting-panel',
    hidden: !open,
    'aria-label': '高级光照参数',
  },
  h('header', { className: 'advanced-lighting-panel__header' },
    h('span', { className: 'advanced-lighting-panel__vector', 'aria-hidden': 'true', style: {
      '--sun-elevation': `${profile.keyElevation}deg`,
      '--sun-azimuth': `${profile.keyAzimuth}deg`,
    } }, h('i')),
    h('span', null, h('strong', null, '光照参数'), h('small', null, mode === 'evening' ? '傍晚配置 · 实时应用' : '日间配置 · 实时应用')),
    h('button', { type: 'button', 'aria-label': '关闭高级光照参数', onClick: onClose }, '×'),
  ),
  h('div', { className: 'advanced-lighting-panel__tabs', role: 'tablist', 'aria-label': '光照参数分组' },
    ...groups.map((entry) => h('button', {
      key: entry.id,
      type: 'button',
      role: 'tab',
      'aria-selected': entry.id === group.id,
      onClick: () => onGroupChange?.(entry.id),
    }, entry.label)),
  ),
  h('div', { className: 'advanced-lighting-panel__body', role: 'tabpanel', 'aria-label': group.label },
    ...group.parameters.map((parameter) => h(ParameterControl, {
      key: parameter.key,
      parameter,
      value: profile[parameter.key],
      onChange: onParameterChange,
    })),
  ),
  h('footer', { className: 'advanced-lighting-panel__footer' },
    h('button', { type: 'button', onClick: onResetMode }, '恢复当前模式'),
    h('button', { type: 'button', onClick: onResetAll }, '全部恢复'),
  ))
}
