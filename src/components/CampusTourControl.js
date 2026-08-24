import { createElement as h } from 'react'
import { CAMPUS_TOUR_STOPS, resolveCampusTourStop } from '../scene/campusTour.js'

export function CampusTourControl({ state, onStart = () => {}, onToggle = () => {}, onPrevious = () => {}, onNext = () => {}, onExit = () => {} }) {
  const active = Boolean(state?.active)
  const playing = Boolean(state?.playing)
  const index = Number.isFinite(state?.index) ? state.index : 0
  const progress = Math.max(0, Math.min(1, Number(state?.progress) || 0))
  const stop = resolveCampusTourStop(index)

  if (!active) {
    return h('button', {
      type: 'button',
      className: 'campus-tour-launcher',
      'aria-label': '启动厂区自动漫游',
      onClick: onStart,
    },
    h('span', { className: 'campus-tour-launcher__radar', 'aria-hidden': 'true' }, h('i')),
    h('span', null, h('small', null, 'ROUTE INSPECTION'), h('strong', null, '厂区漫游')))
  }

  return h('section', {
    className: 'campus-tour-control',
    'aria-label': '厂区自动漫游',
    style: { '--tour-progress': `${Math.round(progress * 100)}%` },
  },
  h('header', null,
    h('span', { className: 'campus-tour-control__route', 'aria-hidden': 'true' }, h('i')),
    h('span', null, h('small', null, 'ROUTE INSPECTION'), h('strong', null, stop.label)),
    h('b', null, `${String(index + 1).padStart(2, '0')} / ${String(CAMPUS_TOUR_STOPS.length).padStart(2, '0')}`),
  ),
  h('p', null, stop.caption),
  h('div', { className: 'campus-tour-control__progress', 'aria-hidden': 'true' }, h('i')),
  h('div', { className: 'campus-tour-control__commands' },
    h('button', { type: 'button', 'aria-label': '上一漫游站点', onClick: onPrevious }, '‹'),
    h('button', { type: 'button', className: 'campus-tour-control__play', 'aria-label': playing ? '暂停厂区漫游' : '继续厂区漫游', 'aria-pressed': playing, onClick: onToggle }, playing ? '暂停' : '继续'),
    h('button', { type: 'button', 'aria-label': '下一漫游站点', onClick: onNext }, '›'),
    h('button', { type: 'button', className: 'campus-tour-control__exit', 'aria-label': '退出厂区漫游', onClick: onExit }, '退出'),
  ))
}
