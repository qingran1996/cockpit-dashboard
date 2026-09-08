import { createElement as h } from 'react'
import { powerPanelLayoutStyle } from '../homepagePanelLayout.js'

function Comparisons({ items = [], className = 'telemetry-comparisons' }) {
  return h('div', { className }, items.map((item) =>
    h('em', { className: `comparison comparison--${item.tone ?? 'muted'} homepage-comparison`, key: item.label },
      h('span', { className: 'comparison-label' }, item.label),
      h('b', null, item.value))))
}

function MetricStrip({ items, tone = 'cyan' }) {
  return h('div', { className: `telemetry-kpis telemetry-kpis--${tone}` }, items.map((item) =>
    h('div', { className: 'telemetry-kpi', key: item.label },
      h('span', null, item.label),
      h('strong', null, item.value, h('small', null, item.unit)),
      h(Comparisons, { items: item.comparisons, className: 'telemetry-kpi__comparisons' }),
    )))
}

function Section({ title, meta, children, tone = 'cyan' }) {
  return h('section', { className: `telemetry-section telemetry-section--${tone}` },
    h('header', null, h('h3', null, title), meta ? h('span', null, meta) : null),
    children,
  )
}

function ChartLegend({ items }) {
  return h('div', { className: 'telemetry-legend', 'aria-hidden': 'true' }, items.map((item) =>
    h('span', { className: `telemetry-legend__item telemetry-legend__item--${item.tone}`, key: item.label }, item.label)))
}

function ResourceTerminal({ resource, items, status = null }) {
  const isWater = resource === 'water'
  return h('section', {
    className: `telemetry-inset-frame resource-terminal resource-terminal--${resource} resource-terminal--signals-${items.length}`,
    'aria-label': `${isWater ? '水资源' : '电力资源'}运行终端`,
  },
  h('div', { className: 'resource-terminal__identity', 'aria-hidden': 'true' },
    h('i', null, isWater ? '' : 'ϟ'),
    h('span', null, isWater ? 'WATER' : 'POWER'),
  ),
  h('div', { className: 'resource-terminal__signals' },
    status ? h('div', { className: 'resource-terminal__status' },
      h('span', null, status.label),
      h('strong', null, status.state),
      h('small', null, status.meta),
    ) : null,
    items.map((item) =>
    h('div', { className: 'resource-terminal__signal', key: item.label },
      h('span', null, item.label),
      h('strong', null, item.value, h('small', null, item.unit)),
      h(Comparisons, { items: item.comparisons }),
    )),
  ),
  )
}

export function WaterTelemetry({ data, chart = null }) {
  return h('div', { className: 'resource-telemetry resource-telemetry--water' },
    h(MetricStrip, { items: data.summary }),
    h(Section, { title: '24小时用水趋势' },
      h(ChartLegend, { items: [
        { label: '今日流量', tone: 'cyan' },
        { label: '昨日流量', tone: 'blue' },
        { label: '计划范围', tone: 'band' },
      ] }),
      chart,
    ),
    h(Section, { title: '分区用水对比', meta: '(m³/h)' },
      h('div', { className: 'telemetry-bars' }, data.districts.map((district) =>
        h('div', { className: 'telemetry-bar', key: district.name },
          h('span', null, district.name),
          h('i', null, h('b', { style: { width: `${district.percent}%` } })),
          h('strong', null, district.value),
          h('em', null, `${district.percent}%`),
        ))),
    ),
    h('div', { className: 'telemetry-inset-frame telemetry-health-grid', role: 'group', 'aria-label': '水资源管网状态' }, data.operations.map((item) =>
      h('article', {
        className: `telemetry-health-card${item.tone === 'warning' ? ' telemetry-health-card--warning' : ''}`,
        key: item.label,
        'aria-label': item.label === '漏损异常' ? '漏损异常告警' : undefined,
      },
        h('span', null, h('i', { 'aria-hidden': 'true' }, item.icon), item.label),
        h('strong', null, item.value, h('small', null, item.unit)),
        h(Comparisons, { items: item.comparisons }),
      ))),
    h(ResourceTerminal, { resource: 'water', items: data.terminal.filter((item) => item.label !== '夜间基流') }),
  )
}

export function PowerTelemetry({ data, chart = null }) {
  return h('div', { className: 'resource-telemetry resource-telemetry--power', style: powerPanelLayoutStyle() },
    h(MetricStrip, { items: data.summary }),
    h(Section, { title: '24小时电力负荷曲线' },
      h(ChartLegend, { items: [
        { label: '今日负荷', tone: 'cyan' },
        { label: '昨日负荷', tone: 'blue' },
        { label: '需量限值', tone: 'limit' },
      ] }),
      chart,
    ),
    h(Section, { title: '变压器负载率' },
      h('div', { className: 'transformer-bars' }, data.transformers.map((item) =>
        h('div', { className: `transformer-bar transformer-bar--${item.tone}`, key: item.name },
          h('span', null, item.name),
          h('i', null, h('b', { style: { width: `${item.percent}%` } })),
          h('strong', null, item.load, h('small', null, '%')),
          h('em', { className: item.tone === 'warning' ? 'comparison--warning' : 'comparison--good' }, item.delta),
        ))),
    ),
    h('div', { className: 'telemetry-inset-frame power-foot-grid', role: 'group', 'aria-label': '电力资源经济与质量' },
      h(Section, { title: '分时电价', meta: '(元/MWh)' },
        h('div', { className: 'tariff-grid' }, data.tariffs.map((item) =>
          h('div', { key: item.name }, h('span', null, item.name), h('strong', null, item.value), h('em', { className: `${item.delta.startsWith('-') ? 'comparison--good' : 'comparison--warning'} homepage-comparison` }, '较昨日 ', item.delta)))),
      ),
      h(Section, { title: '电能质量' },
        h('div', { className: 'quality-readout' }, h('span', null, data.quality.label), h('strong', null, data.quality.value, h('small', null, data.quality.unit)), h('em', { className: 'comparison--good homepage-comparison' }, '较昨日 ', data.quality.delta)),
      ),
    ),
    h(ResourceTerminal, {
      resource: 'power',
      items: data.terminal,
      status: { label: '配电系统运行态', state: '稳定供电', meta: `${data.devices.length} 台主变在线` },
    }),
  )
}

