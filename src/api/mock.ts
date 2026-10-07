import { ApiError, SESSION_KEY, UNAUTHORIZED_EVENT } from './client'
import type { Api, Config, Persona, PrecioServicio, Reserva, ReservaCreacion, ReservaEspecial, Servicio, Slot, TipoServicio } from './types'

/**
 * Backend simulado para desarrollar y probar sin la API .NET (apiUrl = "mock").
 * Precios, nombres y datos son de ejemplo, NO son los reales.
 * Admin de prueba: usuario "admin", contraseña "admin".
 */
const pad = (n: number) => String(n).padStart(2, '0')
const delay = <T,>(v: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(v), ms))

const sv = (id: number, nombre: string, idTipoServicio: number): Servicio => ({ id, nombre, idTipoServicio, isEnabled: true, precio: 0, cambiaPrecio: false })
const pr = (id: number, idServicio: number, precio: number, minutos: number | null): PrecioServicio => ({ id, idServicio, precio, minutos, isEnabled: true })

const CATALOGO: TipoServicio[] = [
  { id: 1, nombre: 'Fútbol 1', maxPartidos: 3, servicio: [sv(1, 'Cancha Fútbol 1', 1), sv(2, 'Cancha Fútbol 2', 1)], precioServicio: [pr(1, 1, 30000, 60)] },
  { id: 2, nombre: 'Fútbol 2', maxPartidos: 3, servicio: [sv(3, 'Cancha Fútbol 3', 2), sv(4, 'Cancha Fútbol 4', 2)], precioServicio: [pr(2, 3, 22000, 60)] },
  { id: 3, nombre: 'Futbolito', maxPartidos: 4, servicio: [sv(5, 'Cancha Futbolito 1', 3), sv(6, 'Cancha Futbolito 2', 3)], precioServicio: [pr(3, 5, 15000, 60)] },
  { id: 4, nombre: 'Tenis 2 Personas', maxPartidos: 4, servicio: [sv(7, 'Cancha Tenis 2 Personas', 4)], precioServicio: [pr(4, 7, 8000, 60)] },
  { id: 5, nombre: 'Tenis 4 Personas', maxPartidos: 4, servicio: [sv(8, 'Cancha Tenis 4 Personas', 5)], precioServicio: [pr(5, 8, 12000, 60)] },
  { id: 6, nombre: 'Quincho', servicio: [sv(9, 'Quinchos Zona Canchas', 6), sv(10, 'Quinchos Zona Piscinas', 6)], precioServicio: [pr(6, 9, 20000, null)] },
  { id: 7, nombre: 'Piscina General', servicio: [sv(11, 'Piscina General', 7)], precioServicio: [pr(7, 11, 5000, null)] },
  { id: 8, nombre: 'Piscina Adulto Mayor', servicio: [sv(12, 'Piscina Adulto Mayor', 8)], precioServicio: [pr(8, 12, 3000, null)] },
]
const SERVICIOS = CATALOGO.flatMap((t) => t.servicio)
const POOL_SERVICES = [11, 12]

/* ---------- almacenamiento ---------- */

const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}
const write = (key: string, v: unknown) => localStorage.setItem(KEY_PREFIX + key.replace(KEY_PREFIX, ''), JSON.stringify(v))
const KEY_PREFIX = 'df-mock-'
const get = <T,>(key: string, fallback: T) => read<T>(KEY_PREFIX + key, fallback)

interface MockConfig {
  hA: number
  mA: number
  hC: number
  mC: number
  reservasEnabled: boolean
  enabled: Record<number, boolean>
  precios: Record<number, number>
}

const defaultConfig = (): MockConfig => ({
  hA: 9,
  mA: 0,
  hC: 19,
  mC: 0,
  reservasEnabled: true,
  enabled: Object.fromEntries(SERVICIOS.map((s) => [s.id, true])),
  precios: Object.fromEntries(CATALOGO.map((t) => [t.id, t.precioServicio[0].precio])),
})
const cfg = () => ({ ...defaultConfig(), ...get<Partial<MockConfig>>('config', {}) })

const ESTADOS: Record<number, string> = { 1: 'Pago Pendiente', 2: 'Confirmada', 3: 'Anulada' }

