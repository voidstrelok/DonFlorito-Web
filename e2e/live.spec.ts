import { expect, test } from '@playwright/test'
import { DEMO_API, forceApi } from './helpers'

/**
 * Pruebas contra la API demo REAL (no el mock). Crean una reserva PENDIENTE de prueba
 * en la base de la demo y se detienen al llegar a Webpay, sin pagar.
 * Se ejecutan solo con LIVE=1:  LIVE=1 npx playwright test e2e/live.spec.ts
 */
test.skip(!process.env.LIVE, 'definir LIVE=1 para correr contra la API demo')
test.beforeEach(async ({ page }) => forceApi(page, DEMO_API))

test('catálogo y horarios reales', async ({ page }) => {
  await page.goto('/reservar')
  await page.getByRole('button', { name: /sábado|domingo/i }).first().click()
  // Fútbol 1 existe todos los fines de semana, con precio real
  await expect(page.getByText(/\$115\.000 por partido de 90 min/)).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /Futbolito/ }).click()
  await expect(page.getByRole('button', { pressed: false }).filter({ hasText: /\d{2}:\d{2} – \d{2}:\d{2}/ }).first()).toBeVisible({ timeout: 15000 })
})

test('crea la reserva y redirige a Webpay (sin pagar)', async ({ page }) => {
  await page.goto('/reservar')
  await page.getByRole('button', { name: /sábado|domingo/i }).first().click()
  await page.getByRole('button', { name: /Futbolito/ }).click()
  await page.getByRole('button', { pressed: false }).filter({ hasText: /\d{2}:\d{2} – \d{2}:\d{2}/ }).first().click()
  await page.getByRole('button', { name: /^\+ General/ }).click()
  await page.getByRole('button', { name: 'Continuar' }).last().click()

  await page.getByLabel('RUT', { exact: false }).first().fill('111111111')
  await page.getByLabel('Nombre', { exact: true }).fill('Prueba')
  await page.getByLabel('Apellido', { exact: true }).fill('Automatizada')
  await page.getByLabel('Correo electrónico').fill('prueba-automatizada@example.com')
  await page.getByLabel('Teléfono').fill('911111111')
  await page.getByRole('button', { name: 'Revisar y pagar' }).click()

  await page.getByLabel(/Acepto los términos/).check()
  await page.getByRole('button', { name: /Pagar/ }).click()
  // La API crea la reserva + orden y el front envía el POST a Transbank
  await page.waitForURL(/transbank\.cl/, { timeout: 30000 })
})

test('reserva inexistente muestra mensaje claro', async ({ page }) => {
  await page.goto('/mi-reserva/99999999')
  await expect(page.getByText('No encontramos esa reserva')).toBeVisible({ timeout: 15000 })
})

test('reserva confirmada muestra su código QR real', async ({ page }) => {
  // DF24 la creó la prueba de pago exitoso en la base demo
  await page.goto('/mi-reserva/24')
  await expect(page.getByText('DF24')).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('img', { name: 'Código QR de tu reserva' })).toBeVisible({ timeout: 15000 })
})
