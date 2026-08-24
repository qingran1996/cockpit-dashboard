import { createElement as h } from 'react'
import { resolveEnergyTabView } from '../energyDetailTabView.js'
import { EnergyDetailEChart } from './EnergyDetailEChart.js'
import { EnergyFooterEChart } from './EnergyFooterECharts.js'
import { EnergySideEChart } from './EnergySideECharts.js'

function TrendChart({ trend, tone }) {
  const values = [...trend.current, ...trend.previous]
  const ceiling = Math.max(...values, trend.threshold ?? 0) * 1.08 || 1
  const toPoints = (series) => series.map((value, index) => {
    const x = series.length === 1 ? 50 : (index / (series.length - 1)) * 100
    const y = 92 - (value / ceiling) * 76
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')

  const children = [
    h('title', { key: 'title' }, `${trend.title}，当前值与昨日对比`),
    h('desc', { key: 'desc' }, `${trend.labels.join('、')}时段的${trend.unit}趋势`),
    ...[20, 44, 68, 92].map((y) => h('line', { key: `grid-${y}`, x1: 0, y1: y, x2: 100, y2: y, className: 'energy-detail-chart__grid' })),
    h('polyline', { key: 'previous', points: toPoints(trend.previous), className: 'energy-detail-chart__line energy-detail-chart__line--previous' }),
    h('polyline', { key: 'current', points: toPoints(trend.current), className: `energy-detail-chart__line energy-detail-chart__line--${tone}` }),
  ]

  if (trend.threshold) {
    const thresholdY = 92 - (trend.threshold / ceiling) * 76
    children.push(h('line', { key: 'threshold', x1: 0, y1: thresholdY, x2: 100, y2: thresholdY, className: 'energy-detail-chart__threshold' }))
  }

  const latest = trend.current.at(-1)
  const previousLatest = trend.previous.at(-1)
  const peak = Math.max(...trend.current)
  const average = trend.current.reduce((total, value) => total + value, 0) / trend.current.length
  const comparison = previousLatest ? ((latest - previousLatest) / previousLatest) * 100 : 0

  return h('div', { className: 'energy-detail-chart' },
    h('div', { className: 'energy-detail-section__heading' },
      h('h3', null, trend.title),
      h('span', null, `单位：${trend.unit}`),
    ),
    h('div', { className: 'energy-detail-chart__legend', 'aria-hidden': 'true' },
      h('span', null, h('i', { className: `is-${tone}` }), '今日'),
      h('span', null, h('i', { className: 'is-previous' }), '昨日'),
    ),
    h('div', { className: 'energy-detail-chart__stats', role: 'group', 'aria-label': '趋势摘要' },
      [
        ['当前', latest.toFixed(1)],
        ['峰值', peak.toFixed(1)],
        ['平均', average.toFixed(1)],
        ['较昨日', `${comparison >= 0 ? '+' : ''}${comparison.toFixed(1)}%`],
      ].map(([label, value]) => h('span', { key: label }, label, h('strong', null, value))),
    ),
    h('svg', { viewBox: '0 0 100 100', role: 'img', 'aria-label': `${trend.title}趋势图`, preserveAspectRatio: 'none' }, children),
    h('div', { className: 'energy-detail-chart__axis', 'aria-hidden': 'true' }, trend.labels.map((label) => h('span', { key: label }, label))),
  )
}

function Breakdown({ detail }) {
  return h('section', { className: 'energy-detail-section energy-detail-breakdown', 'aria-label': '分项占比' },
    h('div', { className: 'energy-detail-section__heading' }, h('h3', null, '分项用能'), h('span', null, '实时归集')),
    h(EnergySideEChart, {
      kind: 'breakdown',
      detail,
      tone: detail.tone,
      label: `分项用能玫瑰图：${detail.breakdown.map((item) => `${item.label} ${item.share}%`).join('、')}`,
    }),
  )
}

function Network({ detail, resource }) {
  const healthy = detail.network.filter((node) => node.status === '正常').length
  const attention = detail.network.length - healthy
  const healthRate = Math.round((healthy / Math.max(detail.network.length, 1)) * 100)
  return h('section', { className: 'energy-detail-section energy-detail-network', 'aria-label': resource === 'power' ? '设备运行状态' : '能源网络状态' },
    h('div', { className: 'energy-detail-section__heading' },
      h('h3', null, resource === 'power' ? '配电设备状态' : resource === 'steam' ? '蒸汽管网状态' : '供水管网状态'),
      h('span', null, `正常 ${healthy} · 关注 ${attention}`),
    ),
    h('div', { className: 'energy-detail-network__summary', 'data-network-summary': 'true', 'aria-label': '网络链路摘要' },
      h('span', null, '链路健康', h('strong', null, `${healthRate}%`)),
      h('span', null, '在线节点', h('strong', null, `${healthy}/${detail.network.length}`)),
      h('span', null, '关注节点', h('strong', null, attention)),
    ),
    h(EnergySideEChart, { kind: 'network', detail, tone: detail.tone, label: '能源网络拓扑' }),
  )
}

function AlarmList({ detail }) {
  const alarms = detail.alarms
  const warnings = alarms.filter((alarm) => alarm.level === 'warning').length
  return h('section', { className: 'energy-detail-section energy-detail-alarms', 'aria-label': '运行提醒' },
    h('div', { className: 'energy-detail-section__heading' }, h('h3', null, '运行提醒'), h('span', null, `告警事件流 · ${alarms.length} 条`)),
    h('div', { className: 'energy-detail-alarms__summary', 'aria-label': '告警摘要' },
      h('span', null, '重要', h('strong', null, warnings)),
      h('span', null, '提示', h('strong', null, alarms.length - warnings)),
      h('span', null, '最近更新', h('strong', null, alarms[0]?.time ?? '--')),
    ),
    h(EnergySideEChart, {
      kind: 'alarms',
      detail,
      tone: detail.tone,
      label: `告警时间分布：${alarms.map((alarm) => alarm.title).join('、')}`,
    }),
  )
}

function OperationalDiagnostics({ diagnostics }) {
  return h('section', { className: 'energy-detail__diagnostics', 'aria-label': '运行诊断' },
    h('div', { className: 'energy-detail__diagnostics-title' }, h('b', null, '运行诊断'), h('span', null, 'OPERATION PULSE')),
    diagnostics.map((item) => h('div', { className: 'energy-detail-diagnostic', key: item.label },
      h('span', null, item.label),
      h('strong', null, item.value),
      h('em', null, item.status),
    )),
  )
}

function EnergyOperationsFooter({ resource, detail }) {
  const rankingTitle = resource === 'power' ? '馈线能效排行' : resource === 'steam' ? '用汽能效排行' : '分区用能排行'
  const averageHealth = Math.round(detail.health.reduce((sum, item) => sum + item.percent, 0) / detail.health.length)

  return h('section', { className: 'energy-detail__operations-footer', 'aria-label': `${detail.title}底部运行分析` },
    h('section', { className: 'energy-footer-module energy-footer-ranking', 'aria-label': rankingTitle },
      h('div', { className: 'energy-footer-heading' }, h('h3', null, rankingTitle), h('span', null, '占比 / 实时排序')),
      h(EnergyFooterEChart, { kind: 'ranking', detail, tone: detail.tone, label: rankingTitle }),
    ),
    h('section', { className: 'energy-footer-module energy-footer-closure', 'aria-label': '告警处置闭环' },
      h('div', { className: 'energy-footer-heading' }, h('h3', null, '告警处置闭环'), h('span', null, `${detail.workOrders.length} 项实时工单`)),
      h(EnergyFooterEChart, { kind: 'closure', detail, tone: detail.tone, label: '告警处置闭环' }),
    ),
    h('section', { className: 'energy-footer-module energy-footer-health', 'aria-label': '设备健康' },
      h('div', { className: 'energy-footer-heading' }, h('h3', null, '设备健康'), h('span', null, `综合健康度 ${averageHealth}%`)),
      h(EnergyFooterEChart, { kind: 'health', detail, tone: detail.tone, label: '设备健康雷达' }),
    ),
    h('section', { className: 'energy-footer-module energy-footer-forecast', 'aria-label': detail.forecast.title },
      h('div', { className: 'energy-footer-heading' }, h('h3', null, detail.forecast.title), h('span', null, `单位：${detail.forecast.unit}`)),
      h(EnergyFooterEChart, { kind: 'forecast', detail, tone: detail.tone, label: detail.forecast.title }),
    ),
  )
}

export function EnergyDetailSidecar({ resource, detail, activeTab, onTabChange, onResourceChange, onClose }) {
  const titleId = `energy-detail-title-${resource}`
  const activeView = resolveEnergyTabView(detail, activeTab)
  const focusZone = activeTab === '告警'
    ? 'alarms'
    : ['管网', '设备', '锅炉', '电能质量'].includes(activeTab)
      ? 'network'
      : ['分区', '效率'].includes(activeTab)
        ? 'analysis'
        : 'analysis'

  return h('aside', {
    className: `energy-detail energy-detail--${resource} energy-detail--${detail.tone}`,
    role: 'dialog',
    'aria-modal': 'false',
    'aria-labelledby': titleId,
    'data-active-tab': activeTab,
    'data-focus-zone': focusZone,
  },
  h('header', { className: 'energy-detail__header' },
    h('div', null,
      h('span', { className: 'energy-detail__eyebrow' }, detail.eyebrow),
      h('h2', { id: titleId }, detail.title),
    ),
    h('button', { type: 'button', className: 'energy-detail__return-action energy-detail__header-action', onClick: onClose, 'aria-label': '返回能源首页' },
      h('b', { 'aria-hidden': 'true' }, '‹'),
      h('span', null, '返回首页'),
      h('i', { className: 'energy-detail__return-line', 'aria-hidden': 'true' }),
    ),
  ),
  h('nav', { className: 'energy-detail__tabs', role: 'tablist', 'aria-label': `${detail.title}分类` },
    h('div', { className: 'energy-detail__resource-switcher', 'aria-label': '切换能源类型' },
      [
        ['water', '水'],
        ['power', '电'],
        ['steam', '汽'],
      ].map(([key, label]) => h('button', {
        type: 'button',
        className: `energy-detail__resource-switch${resource === key ? ' is-active' : ''}`,
        'data-resource-switch': key,
        'aria-label': `切换到${key === 'water' ? '水资源' : key === 'power' ? '电力资源' : '蒸汽资源'}详情`,
        'aria-pressed': resource === key,
        key,
        onClick: () => onResourceChange?.(key),
      }, label)),
    ),
    h('div', { className: 'energy-detail__tab-strip' }, detail.tabs.map((tab) => h('button', {
        type: 'button',
        role: 'tab',
        'aria-selected': tab === activeTab,
        className: `energy-detail__tab${tab === activeTab ? ' is-active' : ''}`,
        key: tab,
        onClick: () => onTabChange(tab),
      }, tab)),
    ),
  ),
  h('div', { className: 'energy-detail__metrics', key: `metrics-${activeTab}` }, activeView.metrics.map((metric) => h('div', { className: 'energy-detail-metric', key: metric.label },
    h('span', null, metric.label),
    h('strong', null, metric.value, h('small', null, metric.unit)),
    h('em', null, metric.delta),
  ))),
  h(OperationalDiagnostics, { diagnostics: activeView.diagnostics, key: `diagnostics-${activeTab}` }),
  h('div', { className: 'energy-detail__body' },
    h('div', { className: 'energy-detail__zone energy-detail__zone--analysis', 'data-zone': 'analysis' },
      h(EnergyDetailEChart, { chart: activeView.chart, tone: detail.tone, context: activeView.context, key: `chart-${activeTab}` }),
      h(Breakdown, { detail }),
    ),
    h('div', { className: 'energy-detail__zone energy-detail__zone--operations', 'data-zone': 'operations' },
      h(Network, { detail, resource }),
      h(AlarmList, { detail }),
    ),
  ),
  h(EnergyOperationsFooter, { resource, detail }),
  )
}
