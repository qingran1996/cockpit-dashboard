import { createElement as h } from 'react'

const signals = [
  { label: '实时水流量', value: '42.8', unit: 'm³/h', tone: 'cyan', comparisons: [{ label: '较昨日', value: '-6.2%', tone: 'good' }, { label: '环比上月', value: '-4.1%', tone: 'good' }] },
  { label: '实时电负荷', value: '85.6', unit: 'MW', tone: 'yellow', comparisons: [{ label: '较昨日', value: '+3.2%', tone: 'warning' }, { label: '环比上月', value: '+6.7%', tone: 'warning' }] },
  { label: '实时蒸汽流量', value: '68.5', unit: 't/h', tone: 'orange', comparisons: [{ label: '较昨日', value: '+1.8%', tone: 'warning' }, { label: '环比上月', value: '-2.9%', tone: 'good' }] },
  { label: '最大需量', value: '102.4', unit: 'MW', tone: 'cyan', comparisons: [{ label: '较昨日', value: '-1.5%', tone: 'good' }, { label: '环比上月', value: '+4.3%', tone: 'warning' }] },
  { label: '在线仪表', value: '126', unit: '/ 130', tone: 'green', comparisons: [{ label: '较昨日', value: '+2', tone: 'good' }, { label: '环比上月', value: '+4', tone: 'good' }] },
  { label: '活跃告警', value: '3', unit: '条', tone: 'warning', comparisons: [{ label: '较昨日', value: '-1', tone: 'good' }, { label: '环比上月', value: '+1', tone: 'warning' }] },
]

const signalNameStyle = { whiteSpace: 'nowrap' }

export function CampusEnergyPulse() {
  return h('section', { className: 'campus-energy-pulse', 'aria-label': '园区实时能源脉冲' },
    h('span', { className: 'campus-energy-pulse__label' }, 'LIVE', h('i', { 'aria-hidden': 'true' })),
    signals.map((signal) => h('div', {
      className: `campus-energy-pulse__signal campus-energy-pulse__signal--${signal.tone}`,
      key: signal.label,
    },
    h('div', { className: 'campus-energy-pulse__signal-content' },
      h('span', { style: signalNameStyle }, signal.label),
      h('strong', null, signal.value, h('small', null, signal.unit)),
      h('div', { className: 'campus-energy-pulse__comparisons' }, signal.comparisons.map((item) =>
        h('em', { className: `comparison comparison--${item.tone} homepage-comparison`, key: item.label }, item.label, ' ', h('b', null, item.value)))),
    ),
    )),
  )
}
