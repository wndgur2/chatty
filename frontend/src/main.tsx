import { StrictMode } from 'react'
import { preconnect } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

const API_URL = import.meta.env.VITE_API_URL

if (typeof document !== 'undefined') {
  preconnect('https://fonts.gstatic.com')
  preconnect('https://fonts.googleapis.com')
  if (typeof API_URL === 'string' && API_URL.trim().length > 0) {
    try {
      preconnect(new URL(API_URL).origin)
    } catch {
      // Ignore malformed API URLs in local env overrides.
    }
  }
}

registerSW({
  immediate: true,
  onOfflineReady() {
    console.info('Chatty is ready to work offline.')
  },
  onRegisterError(error) {
    console.error('PWA service worker registration failed:', error)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
