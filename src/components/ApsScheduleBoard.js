import { createElement as h } from 'react'

const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
const statusTone = { 已完成: 'done', 生产中: 'running', 待开始: 'pending' }

export function ApsScheduleBoard({ rows = [], currentHour = 0 }) {
  const firstWorkshopRows = new Set()
  rows.forEach((row, index) => {
    if (index === 0 || rows[index - 1].workshop !== row.workshop) firstWorkshopRows.add(index)
  })

  return h('div', { className: 'aps-schedule-board' },
    h('div', { className: 'aps-schedule-head' },
      ['车间/工序', '机台', '产品', '批次号', '计划产量\n(t)'].map((label) => h('span', { key: label }, label)),
      h('div', { className: 'aps-schedule-hours' },
        h('b', null, `${String(Math.floor(currentHour)).padStart(2, '0')}:${String(Math.round((currentHour % 1) * 60)).padStart(2, '0')}`),
        hours.map((hour) => h('span', { key: hour }, hour)),
      ),
      ['计划开始', '计划结束', '状态'].map((label) => h('span', { key: label }, label)),
    ),
    h('div', { className: 'aps-schedule-body', style: { '--aps-now': `${(currentHour / 24) * 100}%` } }, rows.map((row, index) =>
      h('div', { className: 'aps-schedule-row', key: `${row.machine}-${row.batch}` },
        h('span', { className: 'aps-schedule-workshop' }, firstWorkshopRows.has(index) ? h('span', null, h('i', { 'aria-hidden': 'true' }), row.workshop) : ''),
        h('span', null, row.machine),
        h('span', null, row.product),
        h('span', null, row.batch),
        h('strong', null, row.quantity),
        h('div', { className: 'aps-gantt-cell' },
          h('i', { className: `aps-gantt-bar aps-gantt-bar--${statusTone[row.status]}`, style: { left: `${(row.startHour / 24) * 100}%`, width: `${(row.durationHours / 24) * 100}%` } }),
        ),
        h('span', null, row.start),
        h('span', null, row.end),
        h('em', { className: `aps-status aps-status--${statusTone[row.status]}` }, h('i', { 'aria-hidden': 'true' }), row.status),
      ),
    )),
  )
}
