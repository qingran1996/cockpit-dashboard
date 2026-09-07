import { createElement as h } from 'react'

const capabilities = [
  ['实时报价', '价格、涨跌幅与更新时间'],
  ['价格趋势', '支持时间范围与多材料对比'],
  ['变动提醒', '阈值超限后进入消息与告警'],
  ['成本联动', '对照能耗成本与产品单耗'],
]

export function MaterialPricePlaceholder() {
  return h('section', { className: 'material-price-placeholder', 'aria-label': '原材料价格看板预留' },
    h('div', { className: 'material-price-placeholder__eyebrow' }, 'MATERIAL MARKET / 数据接口预留'),
    h('h2', null, '原材料价格看板'),
    h('p', null, '行情采集由业务应用侧服务完成，清洗入库后由前端通过标准 API 读取。'),
    h('div', { className: 'material-price-placeholder__grid' }, capabilities.map(([title, description], index) =>
      h('article', { key: title }, h('i', null, String(index + 1).padStart(2, '0')), h('strong', null, title), h('span', null, description)),
    )),
    h('small', null, '等待甲方确认原材料清单、来源网站与采集频率后启用'),
  )
}
