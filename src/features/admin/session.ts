import { useCallback, useEffect, useState } from 'react'
import { api, ApiError, SESSION_KEY, UNAUTHORIZED_EVENT } from '@/api'

export type SessionState = 'checking' | 'out' | 'in'

/** Sesión de administración: token en sessionStorage (misma clave que el sitio anterior). */
export function useAdminSession() {
  const [state, setState] = useState<SessionState>(() => (sessionStorage.getItem(SESSION_KEY) ? 'checking' : 'out'))
  const [notice, setNotice] = useState<string>()

  const signOut = useCallback((message?: string) => {
    sessionStorage.removeItem(SESSION_KEY)
    setNotice(message)
    setState('out')
  }, [])

  // Valida un token guardado
  useEffect(() => {
    if (state !== 'checking') return
    api.sessionIsValid().then(
      (ok) => (ok ? setState('in') : signOut('Sesión expirada.')),
      () => signOut('Sesión expirada.'),
    )
  }, [state, signOut])

  // Cualquier 401 posterior cierra la sesión
  useEffect(() => {
    const onUnauthorized = () => state === 'in' && signOut('Tu sesión expiró. Ingresa nuevamente.')
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [state, signOut])

  const login = useCallback(async (usuario: string, password: string) => {
    const token = await api.adminLogin(usuario, password)
    sessionStorage.setItem(SESSION_KEY, token.trim())
    setNotice(undefined)
    setState('in')
  }, [])

  return { state, notice, login, logout: () => signOut() }
}

/** Mensaje legible de un error de la API. */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.status === 0 ? 'No hay conexión con el servidor.' : e.message
  return e instanceof Error ? e.message : 'Ocurrió un error.'
}
