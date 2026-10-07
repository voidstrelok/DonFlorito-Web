#!/usr/bin/env node
/**
 * Genera las versiones web del mapa del recinto a partir de assets-src/mapa-{es,en}.png (originales, no se publican):
 *   mapa-XX.webp        visor ampliado (1600 px de ancho)
 *   mapa-XX-thumb.webp  miniatura (640 px)
 * Ejecutar cada vez que se reemplace el PNG del mapa en assets-src/:  node scripts/optimize-map.mjs
 */
import { existsSync, statSync } from 'node:fs'
import sharp from 'sharp'

const kb = (f) => `${Math.round(statSync(f).size / 1024)} KB`

for (const lang of ['es', 'en']) {
  const src = `assets-src/mapa-${lang}.png`
  if (!existsSync(src)) {
    console.warn(`(omitido) no existe ${src}`)
    continue
  }
  for (const [suffix, width, quality] of [['', 1600, 82], ['-thumb', 640, 78]]) {
    const out = `public/docs/mapa-${lang}${suffix}.webp`
    await sharp(src).resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(out)
    console.log(`${out}: ${kb(out)}  (original ${kb(src)})`)
  }
}
