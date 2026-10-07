import { test } from './fixtures'

// Capturas para revisión visual (e2e/.results/shots, ignorado por git).
test('capturas servicios y mapa', async ({ page, isMobile }, info) => {
  const dir = `e2e/.results/shots/${info.project.name}`
  await page.goto('/servicios')
  await page.getByRole('heading', { name: 'Nuestros servicios' }).waitFor()
  await page.getByRole('button', { name: /Mapa del recinto/ }).first().waitFor()
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${dir}/m1-servicios.png`, fullPage: false })
  await page.getByRole('button', { name: /Mapa del recinto/ }).first().click()
  await page.getByRole('dialog').waitFor()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${dir}/m2-visor.png` })
  await page.keyboard.press('Escape')
  await page.goto('/')
  await page.getByText('Ubicación', { exact: false }).first().scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${dir}/m3-home-ubicacion.png` })
  if (!isMobile) {
    await page.goto('/servicios')
    await page.getByRole('heading', { name: 'Nuestros servicios' }).waitFor()
    await page.locator('article#piscinas').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${dir}/m4-piscinas.png` })
  }
})