export function SteamTelemetry({ data, chart = null }) {
  const [liveFlow, todayUsage, supplyPressure, supplyTemperature] = data.summary
  return h('div', { className: 'resource-telemetry resource-telemetry--steam' },
    h('div', { className: 'telemetry-inset-frame steam-process-grid', role: 'group', 'aria-label': '蒸汽运行分析' },
      h('section', { className: 'steam-process-zone steam-process-zone--flow', 'data-steam-zone': 'flow', 'aria-label': '蒸汽趋势与流量' },
        h('header', { className: 'steam-process-heading' },
          h('div', null, h('i', { 'aria-hidden': 'true' }), h('h3', null, '蒸汽趋势与流量')),
          h('div', { className: 'steam-flow-readouts' },
            h('span', null, liveFlow.label, h('strong', null, liveFlow.value, h('small', null, liveFlow.unit))),
            h('span', null, todayUsage.label, h('strong', null, todayUsage.value, h('small', null, todayUsage.unit))),
          ),
        ),
        chart,
        h('div', { className: 'steam-balance-row', 'aria-label': '蒸汽供需平衡' },
          h('div', { className: 'steam-balance-label' }, h('i', { 'aria-hidden': 'true' }), h('span', null, '管网平衡数据')),
          data.balance.map((item) => h('div', { key: item.label }, h('span', null, item.label), h('strong', null, item.value, h('small', null, item.unit)))),
        ),
      ),
      h('section', { className: 'steam-process-zone steam-process-zone--boilers', 'data-steam-zone': 'boilers', 'aria-label': '锅炉群状态' },
        h('header', { className: 'steam-process-heading' }, h('div', null, h('i', { 'aria-hidden': 'true' }), h('h3', null, '锅炉群状态')), h('em', null, '2 运行 · 2 备用')),
        h('div', { className: 'boiler-state-grid' }, data.boilerStates.map((boiler) =>
          h('div', { className: `boiler-state boiler-state--${boiler.tone}`, key: boiler.name },
            h('span', null, boiler.name), h('strong', null, boiler.state),
          ))),
        h('div', { className: 'steam-boiler-summary' },
          h('span', null, '锅炉效率', h('strong', null, data.efficiency), h('small', null, '目标 ≥ 80%')),
          h('span', null, '锅炉负荷', h('strong', null, data.boilerLoad), h('small', null, '经济区间')),
          h('span', null, '调度方式', h('strong', null, '自动均衡'), h('small', null, '跟随用汽负荷')),
        ),
      ),
      h('section', { className: 'steam-process-zone steam-process-zone--quality', 'data-steam-zone': 'quality', 'aria-label': '供汽质量与告警' },
        h('header', { className: 'steam-process-heading' }, h('div', null, h('i', { 'aria-hidden': 'true' }), h('h3', null, '供汽质量与告警')), h('em', null, '末端监测')),
        h('div', { className: 'steam-quality-readouts' },
          [supplyPressure, supplyTemperature].map((item) => h('div', { key: item.label }, h('span', null, item.label), h('strong', null, item.value, h('small', null, item.unit)), h('em', { className: 'homepage-comparison' }, '较昨日 ', h('b', null, item.delta)))),
          h('div', null, h('span', null, '单位成本'), h('strong', null, '¥ ', data.unitCost, h('small', null, ' /t')), h('em', { className: 'homepage-comparison' }, '较昨日 ', h('b', null, data.unitCostDelta))),
        ),
        h('div', { className: 'steam-quality-alarm' },
          h('div', { className: 'steam-alert-heading' }, h('strong', null, '告警', h('span', null, data.alerts.length))),
          h('div', { className: 'steam-alert-list', 'aria-label': '蒸汽告警列表' }, data.alerts.map((alert) =>
            h('div', { className: 'steam-alert-row', key: alert.title },
              h('i', { 'aria-hidden': 'true' }), h('strong', null, alert.title), h('small', null, alert.meta),
            ))),
          h('div', { className: 'steam-alert-footer' },
            h('span', null, '处置进度', h('strong', null, data.alertProgress)),
            h('span', null, '责任班组', h('strong', null, data.alertOwner)),
          ),
        ),
      ),
    ),
  )
}
