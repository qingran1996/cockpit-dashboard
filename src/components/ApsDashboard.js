import { createElement as h, useState } from 'react'
import { apsDashboardData } from '../data/apsDashboardData.js'
import { ApsScheduleBoard } from './ApsScheduleBoard.js'

function ApsPanel({ title, unit, action, className = '', children }) {
  return h('section', { className: `aps-panel ${className}`.trim() },
    h('header', null, h('h2', null, title), unit ? h('small', null, unit) : null, action ? h('button', { type: 'button' }, action, h('i', { 'aria-hidden': 'true' }, '›')) : null),
    h('div', { className: 'aps-panel__body' }, children),
  )
}

function FilterRail({ filters, connection }) {
  const [values, setValues] = useState(() => Object.fromEntries(filters.map((filter) => [filter.id, filter.value])))
  const dateFilter = filters.find((filter) => filter.type === 'date')
  const [dateRange, setDateRange] = useState(() => ({ start: dateFilter?.start ?? '', end: dateFilter?.end ?? '' }))

  return h('section', { className: 'aps-filter-rail', 'aria-label': 'APS查询条件' },
    filters.map((filter) => h('label', { key: filter.id, className: filter.type === 'date' ? 'is-date' : '' },
      h('span', null, filter.label),
      filter.type === 'date'
        ? h('span', { className: 'aps-date-range' },
          h('input', { type: 'date', value: dateRange.start, 'aria-label': 'APS开始日期', onChange: (event) => setDateRange((current) => ({ ...current, start: event.target.value })) }),
          h('i', { 'aria-hidden': 'true' }, '—'),
          h('input', { type: 'date', value: dateRange.end, 'aria-label': 'APS结束日期', onChange: (event) => setDateRange((current) => ({ ...current, end: event.target.value })) }),
        )
        : h('select', { value: values[filter.id], 'aria-label': `${filter.label}筛选`, onChange: (event) => setValues((current) => ({ ...current, [filter.id]: event.target.value })) },
          filter.options.map((option) => h('option', { value: option, key: option }, option)),
        ),
    )),
    h('div', { className: 'aps-api-state' }, 'APS接口', h('i', { 'aria-hidden': 'true' }), h('strong', null, connection)),
  )
}

function KpiBand({ items }) {
  return h('section', { className: 'aps-kpi-band', 'aria-label': 'APS排产能耗摘要' }, items.map((item) =>
    h('article', { className: `aps-kpi aps-kpi--${item.tone}`, key: item.label },
      h('i', { 'aria-hidden': 'true' }, item.icon),
      h('div', null, h('span', null, item.label), h('strong', null, item.value, h('small', null, item.unit))),
    ),
  ))
}

function Utilization({ items }) {
  return h('div', { className: 'aps-utilization' },
    h('div', { className: 'aps-utilization__caption' }, h('span', null, '车间负荷利用率'), h('small', null, '(%)')),
    items.map((item) => h('div', { className: 'aps-utilization__row', key: item.label },
      h('span', null, item.label), h('i', null, h('b', { style: { width: `${item.value}%` } })), h('strong', null, `${item.value}%`),
    )),
  )
}

function ProductConsumption({ products }) {
  return h('div', { className: 'aps-product-list' }, products.map((product) =>
    h('article', { key: product.name },
      h('header', null, h('strong', null, product.name), h('span', null, product.status)),
      h('div', null,
        [['水', product.water, '◆'], ['电', product.power, 'ϟ'], ['蒸汽', product.steam, '♨'], ['折煤', product.total, '⬟']].map(([label, value, icon]) =>
          h('span', { key: label }, h('i', { 'aria-hidden': 'true' }, icon), h('small', null, label), h('strong', null, value)),
        ),
      ),
    ),
  ))
}

function PlanActual({ rows }) {
  const max = Math.max(...rows.flatMap((row) => [row.planned, row.actual]))
  return h('div', { className: 'aps-plan-actual' },
    h('div', { className: 'aps-plan-actual__legend' }, h('span', null, '计划值'), h('span', null, '实际值'), h('span', null, '偏差'), h('small', null, '(tce)')),
    rows.map((row) => h('div', { className: 'aps-plan-actual__row', key: row.label },
      h('span', null, row.label),
      h('div', null,
        h('i', { className: 'is-plan', style: { width: `${(row.planned / max) * 100}%` } }),
        h('i', { className: 'is-actual', style: { width: `${(row.actual / max) * 100}%` } }),
      ),
      h('strong', null, h('span', null, row.planned), h('span', null, row.actual)),
      h('em', { className: `comparison--${row.tone}` }, row.delta),
    )),
  )
}

function Deviations({ items }) {
  return h('div', { className: 'aps-deviations' }, items.map((item) =>
    h('article', { className: `aps-deviation aps-deviation--${item.tone}`, key: item.batch },
      h('header', null, h('strong', null, h('i', { 'aria-hidden': 'true' }, '!'), item.level), h('span', null, item.metric)),
      h('div', null, h('span', null, `批次号：${item.batch}`), h('span', null, `车间：${item.workshop}`), h('em', null, item.delta)),
      h('button', { type: 'button' }, '查看详情', h('i', { 'aria-hidden': 'true' }, '›')),
    ),
  ))
}

function Ranking({ items }) {
  const max = items[0].value
  return h('div', { className: 'aps-ranking' }, items.map((item) =>
    h('div', { className: `aps-ranking__row aps-ranking__row--${item.rank}`, key: item.rank },
      h('i', null, item.rank), h('span', null, item.workshop), h('small', null, item.product),
      h('div', null, h('b', { style: { width: `${(item.value / max) * 100}%` } })), h('strong', null, item.value.toFixed(2)),
    ),
  ))
}

const forecastLegend = ['用水量（m³）', '用电量（MWh）', '蒸汽量（t）', '综合能耗（tce）']

export function ApsDashboard({ forecastChart = null }) {
  const data = apsDashboardData
  return h('div', { className: 'aps-dashboard' },
    h(FilterRail, { filters: data.filters, connection: data.connection }),
    h(KpiBand, { items: data.kpis }),
    h('div', { className: 'aps-main-grid' },
      h('div', { className: 'aps-main-grid__left' },
        h(ApsPanel, { title: '排产概览' }, h(Utilization, { items: data.utilization })),
        h(ApsPanel, { title: '产品单位能耗', unit: '(tce/t)' }, h(ProductConsumption, { products: data.products })),
      ),
      h(ApsPanel, { title: 'APS排产计划', action: '查看能耗历史', className: 'aps-schedule-panel' },
        h(ApsScheduleBoard, { rows: data.schedule, currentHour: data.currentHour }),
      ),
      h('div', { className: 'aps-main-grid__right' },
        h(ApsPanel, { title: '计划与实际' }, h(PlanActual, { rows: data.planActual })),
        h(ApsPanel, { title: '偏差预警' }, h(Deviations, { items: data.deviations })),
      ),
    ),
    h('div', { className: 'aps-bottom-grid' },
      h(ApsPanel, { title: '未来7日能源预测', className: 'aps-forecast-panel' },
        h('div', { className: 'aps-forecast-legend', 'aria-label': '能源预测图例' }, forecastLegend.map((label) =>
          h('span', { className: 'aps-forecast-legend__item', key: label }, h('i', { 'aria-hidden': 'true' }), label),
        )),
        forecastChart,
      ),
      h(ApsPanel, { title: '车间×产品能耗排行', unit: '(tce/t)', className: 'aps-ranking-panel' }, h(Ranking, { items: data.ranking })),
    ),
  )
}
