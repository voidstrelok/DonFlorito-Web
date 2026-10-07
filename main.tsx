import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/inter'
import './styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { ConfigProvider, loadConfig } from './config'
import { initI18n } from './i18n'
import { configureApi } from './api'
import { loadAnalytics } from './lib/analytics'

const root = createRoot(document.getElementById('root')!)

async function boot() {
  try {
    const config = await loadConfig()
    configureApi(config.apiUrl)
    await initI18n(config.features.english)
    loadAnalytics(config) // no hace nada sin ga4Id o sin consentimiento previo
    root.render(
      <StrictMode>
        <ConfigProvider config={config}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ConfigProvider>
      </StrictMode>,
    )
  } catch (err) {
    console.error(err)
    root.render(
      <pre style={{ padding: 24, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
        No se pudo iniciar la aplicación.{'\n\n'}
        {err instanceof Error ? err.message : String(err)}
      </pre>,
    )
  }
}

void boot()
