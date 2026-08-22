import { useClock } from '../hooks/useClock.js'
import { HomepageHeader } from './HomepageHeader.js'

export function DashboardHeader({ lightingMode }) {
  const time = useClock()

  return <HomepageHeader time={time} lightingMode={lightingMode} />
}
