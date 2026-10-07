import type { Config, Persona, Reserva, ReservaEspecial, ReservaEspecialCreacion, TipoServicio } from '@/api'
import { ESTADO } from '@/api'

export const POOL_TIPOS = [7, 8]
export const PISCINAS_TIPO_ID = 7 // la API usa el tipo "Piscina General" para bloquear todas las piscinas

export const reservaTotal = (r: Reserva) => r.reservaServicio.reduce((s, l) => s + (l.precioServicio?.precio ?? 0) * l.cantidad, 0)

/** Día (sin hora) de una reserva, en hora local. */
export const reservaDay = (r: Reserva) => new Date(`${r.fechaReserva.slice(0, 10)}T00:00:00`)

export const isFutureOrToday = (r: Reserva, now = new Date()) => reservaDay(r) >= new Date(now.getFullYear(), now.getMonth(), now.getDate())

/** Solo las confirmadas y todavía vigentes se pueden anular (la API rechaza las pasadas). */
export const canCancel = (r: Reserva, now = new Date()) => r.idEstadoReserva === ESTADO.Confirmada && isFutureOrToday(r, now)

const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export function matchesReserva(r: Reserva, query: string): boolean {
  const q = norm(query.trim())
  if (!q) return true
  const code = `df${r.id}`
  const p = r.persona
  return [code, String(r.id), p?.nombre, p?.apellidoPaterno, p?.apellidoMaterno, p?.email, p?.rut].some((v) => v && norm(String(v)).includes(q))
}

export function matchesPersona(p: Persona, query: string): boolean {
  const q = norm(query.trim())
  if (!q) return true
  return [p.nombre, p.segundoNombre, p.apellidoPaterno, p.apellidoMaterno, p.email, p.rut, String(p.telefono)].some((v) => v && norm(v).includes(q))
}

/** Años seleccionables: desde 2024 (inicio del sistema) hasta el próximo. */
export function yearOptions(now = new Date()): number[] {
  const out: number[] = []
  for (let y = 2024; y <= now.getFullYear() + 1; y++) out.push(y)
  return out
}

/** Pagina las reservas de un mes hasta agotarlas (la API devuelve 50 por página por defecto). */
export async function fetchAllReservas(
  load: (pagina: number, porPagina: number) => Promise<Reserva[]>,
  porPagina = 200,
  maxPaginas = 25,
): Promise<Reserva[]> {
  const all: Reserva[] = []
  const seen = new Set<number>()
  for (let pagina = 1; pagina <= maxPaginas; pagina++) {
    const page = await load(pagina, porPagina)
    const fresh = page.filter((r) => !seen.has(r.id))
    // Una API sin paginación devuelve siempre lo mismo: si no hay nada nuevo, se termina.
    if (fresh.length === 0) break
    fresh.forEach((r) => seen.add(r.id))
    all.push(...fresh)
    if (page.length < porPagina) break
  }
  return all
}

/* ---------- Reservas especiales ---------- */

export type EspecialScope = 'servicio' | 'canchas' | 'camping' | 'todo'

export interface EspecialForm {
  scope: EspecialScope
  idTipoServicio: number | null
  idServicio: number | null
  startDate: string // yyyy-MM-dd
  startTime: string // HH:mm
  endDate: string
  endTime: string
}

/** Hora local del complejo, sin zona: así la guarda la API (el sitio anterior la corría con un "-4" fijo). */
export const wallClock = (day: string, time: string) => `${day}T${time}:00`

/** Los tipos de cancha exigen elegir cancha; quinchos y piscinas pueden bloquearse completos. */
export const needsServicio = (idTipo: number | null) => idTipo !== null && idTipo <= 5

export function validateEspecial(f: EspecialForm): string | null {
  if (f.scope === 'servicio') {
    if (f.idTipoServicio === null) return 'Selecciona el tipo de servicio.'
    if (needsServicio(f.idTipoServicio) && f.idServicio === null) return 'Selecciona la cancha.'
  }
  if (!f.startDate || !f.startTime || !f.endDate || !f.endTime) return 'Completa las fechas y horas de inicio y término.'
  if (wallClock(f.endDate, f.endTime) <= wallClock(f.startDate, f.startTime)) return 'El término debe ser posterior al inicio.'
  return null
}