const persona = (id: number, nombre: string, apellidoPaterno: string, rut: string): Persona => ({
  id, rut, nombre, segundoNombre: '', apellidoPaterno, apellidoMaterno: 'Mock', email: `${nombre.toLowerCase()}@example.com`, telefono: 56900000000 + id,
})
const PERSONAS_SEED = [persona(1, 'Ana', 'Soto', '12345678-5'), persona(2, 'Luis', 'Pérez', '11111111-1'), persona(3, 'Marta', 'Rojas', '7654321-6'), persona(4, 'Diego', 'Muñoz', '9876543-3')]

const mkReserva = (id: number, p: Persona, fecha: Date, estado: number, lineas: { idServicio: number; cantidad: number; hora?: string }[]): Reserva => ({
  id,
  idEstadoReserva: estado,
  idPersona: p.id,
  fechaReserva: `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T00:00:00`,
  fechaIngreso: new Date(fecha.getTime() - 3 * 86400000).toISOString(),
  fechaConfirmacion: estado === 2 ? new Date(fecha.getTime() - 3 * 86400000).toISOString() : null,
  estadoReserva: { id: estado, nombre: ESTADOS[estado] },
  persona: p,
  ordenCompra: [],
  idOrdenCompra: 0,
  reservaServicio: lineas.map((l, i) => {
    const tipo = CATALOGO.find((t) => t.servicio.some((s) => s.id === l.idServicio))!
    return { id: i + 1, idReserva: id, idServicio: l.idServicio, idPrecioServicio: tipo.precioServicio[0].id, cantidad: l.cantidad, horaComienzo: l.hora ?? null, precioServicio: tipo.precioServicio[0], servicio: SERVICIOS.find((s) => s.id === l.idServicio)! }
  }),
})

/** Datos de ejemplo para el mes en curso, creados una sola vez. */
function seed() {
  if (get('seeded', false)) return
  const now = new Date()
  const day = (d: number) => new Date(now.getFullYear(), now.getMonth(), Math.min(d, 28))
  const [ana, luis, marta, diego] = PERSONAS_SEED
  const rs = [
    mkReserva(901, ana, day(now.getDate() + 3), 2, [{ idServicio: 5, cantidad: 1, hora: `${day(1).toISOString().slice(0, 10)}T10:00:00` }, { idServicio: 11, cantidad: 4 }]),
    mkReserva(902, luis, day(now.getDate() + 5), 2, [{ idServicio: 9, cantidad: 1 }]),
    mkReserva(903, marta, day(now.getDate() + 1), 1, [{ idServicio: 11, cantidad: 2 }, { idServicio: 12, cantidad: 1 }]),
    mkReserva(904, diego, day(now.getDate() + 2), 3, [{ idServicio: 7, cantidad: 2, hora: `${day(1).toISOString().slice(0, 10)}T16:00:00` }]),
    mkReserva(905, ana, new Date(now.getFullYear(), now.getMonth(), 1), 2, [{ idServicio: 1, cantidad: 2, hora: `${day(1).toISOString().slice(0, 10)}T11:00:00` }]),
  ]
  write('reservas', rs)
  const esp: ReservaEspecial[] = [{
    id: 1, idServicio: null, idTipoServicio: null, isCanchas: true, isCamping: false, isEnabled: true,
    fechaComienzo: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(Math.min(now.getDate() + 6, 28))}T09:00:00`,
    fechaTermino: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(Math.min(now.getDate() + 6, 28))}T19:00:00`,
    servicio: null, tipoServicio: null,
  }]
  write('especiales', esp)
  write('seeded', true)
}

const loadReservas = (): Reserva[] => {
  seed()
  return get<Reserva[]>('reservas', [])
}
const saveReservas = (rs: Reserva[]) => write('reservas', rs)
const upsert = (r: Reserva) => saveReservas([...loadReservas().filter((x) => x.id !== r.id), r])

function needAuth() {
  if (sessionStorage.getItem(SESSION_KEY) !== 'mock-token') {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    throw new ApiError(401, 'No autorizado')
  }
}

/** Tipos con precios y servicios según la configuración vigente (lo que ve el público). */
function catalogoVigente(): TipoServicio[] {
  const c = cfg()
  return CATALOGO.map((t) => ({
    ...t,
    servicio: t.servicio.filter((s) => c.enabled[s.id] !== false),
    precioServicio: t.precioServicio.map((p) => ({ ...p, precio: c.precios[t.id] ?? p.precio })),
  }))
}

