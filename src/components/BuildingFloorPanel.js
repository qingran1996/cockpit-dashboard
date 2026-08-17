import { createElement as h } from 'react'

export function BuildingFloorPanel({
  building,
  exploded,
  onToggleExploded,
  onClose,
}) {
  return h('aside', { className: 'scene-detail scene-floor-panel', 'aria-live': 'polite' },
    h('button', {
      type: 'button',
      className: 'scene-detail__close',
      onClick: onClose,
      'aria-label': '关闭建筑分层详情',
    }, '×'),
    h('span', { className: 'scene-detail__eyebrow' }, `FACILITY / ${building.id.toUpperCase()}`),
    h('h3', null, building.name),
    h('p', null, building.type),
    h('dl', { className: 'scene-floor-panel__metrics' },
      h('div', null, h('dt', null, building.metricLabel), h('dd', null, building.metricValue)),
      h('div', null, h('dt', null, '运行状态'), h('dd', { className: 'is-normal' }, h('i'), building.status)),
    ),
    h('div', { className: 'scene-floor-panel__heading' },
      h('div', null,
        h('span', null, 'BUILDING SECTION'),
        h('strong', null, '楼层剖面'),
      ),
      h('button', {
        type: 'button',
        className: 'scene-floor-panel__toggle',
        onClick: onToggleExploded,
        'aria-pressed': exploded,
      }, exploded ? '合拢楼层' : '展开分层'),
    ),
    h('div', { className: `scene-floor-panel__stack${exploded ? ' is-exploded' : ''}`, 'aria-label': '楼层剖面', role: 'list' },
      [...building.floors].reverse().map((floor, index) =>
        h('div', {
          key: floor.id,
          className: `scene-floor-panel__floor${exploded ? ' is-exploded' : ''}`,
          role: 'listitem',
          'data-tone': floor.tone,
          style: { '--floor-index': index },
        },
        h('b', null, floor.id),
        h('span', null, h('strong', null, floor.name), h('small', null, floor.usage)),
        h('i'),
        )
      ),
    ),
    h('div', { className: 'scene-floor-panel__active', role: 'status' },
      h('span', null, 'EXPLOSION STATUS'),
      h('strong', null, exploded ? `${building.floors.length} 个空间同步展开` : '楼层结构已合拢'),
      h('small', null, exploded ? `外壳消隐 · 层间距 ${EXPLODED_FLOOR_GAP_LABEL}` : '点击展开查看完整楼层结构'),
    ),
  )
}

const EXPLODED_FLOOR_GAP_LABEL = '0.95m'
