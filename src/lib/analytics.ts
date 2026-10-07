import type { AppConfig } from '@/config/schema'

/**
 * Consentimiento y analítica (Google Analytics 4).
 * - Sin `ga4Id` en la config no se carga nada.
 * - Con `consentRequired`, GA solo se carga después de que la persona acepta.
 */
const CONSENT_KEY = 'df-consent'
export type Consent = 'granted' | 'denied' | null

export function getConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

export function setConsent(value: 'granted' | 'denied', config: AppConfig) {
  try {
    localStorage.setItem(CONSENT_KEY, value)
  } catch {
    /* modo privado: se ignora */
  }
  if (value === 'granted') loadAnalytics(config)
}

/** ¿Hay que mostrar el banner? Solo si hay analítica configurada y aún no se decidió. */
export function needsConsentBanner(config: AppConfig): boolean {
  return Boolean(config.analytics.ga4Id) && config.analytics.consentRequired && getConsent() === null
}

let loaded = false

export function loadAnalytics(config: AppConfig) {
  const id = config.analytics.ga4Id
  if (!id || loaded) return
  if (config.analytics.consentRequired && getConsent() !== 'granted') return
  loaded = true

  const w = window as unknown as { dataLayer: unknown[]; gtag: (...a: unknown[]) => void }
  w.dataLayer = w.dataLayer || []
  w.gtag = function () {
    // gtag exige el objeto `arguments`, no un array
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments)
  }
  w.gtag('js', new Date())
  w.gtag('config', id, { anonymize_ip: true })

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  document.head.appendChild(s)
}

/** Evento personalizado (p. ej. click_reservar). No hace nada si GA no está cargado. */
export function track(event: string, params?: Record<string, unknown>) {
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag
  gtag?.('event', event, params)
}
