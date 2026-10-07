import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import esCL from './locales/es-CL.json'
import enUS from './locales/en-US.json'

export const LANGS = ['es-CL', 'en-US'] as const
export type Lang = (typeof LANGS)[number]

/** Misma clave que usaba el sitio anterior, para no perder la preferencia del usuario. */
const STORAGE_KEY = 'lang'

export function initI18n(englishEnabled: boolean) {
  const supported = englishEnabled ? [...LANGS] : ['es-CL']
  return i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: { 'es-CL': { translation: esCL }, 'en-US': { translation: enUS } },
      supportedLngs: supported,
      fallbackLng: 'es-CL',
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: STORAGE_KEY,
        caches: ['localStorage'],
        // es-ES, es-MX... -> es-CL; en-GB, en-AU... -> en-US
        convertDetectedLanguage: (lng: string) => (lng.toLowerCase().startsWith('en') ? 'en-US' : 'es-CL'),
      },
    })
    .then(() => {
      const sync = (lng: string) => {
        document.documentElement.lang = lng
      }
      sync(i18n.resolvedLanguage ?? 'es-CL')
      i18n.on('languageChanged', sync)
    })
}

export default i18n
