import { useClock } from '../hooks/useClock.js'

export function DashboardHeader() {
  const time = useClock()

  return (
    <header className="dashboard-header">
      <div className="dashboard-header__weather">
        <span className="weather-icon" aria-hidden="true">🌤️</span>
        <strong>28°C</strong>
        <span>多云</span>
      </div>
      <div className="dashboard-header__title">
        <i /><h1>能源综合监控可视化平台</h1><i />
      </div>
      <time className="dashboard-header__clock">{time}</time>
    </header>
  )
}
