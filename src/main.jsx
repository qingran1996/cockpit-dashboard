import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { EmbeddedPartChartPage } from './components/EmbeddedPartChartPage.jsx'
import { resolveAppSurface } from './appSurface.js'
import { resolveEmbeddedPartChart } from './embeddedPartCharts.js'
import './styles/index.css'
import './styles/panels.css'
import './styles/energy-detail.css'
import './styles/embedded-part-chart.css'
import './styles/aps-dashboard.css'
import './styles/material-price-dashboard.css'

const surfaceMode = resolveAppSurface(window.location.pathname)
document.documentElement.dataset.surface = surfaceMode
const embeddedPartChart = resolveEmbeddedPartChart(surfaceMode)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {embeddedPartChart
      ? <EmbeddedPartChartPage surfaceMode={surfaceMode} />
      : <App surfaceMode={surfaceMode} />}
  </React.StrictMode>
)
