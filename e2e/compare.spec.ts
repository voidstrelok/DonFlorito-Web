import { test } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

// Solo con COMPARE=1. Comparación visual y de rendimiento: sitio actual (donflorito.cl) vs. nuevo (local). Solo lecturas.
const SITES = [
  { id: 'prod', base: 'https://donflorito.cl' },
  { id: 'nuevo', base: 'http://127.0.0.1:4200' },

]
const PAGES = [['home', '/'], ['servicios', '/servicios'], ['contacto', '/contacto'], ['reservar', '/reservar'], ['mireserva', '/mi-reserva']]

test.skip(!process.env.COMPARE, 'definir COMPARE=1 (visita el sitio actual en producción, solo lectura)')

test('comparar sitios', async ({ browser }, info) => {
  test.setTimeout(240000)
  const dir = `e2e/.results/compare/${info.project.name}`
  mkdirSync(dir, { recursive: true })
  const rows: string[] = []
  for (const site of SITES) {
    for (const [name, path] of PAGES) {
      const ctx = await browser.newContext(info.project.use)
      const page = await ctx.newPage()
      let bytes = 0, requests = 0
      const errors: string[] = []
      const failed: string[] = []
      page.on('response', async (r) => {
        requests++
        try { bytes += (await r.body()).length } catch { /* redirecciones */ }
        if (r.status() >= 400) failed.push(`${r.status()} ${r.url().slice(0, 90)}`)
      })
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)) })
      const t0 = Date.now()
      await page.goto(site.base + path, { waitUntil: 'load' }).catch(() => {})
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
      const ms = Date.now() - t0
      const loadBytes = bytes, loadReq = requests // antes de forzar imágenes diferidas con la captura completa
      await page.waitForTimeout(1200)
      await page.screenshot({ path: `${dir}/${site.id}-${name}.png`, fullPage: true })
      const h = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, vw: innerWidth }))
      rows.push(`${site.id.padEnd(6)} ${name.padEnd(10)} ${String(loadReq).padStart(3)} req  ${String(Math.round(loadBytes / 1024)).padStart(5)} KB  ${String(ms).padStart(5)} ms  overflowX=${h.w > h.vw + 1 ? 'SI' : 'no'}  errores=${errors.length} fallidos=${failed.length}${failed.length ? ' ' + failed.slice(0, 2).join(' | ') : ''}`)
      await ctx.close()
    }
  }
  writeFileSync(`${dir}/resumen.txt`, rows.join('\n'))
  console.log('\n' + rows.join('\n'))
})
