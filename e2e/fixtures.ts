import { test as base, expect } from '@playwright/test'
import { forceApi } from './helpers'

/**
 * `test` con el backend simulado activado en cada prueba, sin importar lo que diga
 * public/config/app-config.json. Las pruebas contra la API real usan `@playwright/test` directamente.
 */
export const test = base.extend<{ mockApi: void }>({
  mockApi: [
    async ({ page }, use) => {
      await forceApi(page, 'mock')
      await use()
    },
    { auto: true },
  ],
})

export { expect }
