export const cleanRut = (v: string) => v.replace(/[^0-9kK]/g, '').toUpperCase()

/** Formatea mientras se escribe: 12345678K -> 12.345.678-K */
export function formatRut(v: string): string {
  const c = cleanRut(v).slice(0, 9)
  if (c.length < 2) return c
  return `${c.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${c.slice(-1)}`
}

/** Módulo 11. Acepta con o sin puntos y guion. */
export function isRutValid(v: string): boolean {
  const c = cleanRut(v)
  if (c.length < 8 || c.length > 9) return false
  const body = c.slice(0, -1)
  const dv = c.slice(-1)
  if (!/^\d+$/.test(body)) return false
  let sum = 0
  let mul = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * mul
    mul = mul === 7 ? 2 : mul + 1
  }
  const r = 11 - (sum % 11)
  const expected = r === 11 ? '0' : r === 10 ? 'K' : String(r)
  return expected === dv
}

/** Formato que guarda la API: sin puntos, "12345678-5". */
export const apiRut = (v: string) => {
  const c = cleanRut(v)
  return `${c.slice(0, -1)}-${c.slice(-1)}`
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())

export const phoneDigits = (v: string) => v.replace(/\D/g, '')
export const isPhone = (v: string) => {
  const n = phoneDigits(v).length
  return n >= 8 && n <= 12
}

export const isName = (v: string) => /^\p{L}[\p{L}\s'.-]*$/u.test(v.trim()) && v.trim().length >= 2
