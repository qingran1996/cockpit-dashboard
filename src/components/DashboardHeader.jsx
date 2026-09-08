import { useClock } from '../hooks/useClock.js'
import { HomepageHeader } from './HomepageHeader.js'

export function DashboardHeader({ lightingMode, activeModule = 'energy', onModuleChange = () => {}, showReturnToScene = false }) {
  const time = useClock()

  return <HomepageHeader time={time} lightingMode={lightingMode} activeModule={activeModule} onModuleChange={onModuleChange} showReturnToScene={showReturnToScene} />
}
