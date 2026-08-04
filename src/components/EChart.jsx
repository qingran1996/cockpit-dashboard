import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, MarkPointComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([BarChart, LineChart, GridComponent, MarkPointComponent, TooltipComponent, CanvasRenderer])

export function EChart({ option, className = '', ariaLabel }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return undefined

    const instance = echarts.init(containerRef.current, null, { renderer: 'canvas' })
    instance.setOption(option, true)
    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      instance.dispose()
    }
  }, [option])

  return <div ref={containerRef} className={`chart ${className}`} role="img" aria-label={ariaLabel} />
}
