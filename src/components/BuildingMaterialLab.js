import { createElement as h } from 'react'
import { CAMPUS_MATERIAL_FAMILIES, CAMPUS_MATERIAL_SCOPES } from '../scene/campusMaterialLab.js'

const PARAMETERS = [
  { key: 'roughness', label: '粗糙度', min: .45, max: .9, step: .01 },
  { key: 'normalStrength', label: '法线强度', min: 0, max: .3, step: .01 },
  { key: 'aoIntensity', label: 'AO 强度', min: .4, max: 1.2, step: .01 },
  { key: 'textureScale', label: '纹理缩放', min: .5, max: 3, step: .1, suffix: '×' },
  { key: 'environmentIntensity', label: '局部环境反射', min: 0, max: 1.5, step: .01 },
]

function format(parameter, value) {
  const precision = (String(parameter.step).split('.')[1] ?? '').length
  return `${Number(value).toFixed(precision)}${parameter.suffix ?? ''}`
}

function Parameter({ parameter, value, onChange }) {
  const id = `building-material-${parameter.key}`
  const percent = ((Number(value) - parameter.min) / (parameter.max - parameter.min)) * 100
  return h('div', { className: 'building-material-lab__parameter', style: { '--material-value': `${Math.max(0, Math.min(100, percent))}%` } },
    h('label', { htmlFor: id }, parameter.label),
    h('output', { htmlFor: id }, format(parameter, value)),
    h('input', {
      id,
      type: 'range',
      min: parameter.min,
      max: parameter.max,
      step: parameter.step,
      value,
      'aria-label': parameter.label,
      'aria-valuetext': format(parameter, value),
      onChange: (event) => onChange?.(parameter.key, event.currentTarget.value),
    }),
  )
}

export function BuildingMaterialLab({
  building,
  scope = 'facade',
  settings = {},
  onScopeChange,
  onFamilyChange,
  onParameterChange,
  onReset,
  onBack,
}) {
  const activeScope = CAMPUS_MATERIAL_SCOPES.find((entry) => entry.id === scope) ?? CAMPUS_MATERIAL_SCOPES[0]
  const families = CAMPUS_MATERIAL_FAMILIES.filter((family) => family.scopes.includes(activeScope.id))
  return h('aside', { className: 'scene-detail building-material-lab', 'aria-label': '建筑材质实验室', 'aria-live': 'polite' },
    h('header', { className: 'building-material-lab__header' },
      h('div', null,
        h('span', { className: 'scene-detail__eyebrow' }, `MATERIAL LAB / ${building.id.toUpperCase()}`),
        h('h3', null, building.name),
        h('p', null, 'GLB EMBEDDED PBR · 单体隔离预览'),
      ),
      h('button', { type: 'button', 'aria-label': '返回空间面板', onClick: onBack }, '↩'),
    ),
    h('div', { className: 'building-material-lab__scope', role: 'tablist', 'aria-label': '建筑构件范围' },
      ...CAMPUS_MATERIAL_SCOPES.map((entry) => h('button', {
        key: entry.id,
        type: 'button',
        role: 'tab',
        'aria-selected': entry.id === activeScope.id,
        onClick: () => onScopeChange?.(entry.id),
      }, h('small', null, entry.code), h('strong', null, entry.label))),
    ),
    h('section', { className: 'building-material-lab__samples', 'aria-label': `${activeScope.label}材质样板` },
      ...families.map((family) => h('button', {
        key: family.id,
        type: 'button',
        className: 'building-material-lab__sample',
        'data-pattern': family.pattern,
        'aria-pressed': settings.family === family.id,
        onClick: () => onFamilyChange?.(family.id),
      },
      h('i', { 'aria-hidden': 'true' }),
      h('span', null, h('small', null, family.code), h('strong', null, family.label), h('em', null, family.description)))),
    ),
    h('div', { className: 'building-material-lab__channels', 'aria-label': '内嵌纹理通道' },
      ...['Base Color', 'Normal', 'Roughness', 'AO'].map((channel) => h('span', { key: channel }, h('i'), channel)),
    ),
    h('div', { className: 'building-material-lab__controls' },
      h('div', { className: 'building-material-lab__color' },
        h('label', { htmlFor: 'building-material-tint' }, '材质色调'),
        h('output', { htmlFor: 'building-material-tint' }, String(settings.tint ?? '#ffffff').toUpperCase()),
        h('input', {
          id: 'building-material-tint',
          type: 'color',
          value: settings.tint ?? '#ffffff',
          'aria-label': '材质色调',
          onChange: (event) => onParameterChange?.('tint', event.currentTarget.value),
        }),
      ),
      ...PARAMETERS.map((parameter) => h(Parameter, {
        key: parameter.key,
        parameter,
        value: settings[parameter.key],
        onChange: onParameterChange,
      })),
    ),
    h('footer', { className: 'building-material-lab__footer' },
      h('span', null, '256² TILED · GLB 内嵌'),
      h('button', { type: 'button', onClick: onReset }, `恢复${activeScope.label}原材质`),
    ),
  )
}
