import type { Frame, Page } from '@playwright/test'
import { DEMO_API, forceApi } from './helpers'

/** Recorrido real contra la API demo y Webpay de INTEGRACIÓN. Crea reservas de prueba en la demo. */

const DEMO_FRONT = 'https://demo-donflorito.thepit.cl'
export const LOCAL_ORIGIN = 'http://127.0.0.1:4200' // mismo origen que baseURL

/** El retorno de Webpay apunta al dominio demo; se lleva al origen local, donde vive el borrador. */
async function routeReturnToLocal(page: Page) {
  await page.route(/demo-donflorito\.thepit\.cl\/mi-reserva/, (r) =>
    r.fulfill({ status: 302, headers: { location: r.request().url().replace(DEMO_FRONT, LOCAL_ORIGIN) } }),
  )
}

export async function bookUntilWebpay(page: Page) {
  await forceApi(page, DEMO_API)
  await routeReturnToLocal(page)
  await page.goto('/reservar')
  await page.getByRole('button', { name: /sábado|domingo/i }).first().click()
  await page.getByRole('button', { name: /Futbolito/ }).click()
  await page.getByRole('button', { pressed: false }).filter({ hasText: /\d{2}:\d{2} – \d{2}:\d{2}/ }).last().click()
  await page.getByRole('button', { name: 'Continuar' }).last().click()
  await page.getByLabel('RUT', { exact: false }).first().fill('111111111')
  await page.getByLabel('Nombre', { exact: true }).fill('Prueba')
  await page.getByLabel('Apellido', { exact: true }).fill('Automatizada')
  await page.getByLabel('Correo electrónico').fill('prueba-automatizada@example.com')
  await page.getByLabel('Teléfono').fill('911111111')
  await page.getByRole('button', { name: 'Revisar y pagar' }).click()
  await page.getByLabel(/Acepto los términos/).check()
  await page.getByRole('button', { name: /Pagar/ }).click()
  await page.waitForURL(/transbank\.cl/, { timeout: 30000 })
}

/** El contenido de Transbank vive en un frame hijo: se busca el elemento en todos los frames. */
export async function inAnyFrame(page: Page, find: (f: Frame) => ReturnType<Frame['locator']>, seconds = 30) {
  for (let i = 0; i < seconds; i++) {
    for (const fr of page.frames()) {
      const l = find(fr)
      if (await l.count().catch(() => 0)) return l.first()
    }
    await page.waitForTimeout(1000)
  }
  throw new Error('no se encontró el elemento en ningún frame')
}

/** Recorre Webpay de integración con la tarjeta de prueba y resuelve el simulador del banco. */
export async function payWithTestCard(page: Page, opcion: 'Aceptar' | 'Rechazar') {
  const tarjetas = await inAnyFrame(page, (f) => f.getByRole('button', { name: /Tarjetas/ }))
  await tarjetas.click()
  const num = await inAnyFrame(page, (f) => f.locator('input[type=tel]'))
  await num.pressSequentially('4051885600446623', { delay: 50 })
  await (await inAnyFrame(page, (f) => f.getByRole('button', { name: 'Continuar' }))).click()
  await (await inAnyFrame(page, (f) => f.locator('input[type=tel]').nth(1))).pressSequentially('1230', { delay: 80 })
  await (await inAnyFrame(page, (f) => f.locator('input[type=password]'))).pressSequentially('123', { delay: 80 })
  await (await inAnyFrame(page, (f) => f.getByRole('button', { name: 'Pagar' }))).click()
  // Simulador del banco
  await page.locator('#rutClient, input[name=rutClient]').fill('11.111.111-1')
  await page.locator('#passwordClient, input[name=passwordClient]').fill('123')
  await page.getByRole('button', { name: 'Aceptar' }).click()
  await page.locator('select').selectOption({ label: opcion })
  await page.getByRole('button', { name: 'Continuar' }).click()
  // Páginas intermedias de Transbank hasta volver al sitio
  for (let i = 0; i < 6 && !page.url().startsWith(LOCAL_ORIGIN); i++) {
    const next = page.getByRole('button', { name: /Continuar|Aceptar|Volver|Finalizar/i }).first()
    if (await next.count().catch(() => 0)) await next.click().catch(() => {})
    await page.waitForTimeout(2000)
  }
}
