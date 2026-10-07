import { defineConfig, devices } from '@playwright/test'

/** Las pruebas e2e usan el backend simulado (apiUrl = "mock" en public/config/app-config.json). */
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  use: { baseURL: 'http://127.0.0.1:4200', locale: 'es-CL', timezoneId: 'America/Santiago' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:4200', reuseExistingServer: true },
})
