import { expect, test, type Page } from '@playwright/test'
import { DEMO_API, forceApi } from './helpers'
import { bookUntilWebpay, payWithTestCard } from './webpay-helpers'

/**
 * Admin contra la API demo REAL. Requiere LIVE_ADMIN=1 y las credenciales en variables de entorno
 * (DF_ADMIN_USER, DF_ADMIN_PASS); nunca se guardan en el repositorio.
 *   $env:LIVE_ADMIN=1; $env:DF_ADMIN_USER="..."; $env:DF_ADMIN_PASS="..."; npx playwright test e2e/live-admin.spec.ts
 * Modifica datos de la demo (crea y cancela un bloqueo; cambia un precio y lo restablece).
 */
test.skip(!process.env.LIVE_ADMIN || !process.env.DF_ADMIN_USER || !process.env.DF_ADMIN_PASS, 'definir LIVE_ADMIN, DF_ADMIN_USER y DF_ADMIN_PASS')
test.setTimeout(120000)
test.beforeEach(async ({ page }) => forceApi(page, DEMO_API))

async function login(page: Page) {
  await page.goto('/admin')
  await page.getByLabel('Usuario').fill(process.env.DF_ADMIN_USER!)
  await page.getByLabel('Contraseña').fill(process.env.DF_ADMIN_PASS!)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: 'Administración del sitio' })).toBeVisible({ timeout: 20000 })
}

test('login real: credenciales malas se rechazan y las buenas entran', async ({ page }) => {
  await page.goto('/admin')
  await page.getByLabel('Usuario').fill(process.env.DF_ADMIN_USER!)
  await page.getByLabel('Contraseña').fill('incorrecta-a-proposito')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 20000 })
  await login(page)
  await page.reload() // la sesión (JWT) sobrevive y es válida para la API
  await expect(page.getByRole('heading', { name: 'Administración del sitio' })).toBeVisible({ timeout: 20000 })
})

test('lectura real: reservas, personas, servicios y configuración', async ({ page }) => {
  await login(page)

  // Reservas del mes: las de las pruebas de pago anteriores
  await expect(page.getByText(/^DF\d+$/).first()).toBeVisible({ timeout: 20000 })
  console.log('reservas visibles en la lista:', await page.getByText(/^DF\d+$/).count())

  await page.getByRole('tab', { name: 'Personas' }).click()
  await expect(page.getByText(/\d+ personas?/)).toBeVisible({ timeout: 20000 })

  await page.getByRole('tab', { name: 'Servicios y precios' }).click()
  await expect(page.getByLabel('Precio de Futbolito')).toBeVisible({ timeout: 20000 })
  console.log('precio Futbolito (API real):', await page.getByLabel('Precio de Futbolito').inputValue())

  await page.getByRole('tab', { name: 'Configuración' }).click()
  await expect(page.getByLabel('Apertura')).toBeVisible({ timeout: 20000 })
  console.log('horario real:', await page.getByLabel('Apertura').inputValue(), '-', await page.getByLabel('Cierre').inputValue())

  await page.getByRole('tab', { name: 'Reservas especiales' }).click()
  await expect(page.getByRole('button', { name: 'Nueva reserva especial' })).toBeVisible()
})

