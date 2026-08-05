// 画布两侧留白区的「能量总线」装饰带。
// 仅在视口宽高比 > 16:9、出现左右留白（gap >= 64）时渲染，跟随真实视口而非缩放画布。
const RAILS = {
  left: {
    flow: 'up', // 能量注入方向
    badge: 'SYS · ONLINE',
    bus: '能量总线',
    scale: [
      { v: '35', u: 'kV', w: 92 },
      { v: '10', u: 'kV', w: 60 },
      { v: '0.4', u: 'kV', w: 24 },
    ],
    coord: 'N 31°14′  E 121°28′',
    ver: 'GRID-A · v1.0',
  },
  right: {
    flow: 'down', // 负载消耗方向
    badge: 'LINK · SYNC',
    bus: '负载总线',
    scale: [
      { v: '86', u: '%', w: 86 },
      { v: '63', u: '%', w: 63 },
      { v: '41', u: '%', w: 41 },
    ],
    coord: 'PEAK 14:00  PF 0.96',
    ver: 'SECTOR · 03',
  },
}

export function SideRail({ side, gap }) {
  if (gap < 64) return null
  const d = RAILS[side]
  return (
    <aside
      className={`side-rail side-rail--${side}`}
      data-flow={d.flow}
      style={{ '--gap': `${gap}px` }}
      aria-hidden="true"
    >
      <div className="side-rail__top">
        <span className="side-rail__pulse" />
        <span className="side-rail__badge">{d.badge}</span>
      </div>

      <div className="side-rail__core">
        <dl className="side-rail__scale">
          {d.scale.map((s) => (
            <div className="side-rail__tick" key={s.v}>
              <dt>{s.v}<i>{s.u}</i></dt>
              <dd><i style={{ width: `${s.w}%` }} /></dd>
            </div>
          ))}
        </dl>
        <div className="side-rail__flow" />
      </div>

      <div className="side-rail__foot">
        <span className="side-rail__bus">{d.bus}</span>
        <span className="side-rail__coord">{d.coord}</span>
        <span className="side-rail__ver">{d.ver}</span>
      </div>
    </aside>
  )
}
