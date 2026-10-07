import { test } from '@playwright/test'
import { forceApi } from './helpers'

test('capturas del admin', async ({ page }, info) => {
  await forceApi(page, 'mock')
  const dir = `e2e/.results/shots/${info.project.name}`
  await page.goto('/admin')
  await page.screenshot({ path: `${dir}/a1-login.png` })
  await page.getByLabel('Usuario').fill('admin')
  await page.getByLabel('Contraseña').fill('admin')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await page.getByText('DF901').waitFor()
  await page.screenshot({ path: `${dir}/a2-reservas.png`, fullPage: true })
  await page.getByRole('tab', { name: 'Servicios y precios' }).click()
  await page.getByLabel('Precio de Futbolito').waitFor()
  await page.screenshot({ path: `${dir}/a3-servicios.png`, fullPage: true })
  await page.getByRole('tab', { name: 'Reservas especiales' }).click()
  await page.getByRole('button', { name: 'Nueva reserva especial' }).click()
  await page.getByRole('dialog').waitFor()
  await page.screenshot({ path: `${dir}/a4-especial.png` })
})
