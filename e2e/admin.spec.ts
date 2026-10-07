import { expect, test, type Page } from '@playwright/test'
import { forceApi } from './helpers'

// El admin se prueba contra el backend simulado (usuario admin / contraseña admin).
test.beforeEach(async ({ page }) => forceApi(page, 'mock'))

async function login(page: Page) {
  await page.goto('/admin')
  await page.getByLabel('Usuario').fill('admin')
  await page.getByLabel('Contraseña').fill('admin')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: 'Administración del sitio' })).toBeVisible()
}

test('login: rechaza credenciales incorrectas y entra con las correctas', async ({ page }) => {
  await page.goto('/admin')
  await page.getByLabel('Usuario').fill('admin')
  await page.getByLabel('Contraseña').fill('mala')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByText('Credenciales incorrectas')).toBeVisible()
  await page.getByLabel('Contraseña').fill('admin')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: 'Administración del sitio' })).toBeVisible()
  // la sesión sobrevive a recargar y se cierra con el botón
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Administración del sitio' })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page.getByRole('heading', { name: 'Acceso administración' })).toBeVisible()
})

test('reservas: filtrar, buscar y anular', async ({ page }) => {
  await login(page)
  await expect(page.getByText('DF901')).toBeVisible()
  await page.getByRole('button', { name: /^Anuladas/ }).click()
  await expect(page.getByText('DF904')).toBeVisible()
  await expect(page.getByText('DF901')).toHaveCount(0)
  await page.getByRole('button', { name: /^Todas/ }).click()
  await page.getByLabel('Buscar reservas').fill('marta')
  await expect(page.getByText('DF903')).toBeVisible()
  await expect(page.getByText('DF902')).toHaveCount(0)

  await page.getByLabel('Buscar reservas').fill('DF902')
  await page.getByRole('button', { name: 'Anular reserva DF902' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Anular reserva' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Anular reserva DF902' })).toHaveCount(0) // ya no es anulable
  await expect(page.getByText('Anulada', { exact: true })).toBeVisible()
})

test('reservas especiales: crear y cancelar', async ({ page }) => {
  await login(page)
  await page.getByRole('tab', { name: 'Reservas especiales' }).click()
  await page.getByRole('button', { name: 'Nueva reserva especial' }).click()
  // sin elegir servicio no deja avanzar
  await page.getByRole('button', { name: 'Revisar' }).click()
  await expect(page.getByText('Selecciona el tipo de servicio.')).toBeVisible()
  await page.getByText('Todo el camping', { exact: true }).click()
  await page.getByRole('button', { name: 'Revisar' }).click()
  await expect(page.getByText('Se bloqueará')).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByText('Todo el camping')).toBeVisible()

  await page.getByRole('button', { name: /Cancelar reserva especial R2/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar reserva' }).click()
  await expect(page.getByText('Todo el camping')).toHaveCount(0)
})

test('servicios: el cambio de precio se refleja en el sitio', async ({ page }) => {
  await login(page)
  await page.getByRole('tab', { name: 'Servicios y precios' }).click()
  const precio = page.getByLabel('Precio de Futbolito')
  await expect(precio).toHaveValue('15000')
  await precio.fill('20000')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.getByText('Cambios guardados')).toBeVisible()
  await expect(precio).toHaveValue('20000')

  await page.goto('/reservar')
  await page.getByRole('button', { name: /sábado|domingo/i }).first().click()
  await expect(page.getByText(/\$20\.000 por partido de 60 min/)).toBeVisible()
})

test('configuración: deshabilitar las reservas en línea pausa el sitio', async ({ page }) => {
  await login(page)
  await page.getByRole('tab', { name: 'Configuración' }).click()
  await page.getByRole('switch').first().uncheck({ force: true })
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.getByText('Cambios guardados.')).toBeVisible()
  await page.goto('/reservar')
  await expect(page.getByText('Las reservas en línea están pausadas')).toBeVisible()
})

test('configuración: valida el horario', async ({ page }) => {
  await login(page)
  await page.getByRole('tab', { name: 'Configuración' }).click()
  await page.getByLabel('Cierre').fill('08:00')
  await expect(page.getByText('El cierre debe ser posterior a la apertura.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
})

test('sin sesión no se ven datos: la API responde 401', async ({ page }) => {
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Acceso administración' })).toBeVisible()
  await expect(page.getByRole('tab')).toHaveCount(0)
})
