import { isMock, type Reserva } from '@/api'

/**
 * La reserva pendiente se guarda en localStorage (no sessionStorage): al ir a Transbank y volver,
 * algunos navegadores aíslan el sessionStorage y la reserva se perdía justo al confirmar el pago.
 * Vence a los 60 minutos para no dejar reservas viejas en el dispositivo.
 */
const KEY = 'df-pending-reserva'
const LEGACY_KEY = 'reserva' // sitio anterior (sessionStorage)
const TTL_MS = 60 * 60 * 1000

export function savePending(r: Reserva) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), reserva: r }))
  } catch {
    sessionStorage.setItem(LEGACY_KEY, JSON.stringify(r))
  }
}

export function loadPending(): Reserva | null {
  try {
    const v = localStorage.getItem(KEY)
    if (v) {
      const { at, reserva } = JSON.parse(v) as { at: number; reserva: Reserva }
      if (Date.now() - at < TTL_MS) return reserva
      localStorage.removeItem(KEY)
    }
    const legacy = sessionStorage.getItem(LEGACY_KEY)
    return legacy ? (JSON.parse(legacy) as Reserva) : null
  } catch {
    return null
  }
}

export function clearPending() {
  try {
    localStorage.removeItem(KEY)
    sessionStorage.removeItem(LEGACY_KEY)
  } catch {
    /* ignorar */
  }
}

/**
 * Lleva a la persona a Webpay. Transbank exige un POST con `token_ws`.
 * En modo mock no hay banco: vuelve directo con el token.
 */
export function goToWebpay(reserva: Reserva) {
  const orden = reserva.ordenCompra[0]
  if (!orden?.url || !orden.token) throw new Error('Sin orden de pago')
  if (isMock()) {
    location.assign(`${orden.url}?token_ws=${encodeURIComponent(orden.token)}`)
    return
  }
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = orden.url
  const input = document.createElement('input')
  input.type = 'hidden'
  input.name = 'token_ws'
  input.value = orden.token
  form.appendChild(input)
  document.body.appendChild(form)
  form.submit()
}
