import { useEffect, useState } from 'react'
import { formatDashboardDate } from '../utils/formatDate.js'

export function useClock() {
  const [time, setTime] = useState(() => formatDashboardDate(new Date()))

  useEffect(() => {
    const timer = window.setInterval(() => setTime(formatDashboardDate(new Date())), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return time
}
