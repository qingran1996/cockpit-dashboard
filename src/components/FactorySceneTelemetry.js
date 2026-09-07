import { createElement as h } from 'react'

const QUALITY_OPTIONS = [
  { id: 'high', label: '高画质' },
  { id: 'balanced', label: '均衡' },
  { id: 'performance', label: '性能' },
]

function compactTriangles(value) {
  const count = Number(value) || 0
  return count >= 1_000_000 ? `${(count / 1_000_000).toFixed(2)}M` : count.toLocaleString('en-US')
}

export function FactorySceneTelemetry({ quality = 'high', telemetry = {}, onQualityChange = () => {} }) {
  const metrics = [
    ['FPS', telemetry.fps == null ? '—' : telemetry.fps.toFixed(1)],
    ['DRAW', telemetry.calls == null ? '—' : telemetry.calls.toLocaleString('en-US')],
    ['TRIS', telemetry.triangles == null ? '—' : compactTriangles(telemetry.triangles)],
    ['MEM', telemetry.heapMb == null ? 'N/A' : `${telemetry.heapMb} MB`],
  ]
  return h('aside', { className: 'factory-telemetry', 'aria-label': '厂区实时渲染状态' },
    h('header', null,
      h('span', { className: 'factory-telemetry__pulse', 'aria-hidden': 'true' }),
      h('div', null, h('small', null, 'PLANT / V068'), h('strong', null, '夜班渲染在线')),
    ),
    h('dl', null, metrics.map(([label, value]) => h('div', { key: label }, h('dt', null, label), h('dd', null, value)))),
    h('div', { className: 'factory-telemetry__resources' }, `${telemetry.geometries ?? '—'} GEO · ${telemetry.textures ?? '—'} TEX`),
    h('div', { className: 'factory-telemetry__quality', role: 'group', 'aria-label': '渲染画质' },
      QUALITY_OPTIONS.map((option) => h('button', {
        key: option.id,
        type: 'button',
        'aria-pressed': quality === option.id,
        onClick: () => onQualityChange(option.id),
      }, option.label)),
    ),
  )
}
