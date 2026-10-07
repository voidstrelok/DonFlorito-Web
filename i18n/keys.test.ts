import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import es from './locales/es-CL.json'
import en from './locales/en-US.json'

const flatten = (o: unknown, prefix = ''): string[] =>
  typeof o === 'object' && o !== null
    ? Object.entries(o).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k))
    : [prefix]

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) && !/\.test\./.test(f) ? [p] : []
  })

const keysOf = (j: unknown) => new Set(flatten(j))
const has = (set: Set<string>, key: string) => set.has(key) || set.has(`${key}_one`) || set.has(`${key}_other`)

describe('i18n', () => {
  const esKeys = keysOf(es)
  const enKeys = keysOf(en)

  it('todas las claves usadas con t("...") existen en ambos idiomas', () => {
    const used = new Set<string>()
    for (const file of walk(join(import.meta.dirname, '..'))) {
      for (const m of readFileSync(file, 'utf8').matchAll(/\bt\(\s*['"]([A-Za-z][\w.]*)['"]/g)) used.add(m[1])
    }
    const missingEs = [...used].filter((k) => !has(esKeys, k))
    const missingEn = [...used].filter((k) => !has(enKeys, k))
    expect({ missingEs, missingEn }).toEqual({ missingEs: [], missingEn: [] })
  })

  it('es-CL y en-US tienen las mismas claves (salvo `names`, solo inglés)', () => {
    const strip = (s: Set<string>) => [...s].filter((k) => !k.startsWith('names.')).sort()
    expect(strip(enKeys)).toEqual(strip(esKeys))
  })
})
