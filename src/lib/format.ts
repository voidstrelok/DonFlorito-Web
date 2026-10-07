const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

/** $12.000 */
export const money = (n: number) => clp.format(n)

const isEn = (lang: string) => lang.startsWith('en')

/** Hora de un string ISO sin zona (la API manda hora local del complejo). */
export function timeLabel(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(lang, { hour: isEn(lang) ? 'numeric' : '2-digit', minute: '2-digit', hour12: isEn(lang) }).format(new Date(iso))
}

export function longDay(d: Date, lang: string): string {
  return new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(d)
}

export const shortWeekday = (d: Date, lang: string) => new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(d).replace('.', '')
export const shortMonth = (d: Date, lang: string) => new Intl.DateTimeFormat(lang, { month: 'short' }).format(d).replace('.', '')
