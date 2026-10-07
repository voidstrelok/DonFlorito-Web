import type { Page } from '@playwright/test'

/** Fuerza `apiUrl` en la config que recibe la página, sin tocar el archivo real. */
export async function forceApi(page: Page, apiUrl: string) {
  await page.route('**/config/app-config.json', async (route) => {
    const res = await route.fetch()
    const cfg = await res.json()
    cfg.apiUrl = apiUrl
    await route.fulfill({ response: res, json: cfg })
  })
}

export const DEMO_API = 'https://demo-api-donflorito.thepit.cl/api'
