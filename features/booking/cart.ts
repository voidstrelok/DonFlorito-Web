import type { PersonaCreacion, ReservaCreacion, ReservaServicioCreacion } from '@/api'
import { apiRut, phoneDigits } from './validation'
import { toReservaFecha } from './dates'

/** Ids de TipoServicio en la base de datos. */
export const TIPO = {
  Futbol1: 1,
  Futbol2: 2,
  Futbolito: 3,
  Tenis2: 4,
  Tenis4: 5,
  Quincho: 6,
  PiscinaGeneral: 7,
  PiscinaAM: 8,
} as const

export type Kind = 'cancha' | 'piscina' | 'quincho'

export const kindOf = (idTipo: number): Kind => (idTipo === TIPO.Quincho ? 'quincho' : idTipo >= TIPO.PiscinaGeneral ? 'piscina' : 'cancha')

/** Una línea del carro. Hay como máximo una por tipo de servicio (igual que el sitio anterior). */
export interface CartLine {
  idTipoServicio: number
  idServicio: number
  idPrecioServicio: number
  cantidad: number
  /** Solo canchas */
  horaComienzo: string | null
  horaFinal: string | null
  /** Nombre del servicio concreto (p. ej. "Cancha Fútbol 2") */
  nombre: string
  tipoNombre: string
  precio: number
  minutos: number
}

export const lineTotal = (l: CartLine) => l.precio * l.cantidad
export const cartTotal = (lines: CartLine[]) => lines.reduce((s, l) => s + lineTotal(l), 0)
export const cartCount = (lines: CartLine[]) => lines.length

/** Agrega la línea, reemplazando la existente del mismo tipo. */
export function upsertLine(lines: CartLine[], line: CartLine): CartLine[] {
  return [...lines.filter((l) => l.idTipoServicio !== line.idTipoServicio), line].sort((a, b) => a.idTipoServicio - b.idTipoServicio)
}

export interface PersonaForm {
  rut: string
  nombre: string
  apellidoPaterno: string
  email: string
  telefono: string
}

export const emptyPersona: PersonaForm = { rut: '', nombre: '', apellidoPaterno: '', email: '', telefono: '' }

export function toPersonaCreacion(p: PersonaForm): PersonaCreacion {
  return {
    rut: apiRut(p.rut),
    nombre: p.nombre.trim(),
    // Ya no se piden. La API los guarda como obligatorios (NOT NULL) pero acepta texto vacío.
    segundoNombre: '',
    apellidoPaterno: p.apellidoPaterno.trim(),
    apellidoMaterno: '',
    email: p.email.trim(),
    telefono: Number(phoneDigits(p.telefono)),
  }
}

export function toReservaServicio(l: CartLine): ReservaServicioCreacion {
  return {
    idServicio: l.idServicio,
    idTipoServicio: l.idTipoServicio,
    idPrecioServicio: l.idPrecioServicio,
    cantidad: l.cantidad,
    horaComienzo: l.horaComienzo,
    nombre: l.nombre,
    precio: l.precio,
    minutos: l.minutos,
  }
}

export function buildReserva(fechaIso: string, lines: CartLine[], persona: PersonaForm): ReservaCreacion {
  return {
    idPersona: null,
    personaCreacion: toPersonaCreacion(persona),
    reservaServicio: lines.map(toReservaServicio),
    fechaReserva: toReservaFecha(fechaIso),
    ordenCompra: null,
  }
}
