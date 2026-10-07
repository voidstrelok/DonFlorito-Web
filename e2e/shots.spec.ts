import { test } from '@playwright/test'
import { forceApi } from './helpers'

// Capturas para revisión visual. Se guardan en e2e/.results/shots (ignorado por git).
test('capturas del flujo', async ({ page, isMobile }, info) => {
  await forceApi(page, 'mock')
  const dir = `e2e/.results/shots/${info.project.name}`
  const shot = (n: string) => page.screenshot({ path: `${dir}/${n}.png` })

  await page.goto('/reservar')
  await shot('1-inicio')
  await page.getByRole('button', { name: /sábado|domingo/i }).first().click()
  await page.getByRole('button', { name: /Futbolito/ }).click()
  await page.getByRole('button', { pressed: false }).filter({ hasText: /\d{2}:\d{2} – \d{2}:\d{2}/ }).first().click()
  await page.getByRole('button', { name: /^\+ General/ }).click()
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot('2-elegido')
  if (isMobile) {
    await page.getByRole('button', { name: 'Ver detalle de tu reserva' }).click()
    await shot('3-carro')
    await page.keyboard.press('Escape')
  }
  await page.getByRole('button', { name: 'Continuar' }).last().click()
  await page.getByRole('button', { name: 'Revisar y pagar' }).click()
  await shot('4-datos-errores')
  await page.getByLabel('RUT', { exact: false }).first().fill('123456785')
  await page.getByLabel('Nombre', { exact: true }).fill('Ana')
  await page.getByLabel('Apellido', { exact: true }).fill('Soto')
  await page.getByLabel('Correo electrónico').fill('ana@correo.cl')
  await page.getByLabel('Teléfono').fill('912345678')
  await page.getByRole('button', { name: 'Revisar y pagar' }).click()
  await shot('5-pago')
  await page.getByLabel(/Acepto los términos/).check()
  await page.getByRole('button', { name: /Pagar/ }).click()
  await page.getByText('¡Reserva confirmada!').waitFor()
  await shot('6-confirmada')
})
