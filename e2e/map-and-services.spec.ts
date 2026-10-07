import { expect, test } from './fixtures'

test.describe('/servicios: botón de reserva por servicio', () => {
  test('cada servicio tiene su botón y lleva a reservar con ese servicio destacado', async ({ page }) => {
    await page.goto('/servicios')
    for (const name of ['Fútbol 1', 'Fútbol 2', 'Futbolito', 'Tenis 2 Personas', 'Tenis 4 Personas', 'Piscina General', 'Piscina Adulto Mayor', 'Quinchos Zona Canchas', 'Quinchos Zona Piscinas']) {
      await expect(page.getByRole('link', { name: `Reservar: ${name}`, exact: true })).toBeVisible()
    }
    await page.getByRole('link', { name: 'Reservar: Futbolito', exact: true }).click()
    await expect(page).toHaveURL(/\/reservar\?destacar=3$/)
    await expect(page.locator('[data-highlight="true"]')).toHaveCount(1)
    await expect(page.locator('[data-highlight="true"]')).toContainText('Futbolito')
  })

  test('tenis de 4 personas destaca solo ese servicio', async ({ page }) => {
    await page.goto('/servicios')
    await page.getByRole('link', { name: 'Reservar: Tenis 4 Personas', exact: true }).click()
    await expect(page).toHaveURL(/destacar=5$/)
    await expect(page.locator('[data-highlight="true"]')).toHaveCount(1)
    await expect(page.locator('[data-highlight="true"]')).toContainText('Tenis 4 Personas')
  })

  test('los botones están agrupados dentro de la clasificación a la que pertenecen', async ({ page }) => {
    await page.goto('/servicios')
    const tenis = page.locator('article#tenis')
    await expect(tenis.getByRole('link', { name: /^Reservar: Tenis/ })).toHaveCount(2)
    await expect(tenis.getByRole('link', { name: /Futbolito/ })).toHaveCount(0)
  })
})

test.describe('mapa del recinto', () => {
  async function openAndCheck(page: import('@playwright/test').Page, opener: () => Promise<void>) {
    await opener()
    const dialog = page.getByRole('dialog', { name: 'Mapa del recinto' })
    await expect(dialog).toBeVisible()
    const img = dialog.getByRole('img', { name: /Plano del complejo/ })
    await expect(img).toBeVisible()
    // la imagen realmente cargó (no es un enlace roto)
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(500)
    await expect(dialog.getByRole('link', { name: 'Descargar PDF' })).toHaveAttribute('href', '/docs/mapa-es.pdf')
    return dialog
  }

  test('en /servicios: se abre ampliado, se puede acercar y se cierra con Escape', async ({ page }) => {
    await page.goto('/servicios')
    const dialog = await openAndCheck(page, () => page.getByRole('button', { name: /Mapa del recinto/ }).first().click())
    const zoom = dialog.getByRole('button', { name: 'Acercar' })
    await zoom.click()
    await expect(dialog.getByRole('button', { name: 'Ajustar' })).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
  })

  test('en la reserva: enlace general y enlace junto a la zona de quinchos', async ({ page }) => {
    await page.goto('/reservar')
    await openAndCheck(page, () => page.locator('#contenido').getByRole('button', { name: 'Ver mapa del recinto' }).click())
    await page.keyboard.press('Escape')
    // las zonas de quincho se eligen mirando el plano
    await page.getByRole('button', { name: /sábado|domingo/i }).first().click()
    await page.getByRole('button', { name: 'Mira dónde queda cada zona' }).click()
    await expect(page.getByRole('dialog', { name: 'Mapa del recinto' })).toBeVisible()
  })

  test('en portada, contacto, y pie de página', async ({ page }) => {
    await page.goto('/')
    await openAndCheck(page, () => page.getByRole('button', { name: /Mapa del recinto/ }).first().click())
    await page.keyboard.press('Escape')

    await page.goto('/contacto')
    await openAndCheck(page, () => page.getByRole('button', { name: /Mapa del recinto/ }).first().click())
    await page.keyboard.press('Escape')

    await openAndCheck(page, () => page.getByRole('contentinfo').getByRole('button', { name: 'Ver mapa del recinto' }).click())
  })

  test('tras confirmar una reserva se ofrece el mapa para llegar', async ({ page }) => {
    await page.goto('/reservar')
    await page.getByRole('button', { name: /sábado|domingo/i }).first().click()
    await page.getByRole('button', { name: /^\+ General/ }).click()
    await page.getByRole('button', { name: 'Continuar' }).last().click()
    await page.getByLabel('RUT', { exact: false }).first().fill('123456785')
    await page.getByLabel('Nombre', { exact: true }).fill('Ana')
    await page.getByLabel('Apellido', { exact: true }).fill('Soto')
    await page.getByLabel('Correo electrónico').fill('ana@correo.cl')
    await page.getByLabel('Teléfono').fill('912345678')
    await page.getByRole('button', { name: 'Revisar y pagar' }).click()
    await page.getByLabel(/Acepto los términos/).check()
    await page.getByRole('button', { name: /Pagar/ }).click()
    await expect(page.getByText('¡Reserva confirmada!')).toBeVisible({ timeout: 15000 })
    await openAndCheck(page, () => page.getByRole('button', { name: '¿Cómo llegar a tu cancha o zona?' }).click())
  })

  test('en inglés usa el mapa y los textos en inglés', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('lang', 'en-US'))
    await page.goto('/servicios')
    await page.getByRole('button', { name: /Site map/ }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Site map' })
    await expect(dialog.getByRole('img', { name: /Site plan/ })).toHaveAttribute('src', '/docs/mapa-en.webp')
    await expect(dialog.getByRole('link', { name: 'Download PDF' })).toHaveAttribute('href', '/docs/mapa-en.pdf')
  })
})
