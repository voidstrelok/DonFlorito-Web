import { expect, test } from '@playwright/test'
import { bookUntilWebpay, inAnyFrame, payWithTestCard } from './webpay-helpers'

/**
 * Contra la API demo + Webpay de INTEGRACIÓN (solo con LIVE_PAY=1).
 * Crea reservas de prueba en la base de la demo.
 */
test.skip(!process.env.LIVE_PAY, 'definir LIVE_PAY=1')
test.setTimeout(240000)

const SHOTS = 'e2e/.results/webpay'

test('webpay: anular y volver', async ({ page }) => {
  await bookUntilWebpay(page)
  const anular = await inAnyFrame(page, (f) => f.getByRole('button', { name: 'Anular compra y volver' }))
  await anular.click()
  await expect(page.getByText('Cancelaste el pago')).toBeVisible({ timeout: 30000 })
  await expect(page.getByRole('button', { name: 'Reintentar el pago' })).toBeVisible()
  await page.screenshot({ path: `${SHOTS}/2-anulado.png`, fullPage: true })
})

test('webpay: pago exitoso confirma la reserva (API real)', async ({ page }) => {
  await bookUntilWebpay(page)
  await payWithTestCard(page, 'Aceptar')
  await expect(page).toHaveURL(/\/mi-reserva\/\d+\?ok=1/, { timeout: 60000 })
  await expect(page.getByText('¡Reserva confirmada!')).toBeVisible()
  await expect(page.getByText('Confirmada', { exact: true })).toBeVisible()
  await page.screenshot({ path: `${SHOTS}/6-confirmada.png`, fullPage: true })
})

test('webpay: pago rechazado por el banco permite reintentar (API real)', async ({ page }) => {
  await bookUntilWebpay(page)
  await payWithTestCard(page, 'Rechazar')
  await expect(page.getByText('No pudimos confirmar tu pago')).toBeVisible({ timeout: 60000 })
  await expect(page.getByRole('button', { name: 'Reintentar el pago' })).toBeVisible()
  await page.screenshot({ path: `${SHOTS}/7-rechazada.png`, fullPage: true })
})