export const mockApi: Api = {
  getParametros: () => {
    const c = cfg()
    return delay({ horaApertura: `1900-01-01T${pad(c.hA)}:${pad(c.mA)}:00`, horaCierre: `1900-01-01T${pad(c.hC)}:${pad(c.mC)}:00`, reservasEnabled: c.reservasEnabled }, 100)
  },

  getCatalogo: (fechaApi) => {
    const [d, m, y] = fechaApi.split('-').map(Number)
    const dow = new Date(y, m - 1, d).getDay() // 1..4 = lunes a jueves
    const sinFutbol = dow >= 1 && dow <= 4
    return delay(catalogoVigente().filter((t) => !(sinFutbol && t.id <= 3) && t.servicio.length > 0))
  },

  getCalendario: (idServicio, partidos, fechaApi) => {
    const [d, m, y] = fechaApi.split('-').map(Number)
    const c = cfg()
    const tipo = CATALOGO.find((t) => t.servicio.some((s) => s.id === idServicio))
    const minutos = (tipo?.precioServicio[0].minutos ?? 60) * partidos
    const slots: Slot[] = []
    let i = 0
    for (let start = c.hA * 60 + c.mA; start + minutos <= c.hC * 60 + c.mC; start += minutos, i++) {
      const fmt = (min: number) => `${y}-${pad(m)}-${pad(d)}T${pad(Math.floor(min / 60))}:${pad(min % 60)}:00`
      slots.push({ horaComienzo: fmt(start), horaFinal: fmt(start + minutos), reservado: (idServicio * 7 + d + i * 3) % 4 === 0 })
    }
    return delay(slots)
  },

  nuevaReserva: (r: ReservaCreacion) => {
    const id = Math.max(1000, ...loadReservas().map((x) => x.id)) + 1
    const p = { id: 1, ...(r.personaCreacion as NonNullable<ReservaCreacion['personaCreacion']>) }
    const reserva: Reserva = {
      id,
      idEstadoReserva: 1,
      idPersona: 1,
      fechaReserva: r.fechaReserva,
      fechaIngreso: new Date().toISOString(),
      fechaConfirmacion: null,
      estadoReserva: { id: 1, nombre: ESTADOS[1] },
      persona: p,
      ordenCompra: [],
      idOrdenCompra: 0,
      reservaServicio: r.reservaServicio.map((l, i) => {
        const tipo = CATALOGO.find((t) => t.id === l.idTipoServicio)!
        return {
          id: i + 1,
          idReserva: id,
          idServicio: l.idServicio,
          idPrecioServicio: l.idPrecioServicio,
          cantidad: l.cantidad,
          horaComienzo: l.horaComienzo,
          precioServicio: { ...tipo.precioServicio[0], precio: l.precio },
          servicio: tipo.servicio.find((s) => s.id === l.idServicio) ?? tipo.servicio[0],
        }
      }),
    }
    upsert(reserva)
    return delay(reserva)
  },

  usarEnlace: (r) => {
    const reserva = structuredClone(r)
    if (reserva.ordenCompra.length >= 3) {
      reserva.idEstadoReserva = 3
      reserva.estadoReserva = { id: 3, nombre: ESTADOS[3] }
    } else {
      const orden = { id: reserva.ordenCompra.length + 1, token: `mock-${Date.now()}`, url: `${location.origin}/mi-reserva/`, idReserva: reserva.id, isUsed: false, fecha: new Date().toISOString() }
      reserva.ordenCompra = [orden, ...reserva.ordenCompra]
      reserva.idOrdenCompra = orden.id
    }
    upsert(reserva)
    return delay(reserva)
  },

  confirmarReserva: (r, token) => {
    if (token.endsWith('fail')) {
      return delay(null).then(() => {
        throw new ApiError(400, 'El pago ha fallado o ha sido rechazado, favor intente nuevamente. (Payment Rejected or Failed)')
      })
    }
    const reserva = { ...r, idEstadoReserva: 2, estadoReserva: { id: 2, nombre: ESTADOS[2] }, fechaConfirmacion: new Date().toISOString() }
    upsert(reserva)
    return delay(reserva)
  },

  getReserva: (id) => {
    const r = loadReservas().find((x) => x.id === id)
    return r ? delay(r) : delay(null).then(() => { throw new ApiError(404, `No se encontró la reserva :${id}`) })
  },

  getPersonaId: () => delay(null, 50),

  getQr: () => delay(null, 50),

  /* ---------- administración ---------- */

  adminLogin: (usuario, password) =>
    delay(null).then(() => {
      if (usuario === 'admin' && password === 'admin') return 'mock-token'
      throw new ApiError(404, 'Credenciales incorrectas o el usuario no existe')
    }),

  sessionIsValid: () => {
    needAuth()
    return delay(true, 100)
  },

  getConfig: () => {
    needAuth()
    const c = cfg()
    const servicios = SERVICIOS.map((s) => ({ ...s, isEnabled: c.enabled[s.id] !== false, precio: c.precios[s.idTipoServicio], cambiaPrecio: false }))
    const out: Config = {
      hApertura: c.hA, mApertura: c.mA, hCierre: c.hC, mCierre: c.mC,
      reservasEnabled: c.reservasEnabled,
      piscinasEnabled: POOL_SERVICES.some((id) => c.enabled[id] !== false),
      servicios,
    }
    return delay(out, 150)
  },

  guardarConfig: (n) => {
    needAuth()
    const c = cfg()
    c.hA = n.hApertura; c.mA = n.mApertura; c.hC = n.hCierre; c.mC = n.mCierre
    c.reservasEnabled = n.reservasEnabled
    for (const s of n.servicios) {
      c.enabled[s.id] = s.isEnabled
      if (s.cambiaPrecio) c.precios[s.idTipoServicio] = s.precio
    }
    for (const id of POOL_SERVICES) c.enabled[id] = n.piscinasEnabled
    write('config', c)
    return delay(undefined, 200)
  },

  getReservas: (anio, mes, pagina, porPagina) => {
    needAuth()
    const all = loadReservas()
      .filter((r) => {
        const d = new Date(r.fechaReserva.slice(0, 10) + 'T00:00:00')
        return d.getFullYear() === anio && d.getMonth() + 1 === mes
      })
      .sort((a, b) => b.fechaIngreso.localeCompare(a.fechaIngreso))
    return delay(all.slice((pagina - 1) * porPagina, pagina * porPagina), 150)
  },

  getReservasEspeciales: (anio, mes) => {
    needAuth()
    const es = get<ReservaEspecial[]>('especiales', []).filter((e) => e.isEnabled && (e.fechaComienzo.startsWith(`${anio}-${pad(mes)}`) || e.fechaTermino.startsWith(`${anio}-${pad(mes)}`)))
    loadReservas()
    return delay(es, 150)
  },

  cancelarReserva: (id) => {
    needAuth()
    const r = loadReservas().find((x) => x.id === id)
    if (!r) return delay(null).then(() => { throw new ApiError(400, 'Reserva inválida.') })
    if (new Date(r.fechaReserva.slice(0, 10) + 'T00:00:00') < new Date(new Date().toDateString())) {
      return delay(null).then(() => { throw new ApiError(400, 'La fecha de la reserva ya ha pasado.') })
    }
    upsert({ ...r, idEstadoReserva: 3, estadoReserva: { id: 3, nombre: ESTADOS[3] } })
    return delay(undefined, 200)
  },

  cancelarReservaEspecial: (id) => {
    needAuth()
    write('especiales', get<ReservaEspecial[]>('especiales', []).map((e) => (e.id === id ? { ...e, isEnabled: false } : e)))
    return delay(undefined, 150)
  },

  ingresarReservaEspecial: (r) => {
    needAuth()
    const list = get<ReservaEspecial[]>('especiales', [])
    const global = r.isCamping || r.isCanchas
    const tipo = global ? null : (CATALOGO.find((t) => t.id === r.idTipoServicio) ?? null)
    list.push({
      id: Math.max(0, ...list.map((e) => e.id)) + 1,
      idServicio: global ? null : r.idServicio,
      idTipoServicio: global ? null : r.idTipoServicio,
      fechaComienzo: r.fechaComienzo, fechaTermino: r.fechaTermino,
      isCanchas: r.isCanchas, isCamping: r.isCamping, isEnabled: true,
      servicio: global ? null : (SERVICIOS.find((s) => s.id === r.idServicio) ?? null),
      tipoServicio: tipo,
    })
    write('especiales', list)
    return delay(undefined, 200)
  },

  getPersonas: () => {
    needAuth()
    const byId = new Map<number, Persona>(PERSONAS_SEED.map((p) => [p.id, p]))
    for (const r of loadReservas()) if (r.persona) byId.set(r.persona.id + (byId.has(r.persona.id) && byId.get(r.persona.id)!.rut !== r.persona.rut ? 1000 : 0), r.persona)
    return delay([...byId.values()], 150)
  },

  getAllTipoServicios: () => {
    needAuth()
    return delay(CATALOGO, 100)
  },
}
