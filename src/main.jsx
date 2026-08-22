import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { resolveAppSurface } from './appSurface.js'
import './styles/index.css'
import './styles/panels.css'
import './styles/energy-detail.css'

const surfaceMode = resolveAppSurface(window.location.pathname)
document.documentElement.dataset.surface = surfaceMode

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App surfaceMode={surfaceMode} />
  </React.StrictMode>
)
