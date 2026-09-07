import { createElement as h } from 'react'

const CAMPUS_OVERVIEW_IMAGE = '/images/campus-overview.jpg'

export function CampusImageScene() {
  return h('section', {
    className: 'industrial-scene is-campus-image',
    'aria-label': '厂区鸟瞰展示',
  },
  h('img', {
    className: 'campus-image-scene__image',
    src: CAMPUS_OVERVIEW_IMAGE,
    alt: '张家港大塚化学厂区鸟瞰图',
    draggable: false,
  }),
  h('div', { className: 'campus-image-scene__shade', 'aria-hidden': 'true' }))
}
