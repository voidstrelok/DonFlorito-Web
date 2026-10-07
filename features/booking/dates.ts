const pad = (n: number) => String(n).padStart(2, '0')

/** Día local como "yyyy-MM-dd" (formato interno del flujo). */
export const toIsoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const parseIsoDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Formato que exige la API en los formularios: dd-MM-yyyy. */
export const toApiDate = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${d}-${m}-${y}`
}

/** Valor de `fechaReserva` al crear la reserva: medianoche UTC del día, igual que el sitio anterior. */
export const toReservaFecha = (iso: string) => `${iso}T00:00:00.000Z`

export interface BookableRules {
  daysAhead: number
  closedWeekdays: number[]
  allowSameDay: boolean
}

/** Días reservables a partir de `from`, sin los días cerrados. */
export function bookableDays(from: Date, rules: BookableRules): string[] {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate() + (rules.allowSameDay ? 0 : 1))
  const days: string[] = []
  for (let i = 0; i < rules.daysAhead; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    if (!rules.closedWeekdays.includes(d.getDay())) days.push(toIsoDay(d))
  }
  return days
}
