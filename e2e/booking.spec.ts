import { expect, test, type Page } from '@playwright/test'
import { forceApi } from './helpers'

// Estas pruebas corren siempre contra el backend simulado.
test.beforeEach(async ({ page }) => forceApi(page, 'mock'))

/** Elige un día, un horario de fútbolito y 2 entradas de piscina. Devuelve nada; deja el carro listo. */
async function fillCart(page: Page) {
  await page.goto('/reservar')
  // Primer día reservable que no sea lunes a jueves (para que haya fútbol): se toma un sábado o domingo.
  const weekend = page.getByRole('button', { name: /sábado|domingo/i }).first()
  await weekend.click()

  await page.getByRole('button', { name: /Futbolito/ }).click()
  await page.getByRole('button', { pressed: false }).filter({ hasText: /\d{2}:\d{2} – \d{2}:\d{2}/ }).first().click()

  await page.getByRole('button', { name: /^\+ General/ }).click()
  await page.getByRole('button', { name: /^\+ General/ }).click()
}

async function continueFromCart(page: Page, mobile: boolean) {
  const btn = page.getByRole('button', { name: 'Continuar' })
  await (mobile ? btn.last() : btn.first()).click()
}

test('reserva completa: elegir, datos, pagar, confirmación', async ({ page, isMobile }) => {
  await fillCart(page)
  await continueFromCart(page, Boolean(isMobile))

  await expect(page).toHaveURL(/\/reservar\/datos$/)
  await page.getByLabel('RUT', { exact: false }).first().fill('123456785')
  await expect(page.getByLabel('RUT', { exact: false }).first()).toHaveValue('12.345.678-5')
  await page.getByLabel('Nombre', { exact: true }).fill('Ana')
  await page.getByLabel('Apellido', { exact: true }).fill('Soto')
  await page.getByLabel('Correo electrónico').fill('ana@correo.cl')
  await page.getByLabel('Teléfono').fill('+56 9 1234 5678')
  await page.getByRole('button', { name: 'Revisar y pagar' }).click()

  await expect(page).toHaveURL(/\/reservar\/pago$/)
  // No se puede pagar sin aceptar términos
  await page.getByRole('button', { name: /Pagar/ }).click()
  await expect(page.getByText('Debes aceptar los términos')).toBeVisible()
  await page.getByLabel(/Acepto los términos/).check()
  await page.getByRole('button', { name: /Pagar/ }).click()

  // El mock hace de Webpay y vuelve a /mi-reserva/?token_ws=...
  await expect(page).toHaveURL(/\/mi-reserva\/\d+\?ok=1$/, { timeout: 15000 })
  await expect(page.getByText('¡Reserva confirmada!')).toBeVisible()
  await expect(page.getByText('Confirmada', { exact: true })).toBeVisible()
  await expect(page.getByText('12.345.678')).toHaveCount(0) // el RUT no se muestra
})

test('no se puede saltar pasos sin carro', async ({ page }) => {
  await page.goto('/reservar/pago')
  await expect(page).toHaveURL(/\/reservar$/)
})

test('datos inválidos muestran errores y no avanzan', async ({ page, isMobile }) => {
  await fillCart(page)
  await continueFromCart(page, Boolean(isMobile))
  await page.getByLabel('RUT', { exact: false }).first().fill('123456789')
  await page.getByRole('button', { name: 'Revisar y pagar' }).click()
  await expect(page.getByText('Revisa el RUT')).toBeVisible()
  await expect(page).toHaveURL(/\/datos$/)
})

test('pago rechazado permite reintentar', async ({ page, isMobile }) => {
  await fillCart(page)
  await continueFromCart(page, Boolean(isMobile))
  await page.getByLabel('RUT', { exact: false }).first().fill('123456785')
  await page.getByLabel('Nombre', { exact: true }).fill('Ana')
  await page.getByLabel('Apellido', { exact: true }).fill('Soto')
  await page.getByLabel('Correo electrónico').fill('ana@correo.cl')
  await page.getByLabel('Teléfono').fill('912345678')
  await page.getByRole('button', { name: 'Revisar y pagar' }).click()
  await page.getByLabel(/Acepto los términos/).check()
  await page.getByRole('button', { name: /Pagar/ }).click()
  await expect(page).toHaveURL(/token_ws=/, { timeout: 15000 })
  // Simula el rechazo del banco con el token especial del mock
  await page.goto('/mi-reserva/?token_ws=mock-fail')
  await expect(page.getByText('No pudimos confirmar tu pago')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reintentar el pago' })).toBeVisible()
})

test('buscar reserva por número', async ({ page }) => {
  await page.goto('/mi-reserva')
  await page.getByLabel('N° de reserva').fill('abc')
  await page.getByRole('button', { name: 'Buscar reserva' }).click()
  await expect(page.getByText('El número no es válido')).toBeVisible()
  await page.getByLabel('N° de reserva').fill('DF999999')
  await page.getByRole('button', { name: 'Buscar reserva' }).click()
  await expect(page.getByText('No encontramos esa reserva')).toBeVisible()
})
