import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import '@fontsource/bebas-neue/latin-400.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-800.css'
import '@fontsource/dm-mono/latin-400.css'
import '@fontsource/dm-mono/latin-500.css'
import './index.css'

// Después de un deploy, una pestaña abierta puede pedir archivos de una sección
// que ya no existen (404) y quedar en blanco. Recargamos para traer la versión
// nueva; como mucho una vez cada 10 s para no entrar en un bucle si el archivo
// falta de verdad.
window.addEventListener('vite:preloadError', (event) => {
  try {
    const ultima = Number(sessionStorage.getItem('recarga_por_deploy') || 0)
    if (Date.now() - ultima < 10000) return
    sessionStorage.setItem('recarga_por_deploy', String(Date.now()))
  } catch { /* sin sessionStorage: recargamos igual */ }
  event.preventDefault()
  window.location.reload()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
