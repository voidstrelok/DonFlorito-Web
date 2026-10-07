import type { Api } from './types'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let baseUrl = ''

export function configureApi(url: string) {
  baseUrl = url.endsWith('/') || url === 'mock' || url === '' ? url : `${url}/`
}

export const isMock = () => baseUrl === 'mock'

/** Mismo nombre que usaba el sitio anterior. */
export const SESSION_KEY = 'session'
export const UNAUTHORIZED_EVENT = 'df:unauthorized'

const authHeaders = (): Record<string, string> => {
  try {
    const t = sessionStorage.getItem(SESSION_KEY)
    return t ? { Authorization: `Bearer ${t}` } : {}
  } catch {
    return {}
  }
}

type As = 'json' | 'blob' | 'text'

/** Esperas (ms) entre reintentos: cubren un reinicio de la API (~10 s). Se sobrescribe en las pruebas. */
export const retryDelays = { value: [2000, 4000, 6000] }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Corte de red o error de proxy (502/503/504, que el navegador a veces reporta como falla CORS). */
const isTransient = (e: unknown) => e instanceof ApiError && ((e.status === 0 && e.message === "network") || [502, 503, 504].includes(e.status))

/**
 * Las lecturas (GET y POST de solo consulta) reintentan ante fallos transitorios.
 * Las escrituras nunca se reintentan solas para no duplicar reservas, pagos ni anulaciones.
 */
async function request<T>(path: string, init: RequestInit = {}, as: As = "json", retry = (init.method ?? "GET") === "GET"): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await requestOnce<T>(path, init, as)
    } catch (e) {
      const wait = retryDelays.value[attempt]
      if (!retry || wait === undefined || !isTransient(e)) throw e
      await sleep(wait)
    }
  }
}

/** La API responde errores de negocio como texto plano (BadRequest("mensaje")). */
async function requestOnce<T>(path: string, init: RequestInit = {}, as: As = 'json'): Promise<T> {
  let res: Response
  try {
    res = await fetch(baseUrl + path, { ...init, headers: { ...authHeaders(), ...(init.headers as Record<string, string> | undefined) } })
  } catch {
    throw new ApiError(0, 'network')
  }
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    const text = await res.text().catch(() => '')
    let message = text
    try {
      const j = JSON.parse(text)
      message = typeof j === 'string' ? j : (j.title ?? j.message ?? text)
    } catch {
      /* texto plano */
    }
    throw new ApiError(res.status, message || `HTTP ${res.status}`)
  }
  if (res.status === 204) return null as T // .NET devuelve 204 cuando una acción responde null
  if (as === 'blob') return (await res.blob()) as T
  if (as === 'json' && (res.headers.get('content-type') ?? '').includes('text/html')) {
    // Típico de un nginx que reenvía todo a index.html: la URL no llega a la API.
    console.error(`apiUrl (${baseUrl}) respondió HTML en vez de JSON en "${path}". Revisa que apunte a la API y no al front.`)
    throw new ApiError(0, 'La URL de la API no responde como API')
  }
  const text = await res.text()
  if (as === 'text') return text as T
  return (text ? JSON.parse(text) : null) as T // Ok() sin cuerpo
}

const form = (fields: Record<string, string>) => {
  const f = new FormData()
  for (const [k, v] of Object.entries(fields)) f.append(k, v)
  return { method: 'POST', body: f }
}

const json = (body: unknown) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

/**
 * Cancelar es PATCH en el código actual de la API, pero las versiones desplegadas lo exponen como GET
 * (y el proxy rechaza PATCH con 405). Se intenta PATCH y, si no existe, GET.
 */
async function cancel(route: string, id: number): Promise<void> {
  const url = `${route}?IdReserva=${id}`
  try {
    await request(url, { method: 'PATCH' }, 'json', false)
  } catch (e) {
    if (e instanceof ApiError && (e.status === 405 || e.status === 404)) await request(url, {}, 'json', false) // GET que escribe: sin reintentos
    else throw e
  }
}

export const realApi: Api = {
  getParametros: () => request('session/GetParametros'),
  getCatalogo: (FechaReserva) => request('servicios/getCatalogo', form({ FechaReserva }), 'json', true),
  getCalendario: (idServicio, partidos, FechaReserva) =>
    request('servicios/getCalendarioByServicio', form({ IdServicio: String(idServicio), nPartidos: String(partidos), FechaReserva }), 'json', true),
  nuevaReserva: (r) => request('reservas', json(r)),
  usarEnlace: (r) => request('transacciones/usaEnlace', json(r)),
  confirmarReserva: (r, token) => request(`reservas/ConfirmarReserva/${encodeURIComponent(token)}`, json(r)),
  getReserva: (id) => request(`reservas/getById/${id}`),
  getPersonaId: async (RUT) => (await request<{ id: number } | null>('personas/GetPersonaByRut', form({ RUT })))?.id ?? null,
  getQr: async (id) => URL.createObjectURL(await request<Blob>(`reservas/getLinkQR/${id}`, { headers: { Accept: 'image/png,*/*' } }, 'blob')),

  adminLogin: (usuario, password) => request('session/AdminLogin', form({ usuario, password }), 'text'),
  sessionIsValid: async () => Boolean(await request('session/SessionIsValid')),
  getConfig: () => request('session/GetConfig'),
  guardarConfig: async (c) => {
    await request('session/GuardarConfig', json(c))
  },
  getReservas: (anio, mes, pagina, porPagina) => request(`reservas/getReservas?anio=${anio}&mes=${mes}&pagina=${pagina}&porPagina=${porPagina}`),
  getReservasEspeciales: (anio, mes) => request(`reservas/getReservasEspeciales?anio=${anio}&mes=${mes}`),
  cancelarReserva: (id) => cancel('reservas/CancelarReserva', id),
  cancelarReservaEspecial: (id) => cancel('reservas/CancelarReservaEspecial', id),
  ingresarReservaEspecial: async (r) => {
    await request('reservas/IngresarReservaEspecial', json(r))
  },
  getPersonas: () => request('personas/getPersonas'),
  getAllTipoServicios: () => request('servicios/getAllTipoServicios'),
}
