import { useState } from 'react'

const nodes = [
  [12, 79, 'cyan'], [20, 72, 'orange'], [29, 82, 'orange'], [38, 76, 'orange'],
  [62, 78, 'cyan'], [73, 73, 'orange'], [84, 82, 'cyan'], [92, 70, 'orange'],
]

const particles = [9, 16, 24, 33, 41, 55, 63, 70, 79, 88, 94]

export function IndustrialHero() {
  const [failed, setFailed] = useState(false)

  return (
    <section className={`industrial-hero ${failed ? 'industrial-hero--fallback' : ''}`} aria-label="中央工业园区能源网络">
      {!failed && <img src="/industrial-park.png" alt="能源工业园区三维俯视图" onError={() => setFailed(true)} />}
      {failed && <div className="industrial-hero__fallback">工业园区能源网络</div>}
      <div className="industrial-hero__vignette" />
      <div className="industrial-hero__scan" />
      <div className="industrial-hero__horizon" />
      <div className="energy-nodes" aria-hidden="true">
        {nodes.map(([left, top, tone], index) => (
          <i key={`${left}-${top}`} className={`energy-node energy-node--${tone}`} style={{ left: `${left}%`, top: `${top}%`, '--delay': `${index * 0.22}s` }} />
        ))}
      </div>
      <div className="hero-particles" aria-hidden="true">
        {particles.map((left, index) => <i key={left} style={{ left: `${left}%`, '--delay': `${index * 0.31}s`, '--drift': `${18 + (index % 4) * 9}px` }} />)}
      </div>
    </section>
  )
}
