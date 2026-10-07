import { isMock, realApi } from './client'
import type { Api } from './types'

export { ApiError, configureApi, isMock, SESSION_KEY, UNAUTHORIZED_EVENT } from './client'
export * from './types'

/** Resuelve en cada llamada si usar el backend real o el mock (se carga solo si hace falta). */
const pick = async (): Promise<Api> => (isMock() ? (await import('./mock')).mockApi : realApi)

export const api: Api = {
  getParametros: async () => (await pick()).getParametros(),
  getCatalogo: async (f) => (await pick()).getCatalogo(f),
  getCalendario: async (s, n, f) => (await pick()).getCalendario(s, n, f),
  nuevaReserva: async (r) => (await pick()).nuevaReserva(r),
  usarEnlace: async (r) => (await pick()).usarEnlace(r),
  confirmarReserva: async (r, t) => (await pick()).confirmarReserva(r, t),
  getReserva: async (id) => (await pick()).getReserva(id),
  getPersonaId: async (rut) => (await pick()).getPersonaId(rut),
  getQr: async (id) => (await pick()).getQr(id),

  adminLogin: async (u, p) => (await pick()).adminLogin(u, p),
  sessionIsValid: async () => (await pick()).sessionIsValid(),
  getConfig: async () => (await pick()).getConfig(),
  guardarConfig: async (c) => (await pick()).guardarConfig(c),
  getReservas: async (a, m, p, pp) => (await pick()).getReservas(a, m, p, pp),
  getReservasEspeciales: async (a, m) => (await pick()).getReservasEspeciales(a, m),
  cancelarReserva: async (id) => (await pick()).cancelarReserva(id),
  cancelarReservaEspecial: async (id) => (await pick()).cancelarReservaEspecial(id),
  ingresarReservaEspecial: async (r) => (await pick()).ingresarReservaEspecial(r),
  getPersonas: async () => (await pick()).getPersonas(),
  getAllTipoServicios: async () => (await pick()).getAllTipoServicios(),
}
