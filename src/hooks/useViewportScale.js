import { useEffect, useState } from 'react'
import { calculateViewportScale } from '../utils/layout.js'

const getViewport = () => calculateViewportScale(window.innerWidth, window.innerHeight)

export function useViewportScale() {
  const [viewport, setViewport] = useState(getViewport)

  useEffect(() => {
    const updateViewport = () => setViewport(getViewport())
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  return viewport
}
