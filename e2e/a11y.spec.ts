import AxeBuilder from '@axe-core/playwright'
import { expect, test } from './fixtures'

/**
 * Accesibilidad automatizada (axe, WCAG 2.1 A/AA). Falla ante problemas graves o críticos;
 * los menores se informan en consola. Cubre lo que detecta una herramienta: no reemplaza una revisión manual.
 */
const PAGES = ['/', '/servicios', '/servicios/tenis', '/contacto', '/reservar', '/mi-reserva', '/admin', '/ruta-que-no-existe']

for (const path of PAGES) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    if (path === '/reservar') await page.getByRole('button', { name: /sábado|domingo/i }).first().click()
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    for (const v of violations) console.log(`A11Y ${path} [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length}) ej: ${v.nodes[0].target.join(' ').slice(0, 80)}`)
    expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'), 'problemas graves de accesibilidad').toEqual([])
  })
}

test('axe: flujo de datos y pago', async ({ page }) => {
  await page.goto('/reservar')
  await page.getByRole('button', { name: /sábado|domingo/i }).first().click()
  await page.getByRole('button', { name: /^\+ General/ }).click()
  await page.getByRole('button', { name: 'Continuar' }).last().click()
  const datos = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  await page.getByRole('button', { name: 'Revisar y pagar' }).click() // con errores visibles
  const errores = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  for (const v of [...datos.violations, ...errores.violations]) console.log(`A11Y datos [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length}) ej: ${v.nodes[0].target.join(' ').slice(0, 80)}`)
  expect([...datos.violations, ...errores.violations].filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
})

test('axe: detalle de cada clasificación (todas las bandas de color)', async ({ page }) => {
  for (const id of ['canchas', 'tenis', 'piscinas', 'quinchos']) {
    await page.goto(`/servicios/${id}`)
    await page.waitForLoadState('networkidle')
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    for (const v of violations) console.log(`A11Y /servicios/${id} [${v.impact}] ${v.id}: ${v.help}`)
    expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'), id).toEqual([])
  }
})
