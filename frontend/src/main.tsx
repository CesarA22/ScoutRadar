import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyLanguage, applyTheme, getStoredLanguage, getStoredTheme } from './lib/preferences'
import './index.css'

applyTheme(getStoredTheme() ?? 'dark')
applyLanguage(getStoredLanguage() ?? 'pt')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
