import type { AppLocale } from '@/lib/i18n';
import type { ReservaDTO } from '@/lib/types/models';

export const SESSION_KEY = 'session';
export const RESERVA_KEY = 'reserva';
export const LANG_KEY = 'lang';

export function getSessionToken() {
  return typeof window === 'undefined' ? null : sessionStorage.getItem(SESSION_KEY);
}

export function setSessionToken(token: string) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, token);
  }
}

export function clearSessionToken() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export function getStoredReservation() {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(RESERVA_KEY);
  return raw ? (JSON.parse(raw) as ReservaDTO) : null;
}

export function setStoredReservation(reservation: ReservaDTO) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(RESERVA_KEY, JSON.stringify(reservation));
  }
}

export function clearStoredReservation() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(RESERVA_KEY);
  }
}

export function getStoredLocale() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LANG_KEY) as AppLocale | null;
}

export function setStoredLocale(locale: AppLocale) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANG_KEY, locale);
    document.cookie = `${LANG_KEY}=${locale}; path=/; max-age=31536000`;
  }
}
