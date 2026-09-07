import { createElement as h, useState } from 'react'
import { materialPriceDashboardData } from '../data/materialPriceDashboardData.js'

function Panel({ title, action, className = '', children }) {
  return h('section', { className: `material-panel ${className}`.trim() },
    h('header', null, h('h2', null, title), action ? h('button', { type: 'button' }, action) : null),
    h('div', { className: 'material-panel__body' }, children),
  )
}

function FilterRail({ filters, collection }) {
  const [values, setValues] = useState(() => Object.fromEntries(filters.map((filter) => [filter.id, filter.value])))

  return h('section', { className: 'material-filter-rail', 'aria-label': '原材料行情查询条件' },
    filters.map((filter) => h('label', { key: filter.id },
      h('span', null, filter.label),
      h('select', { value: values[filter.id], 'aria-label': `${filter.label}筛选`, onChange: (event) => setValues((current) => ({ ...current, [filter.id]: event.target.value })) },
        filter.options.map((option) => h('option', { value: option, key: option }, option)),
      ),
    )),
    h('button', { type: 'button', className: 'material-monitor-config' }, '⚙ 监测配置'),
    h('div', { className: 'material-collection-state' }, h('span', null, '采集服务'), h('i', { 'aria-hidden': 'true' }), h('strong', null, collection.status), h('span', null, '最后更新'), h('time', null, collection.lastUpdated)),
  )
}

function KpiBand({ items }) {
  return h('section', { className: 'material-kpi-band', 'aria-label': '原材料市场摘要' }, items.map((item) =>
    h('article', { className: `material-kpi material-kpi--${item.tone}`, key: item.label },
      h('i', { 'aria-hidden': 'true' }, item.icon),
      h('div', null, h('span', null, item.label), h('strong', null, item.value, h('small', null, item.unit)), item.delta ? h('em', null, item.delta) : null),
    ),
  ))
}

function LiveQuotes({ items }) {
  return h('div', { className: 'material-live-list' }, items.map((item) =>
    h('article', { className: `material-live-card material-live-card--${item.tone}`, key: item.name },
      h('i', { className: 'material-live-card__icon', 'aria-hidden': 'true' }, item.icon),
      h('div', { className: 'material-live-card__name' }, h('strong', null, item.name), h('span', null, `规格：${item.spec}`)),
      h('div', { className: 'material-live-card__price' }, h('strong', null, item.price, h('small', null, item.unit)), h('em', null, item.delta, h('i', { 'aria-hidden': 'true' }, item.tone === 'up' ? '↑' : '↓'))),
      h('div', { className: 'material-live-card__meta' }, h('span', null, `来源：${item.source}`), h('time', null, `更新：${item.updatedAt}`)),
    ),
  ))
}

function TrendToolbar() {
  return h('div', { className: 'material-trend-toolbar' },
    h('div', { className: 'material-range-tabs' }, ['近7天', '近30天', '近90天', '近180天'].map((label) => h('button', { type: 'button', className: label === '近30天' ? 'is-active' : '', key: label }, label))),
    h('div', { className: 'material-trend-legend' }, [['PPS树脂', 'blue'], ['玻璃纤维', 'green'], ['碳酸钙', 'orange'], ['阻燃剂', 'yellow']].map(([label, tone]) => h('span', { className: `is-${tone}`, key: label }, h('i', { 'aria-hidden': 'true' }), label))),
    h('small', null, '价格指数（基期=100）'),
  )
}

function RankingGroup({ title, items, tone }) {
  const max = Math.max(...items.map((item) => item.numericPrice))
  return h('section', { className: `material-ranking-group is-${tone}` },
    h('header', null, h('strong', null, title), h('span', null, '最新价（元/吨）'), h('span', null, '涨跌幅')),
    items.map((item, index) => h('div', { className: 'material-ranking-row', key: item.name },
      h('i', null, index + 1), h('span', null, item.name), h('div', null, h('b', { style: { width: `${Math.max(26, (item.numericPrice / max) * 100)}%` } })), h('strong', null, item.price), h('em', null, item.delta),
    )),
  )
}