export function toEspecialCreacion(f: EspecialForm): ReservaEspecialCreacion {
  const isCanchas = f.scope === 'canchas' || f.scope === 'todo'
  const isCamping = f.scope === 'camping' || f.scope === 'todo'
  const global = isCanchas || isCamping
  return {
    idTipoServicio: global ? null : f.idTipoServicio,
    idServicio: global ? null : f.idServicio,
    isCanchas,
    isCamping,
    fechaComienzo: wallClock(f.startDate, f.startTime),
    fechaTermino: wallClock(f.endDate, f.endTime),
  }
}

export function especialScopeLabel(e: ReservaEspecial): string {
  if (e.isCanchas && e.isCamping) return 'Todo el recinto'
  if (e.isCanchas) return 'Todas las canchas'
  if (e.isCamping) return 'Todo el camping'
  if (e.tipoServicio) return e.servicio ? `${e.tipoServicio.nombre}: ${e.servicio.nombre}` : e.tipoServicio.nombre
  return 'Servicio'
}

/** Tipos disponibles para bloquear: los de cancha y quincho, y "Piscinas" como un solo tipo. */
export function especialTipos(tipos: TipoServicio[]): TipoServicio[] {
  const base = tipos.filter((t) => t.id < PISCINAS_TIPO_ID)
  return [...base, { id: PISCINAS_TIPO_ID, nombre: 'Piscinas', servicio: [], precioServicio: [] }]
}

/* ---------- Configuración y precios ---------- */

export interface ServiceEdits {
  /** Habilitado por servicio (id). Las piscinas se controlan con `piscinas`. */
  enabled?: Record<number, boolean>
  /** Precio por tipo de servicio (la API lo guarda por tipo, no por cancha). */
  precios?: Record<number, number>
  piscinas?: boolean
}

/**
 * Aplica los cambios sobre la configuración. Para cambiar un precio la API crea una fila nueva por cada
 * servicio marcado `cambiaPrecio`; se marca solo uno por tipo para no duplicar precios vigentes.
 */
export function applyServiceEdits(cfg: Config, edits: ServiceEdits): Config {
  const flagged = new Set<number>()
  const servicios = cfg.servicios.map((s) => {
    const next = { ...s }
    if (edits.enabled && s.id in edits.enabled && !POOL_TIPOS.includes(s.idTipoServicio)) next.isEnabled = edits.enabled[s.id]
    const precio = edits.precios?.[s.idTipoServicio]
    if (precio !== undefined) {
      next.precio = precio
      if (precio !== s.precio && !flagged.has(s.idTipoServicio)) {
        next.cambiaPrecio = true
        flagged.add(s.idTipoServicio)
      }
    }
    return next
  })
  return { ...cfg, servicios, piscinasEnabled: edits.piscinas ?? cfg.piscinasEnabled }
}

export const pad2 = (n: number) => String(n).padStart(2, '0')
export const toTime = (h: number, m: number) => `${pad2(h)}:${pad2(m)}`
export const fromTime = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return { h: h || 0, m: m || 0 }
}

export function validateHours(apertura: string, cierre: string): string | null {
  if (!apertura || !cierre) return 'Indica la hora de apertura y de cierre.'
  return cierre > apertura ? null : 'El cierre debe ser posterior a la apertura.'
}

/** Guarda tomando primero la configuración vigente, para no pisar cambios hechos en otra pestaña. */
export async function updateConfig(
  io: { getConfig: () => Promise<Config>; guardarConfig: (c: Config) => Promise<void> },
  patch: (fresh: Config) => Config,
): Promise<Config> {
  const fresh = await io.getConfig()
  await io.guardarConfig(patch(structuredClone(fresh)))
  return io.getConfig()
}
