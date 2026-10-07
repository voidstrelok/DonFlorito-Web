import { expect, test } from './fixtures'

test('menú Servicios → clasificación → servicio → reservar con destacado', async ({ page, isMobile }) => {
  await page.goto('/')
  if (isMobile) {
    await page.getByRole('button', { name: 'Menú' }).click()
    await page.getByRole('menuitem', { name: 'Servicios' }).click()
  } else {
    await page.getByRole('button', { name: 'Servicios' }).click()
  }
  // Por teclado: el recorrido del puntero entre submenús no es determinista en las pruebas.
  await page.getByRole('menuitem', { name: /Canchas de fútbol/ }).focus()
  await page.keyboard.press('ArrowRight')
  await page.getByRole('menuitem', { name: 'Futbolito', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/servicios\/canchas#futbolito/)
  await expect(page.getByRole('heading', { name: 'Canchas de fútbol y futbolito', level: 1 })).toBeVisible()

  await page.getByRole('link', { name: 'Reservar: Futbolito' }).click()
  await expect(page).toHaveURL(/\/reservar\?destacar=3/)
  await expect(page.locator('[data-highlight="true"]')).toHaveCount(1)
  await expect(page.locator('[data-highlight="true"]')).toContainText('Tu elección')
})

test('detalle de tenis lista tenis 2 y 4 y destaca ambos al reservar', async ({ page }) => {
  await page.goto('/servicios/tenis')
  await expect(page.getByRole('heading', { name: 'Tenis 2 Personas' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Tenis 4 Personas' })).toBeVisible()
  await page.getByRole('link', { name: 'Reservar ahora' }).click()
  await expect(page).toHaveURL(/destacar=4,5|destacar=4%2C5/)
  await expect(page.locator('[data-highlight="true"]')).toHaveCount(2)
})

test('clasificación inexistente muestra 404', async ({ page }) => {
  await page.goto('/servicios/nada')
  await expect(page.getByText('404')).toBeVisible()
})

test('al abrir la reserva sin destacado se elige el primer día disponible', async ({ page }) => {
  await page.goto('/reservar')
  await expect(page.locator('button[aria-pressed="true"]').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Canchas' })).toBeVisible()
})

test('si el día guardado no tiene el servicio destacado, se cambia a uno que sí', async ({ page }) => {
  // Un miércoles próximo: el fútbol no abre de lunes a jueves.
  const d = new Date()
  d.setDate(d.getDate() + ((3 - d.getDay() + 7) % 7 || 7))
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  await page.addInitScript(([k, v]) => sessionStorage.setItem(k, v), ['df-booking-draft', JSON.stringify({ fecha: iso, lines: [] })])
  await page.goto('/reservar?destacar=1')
  await expect(page.locator('[data-highlight="true"]')).toHaveCount(1)
})
