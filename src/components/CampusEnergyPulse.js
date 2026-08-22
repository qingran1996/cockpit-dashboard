import { createElement as h } from 'react'

const signals = [
  { label: '实时水流量', value: '42.8', unit: 'm³/h', status: '稳定', tone: 'cyan' },
  { label: '实时电负荷', value: '85.6', unit: 'MW', status: '负荷率 78%', tone: 'cyan' },
  { label: '实时蒸汽流量', value: '68.5', unit: 't/h', status: '供汽正常', tone: 'orange' },
  { label: '最大需量', value: '102.4', unit: 'MW', status: '14:20', tone: 'cyan' },
  { label: '在线仪表', value: '126', unit: '/ 130', status: '96.9%', tone: 'green' },
  { label: '活跃告警', value: '3', unit: '条', status: '1条重要', tone: 'warning' },
]

const signalNameStyle = { gridColumn: '2', whiteSpace: 'nowrap' }

export function CampusEnergyPulse() {
  return h('section', { className: 'campus-energy-pulse', 'aria-label': '园区实时能源脉冲' },
    h('span', { className: 'campus-energy-pulse__label' }, 'LIVE', h('i', { 'aria-hidden': 'true' })),
    signals.map((signal) => h('div', {
      className: `campus-energy-pulse__signal campus-energy-pulse__signal--${signal.tone}`,
      key: signal.label,
    },
    h('span', { style: signalNameStyle }, signal.label),
    h('strong', null, signal.value, h('small', null, signal.unit)),
    h('em', null, signal.status),
    )),
  )
}