test('especiales reales: crear un bloqueo y cancelarlo', async ({ page }) => {
  await login(page)
  await page.getByRole('tab', { name: 'Reservas especiales' }).click()
  const rows = page.getByText('Todo el camping', { exact: true })
  await expect(page.getByRole('button', { name: 'Nueva reserva especial' })).toBeVisible({ timeout: 20000 })
  await page.waitForTimeout(1500)
  const before = await rows.count()

  // último día del mes, 23:00-23:30: fuera del horario de atención
  const now = new Date()
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const day = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
  await page.getByRole('button', { name: 'Nueva reserva especial' }).click()
  await page.getByText('Todo el camping', { exact: true }).click()
  await page.getByLabel('Fecha de inicio').fill(day)
  await page.getByLabel('Hora de inicio').fill('23:00')
  await page.getByLabel('Fecha de término').fill(day)
  await page.getByLabel('Hora de término').fill('23:30')
  await page.getByRole('button', { name: 'Revisar' }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(rows).toHaveCount(before + 1, { timeout: 20000 })

  const cancelBtn = page.getByRole('button', { name: /Cancelar reserva especial R\d+/ }).last()
  await cancelBtn.click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar reserva' }).click()
  await expect(rows).toHaveCount(before, { timeout: 20000 })
})

test('precios reales: cambiar el precio, verlo en el sitio y restablecerlo', async ({ page }) => {
  await login(page)
  await page.getByRole('tab', { name: 'Servicios y precios' }).click()
  const precio = page.getByLabel('Precio de Tenis 2 Personas')
  await expect(precio).toBeVisible({ timeout: 20000 })
  const original = Number(await precio.inputValue())
  const changed = original + 500
  const money = (n: number) => `$${n.toLocaleString('es-CL')}`

  try {
    await precio.fill(String(changed))
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByText('Cambios guardados')).toBeVisible({ timeout: 20000 })
    await expect(precio).toHaveValue(String(changed))

    await page.goto('/reservar')
    await page.getByRole('button', { name: /sábado|domingo/i }).first().click()
    await expect(page.getByText(`${money(changed)} por partido`).first()).toBeVisible({ timeout: 20000 })
  } finally {
    await page.goto('/admin')
    await page.getByRole('tab', { name: 'Servicios y precios' }).click()
    const p = page.getByLabel('Precio de Tenis 2 Personas')
    await p.fill(String(original))
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByText('Cambios guardados')).toBeVisible({ timeout: 20000 })
    await expect(p).toHaveValue(String(original))
  }
})

test('anular reserva real: pago de prueba y anulación desde el admin', async ({ page }) => {
  // 1) una reserva confirmada nueva, pagada con Webpay de integración
  await bookUntilWebpay(page)
  await payWithTestCard(page, 'Aceptar')
  await expect(page).toHaveURL(/\/mi-reserva\/(\d+)\?ok=1/, { timeout: 60000 })
  const id = Number(/\/mi-reserva\/(\d+)/.exec(page.url())![1])

  // 2) su mes, para ubicarla en el listado
  const res = await page.request.get(`${DEMO_API}/reservas/getById/${id}`)
  const fecha = (await res.json()).fechaReserva as string // yyyy-MM-dd...
  const [anio, mes] = fecha.slice(0, 7).split('-').map(Number)

  await page.goto('/admin')
  // la sesión puede no haber sobrevivido al paso por Transbank: se espera a que se resuelva la verificación
  await page.getByRole('heading', { name: /Administración del sitio|Acceso administración/ }).first().waitFor({ timeout: 20000 })
  if (await page.getByLabel('Usuario').isVisible()) await login(page)
  await expect(page.getByRole('heading', { name: 'Administración del sitio' })).toBeVisible({ timeout: 20000 })
  await page.getByLabel('Año').selectOption(String(anio))
  await page.getByLabel('Mes').selectOption(String(mes))
  await page.getByLabel('Buscar reservas').fill(`DF${id}`)
  await expect(page.getByText(`DF${id}`, { exact: true })).toBeVisible({ timeout: 20000 })

  // 3) anular (PATCH y, si el servidor no lo admite, GET)
  await page.getByRole('button', { name: `Anular reserva DF${id}` }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Anular reserva' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 20000 })
  await expect(page.getByText('Anulada', { exact: true })).toBeVisible({ timeout: 20000 })
  await expect(page.getByRole('button', { name: `Anular reserva DF${id}` })).toHaveCount(0)

  // 4) la API también la ve anulada
  const after = await page.request.get(`${DEMO_API}/reservas/getById/${id}`)
  expect((await after.json()).idEstadoReserva).toBe(3)
})
