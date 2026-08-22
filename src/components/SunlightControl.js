import { createElement as h } from 'react'
import { clampCampusSunlight } from '../scene/campusSunlight.js'

export function SunlightControl({ value, mode, onChange, onModeChange, advancedOpen = false, onAdvancedToggle }) {
  const safeValue = clampCampusSunlight(value)
  return h('div', {
    className: 'scene-lighting-console',
    role: 'group',
    'aria-label': '厂区光照控制',
    style: { '--sunlight-percent': `${safeValue}%` },
  },
  h('div', { className: 'scene-sunlight-control' },
    h('div', { className: 'scene-sunlight-control__readout' },
      h('span', { className: 'scene-sunlight-control__sun', 'aria-hidden': 'true' }, '☼'),
      h('label', { htmlFor: 'campus-sunlight' }, '阳光强度'),
      h('output', { htmlFor: 'campus-sunlight' }, `${safeValue}%`),
      h('button', {
        type: 'button',
        className: 'scene-sunlight-control__advanced',
        'aria-label': advancedOpen ? '关闭高级光照参数' : '打开高级光照参数',
        'aria-expanded': advancedOpen,
        'aria-controls': 'campus-lighting-panel',
        onClick: onAdvancedToggle,
      }, '调'),
    ),
    h('input', {
      id: 'campus-sunlight',
      type: 'range',
      min: 0,
      max: 100,
      step: 1,
      value: safeValue,
      'aria-label': '阳光强度',
      'aria-valuetext': `${safeValue}%`,
      onChange: (event) => onChange(clampCampusSunlight(event.currentTarget.value)),
    }),
  ),
  h('div', { className: 'scene-lighting-toggle', role: 'group', 'aria-label': '厂区照明模式' },
    h('button', { type: 'button', 'aria-pressed': mode === 'day', onClick: () => onModeChange('day') }, '日间'),
    h('button', { type: 'button', 'aria-pressed': mode === 'evening', onClick: () => onModeChange('evening') }, '傍晚'),
  ))
}
