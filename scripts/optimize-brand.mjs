#!/usr/bin/env node
/**
 * Reduce las ilustraciones de public/brand al tamaño con que se muestran (con margen para pantallas 2x),
 * conservando nombre y formato PNG. Idempotente: no agranda ni reprocesa lo que ya es pequeño.
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const LIMITS = { 'futbol.png': { height: 640 }, 'tenis.png': { height: 640 }, 'quinchos.png': { height: 640 }, 'florito.png': { height: 800 }, 'piscina.png': { width: 960 } }

for (const file of readdirSync('public/brand')) {
  const limit = LIMITS[file]
  if (!limit) continue
  const path = `public/brand/${file}`
  const before = statSync(path).size
  const out = await sharp(path).resize({ ...limit, withoutEnlargement: true }).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer()
  if (out.length < before) writeFileSync(path, out)
  console.log(`${file.padEnd(14)} ${Math.round(before / 1024)} KB -> ${Math.round(Math.min(before, out.length) / 1024)} KB`)
}
