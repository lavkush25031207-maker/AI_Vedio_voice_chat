import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// In production the frontend is hosted separately from the FastAPI service.
// Keep local development on relative /api URLs, but send deployed requests to Render.
const apiOrigin = (import.meta.env.VITE_API_URL || 'https://talkflow-api-m5b0.onrender.com').replace(/\/$/, '')
const nativeFetch = window.fetch.bind(window)
window.fetch = (input, init) => {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    input = `${apiOrigin}${input}`
  }
  return nativeFetch(input, init)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