function Rankings({ data }) {
  return h('div', { className: 'material-rankings' },
    h(RankingGroup, { title: '涨幅前五', items: data.rising, tone: 'up' }),
    h(RankingGroup, { title: '跌幅前五', items: data.falling, tone: 'down' }),
  )
}

function Alerts({ items }) {
  return h('div', { className: 'material-alert-table' },
    h('div', { className: 'material-alert-head' }, ['预警类型', '材料', '阈值（元/吨）', '最新价', '偏离', '严重程度', '时间'].map((label) => h('span', { key: label }, label))),
    items.map((item) => h('div', { className: `material-alert-row is-${item.tone}`, key: item.material },
      h('strong', null, '▲ ', item.level), h('span', null, item.material), h('span', null, item.threshold), h('span', null, item.price), h('em', null, item.delta), h('b', null, item.severity), h('time', null, item.time),
    )),
  )
}

function QuoteTable({ items }) {
  return h('div', { className: 'material-table' },
    h('div', { className: 'material-table-head' }, ['材料名称', '规格', '数据来源', '最新价格（元/吨）', '日涨跌', '30日高点', '30日低点', '更新时间', '状态'].map((label) => h('span', { key: label }, label))),
    items.map((item) => h('div', { className: `material-table-row material-table-row--${item.tone}`, key: item.name },
      h('span', null, h('i', { 'aria-hidden': 'true' }), item.name), h('span', null, item.spec), h('span', null, item.source), h('strong', null, item.price), h('em', null, item.delta), h('span', null, item.high), h('span', null, item.low), h('time', null, item.updatedAt), h('b', null, h('i', { 'aria-hidden': 'true' }), item.status),
    )),
  )
}

function CostImpact({ items }) {
  return h('div', { className: 'material-impact' },
    h('div', { className: 'material-impact-legend' }, h('span', null, '当前成本构成'), h('em', null, '■ 能源成本'), h('em', null, '■ 材料成本'), h('span', null, '预计成本影响'), h('span', null, '单位能耗成本')),
    items.map((item) => h('article', { className: 'material-impact-row', key: item.product },
      h('div', { className: 'material-impact-product' }, h('strong', null, item.product), h('small', null, `（单位：${item.unit}）`)),
      h('div', { className: 'material-impact-bar' },
        h('span', { className: 'is-energy', style: { width: `${item.energyShare}%` } }, h('strong', null, item.energyCost), h('small', null, `(${item.energyShare.toFixed(1)}%)`)),
        h('span', { className: 'is-material', style: { width: `${item.materialShare}%` } }, h('strong', null, item.materialCost), h('small', null, `(${item.materialShare.toFixed(1)}%)`)),
      ),
      h('em', null, item.impact), h('strong', { className: 'material-impact-energy' }, item.unitEnergyCost, h('small', null, '元/吨')),
    )),
    h('p', null, '说明：预计成本影响基于当前价格较30日均价的变化，结合单位能耗成本进行测算，仅供参考。'),
  )
}

export function MaterialPriceDashboard({ trendChart = null }) {
  const data = materialPriceDashboardData
  return h('div', { className: 'material-dashboard' },
    h(FilterRail, { filters: data.filters, collection: data.collection }),
    h(KpiBand, { items: data.kpis }),
    h('div', { className: 'material-primary-grid' },
      h(Panel, { title: '实时行情', className: 'material-live-panel' }, h(LiveQuotes, { items: data.liveQuotes })),
      h(Panel, { title: '原材料价格趋势', action: '⇩ 导出', className: 'material-trend-panel' }, h(TrendToolbar), trendChart),
      h('div', { className: 'material-primary-grid__right' },
        h(Panel, { title: '涨跌排行', className: 'material-ranking-panel' }, h(Rankings, { data: data.rankings })),
        h(Panel, { title: '价格预警', action: '查看详情 ›', className: 'material-alert-panel' }, h(Alerts, { items: data.alerts })),
      ),
    ),
    h('div', { className: 'material-secondary-grid' },
      h(Panel, { title: '原材料实时报价', className: 'material-table-panel' }, h(QuoteTable, { items: data.materials })),
      h(Panel, { title: '成本影响分析　ⓘ', className: 'material-impact-panel' }, h(CostImpact, { items: data.costLinks })),
    ),
  )
}
