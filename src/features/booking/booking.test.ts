import { ApiError } from '@/api/client'
import { createReserva } from './submit'
import { describe, expect, it } from 'vitest'
import { bookableDays, toApiDate, toReservaFecha } from './dates'
import { apiRut, formatRut, isEmail, isPhone, isRutValid } from './validation'
import { buildReserva, cartTotal, emptyPersona, kindOf, upsertLine, type CartLine } from './cart'

const line = (over: Partial<CartLine>): CartLine => ({
  idTipoServicio: 1, idServicio: 1, idPrecioServicio: 1, cantidad: 1, horaComienzo: null, horaFinal: null,
  nombre: 'x', tipoNombre: 'x', precio: 1000, minutos: 60, ...over,
})

describe('fechas', () => {
  it('formatea para la API', () => {
    expect(toApiDate('2026-10-05')).toBe('05-10-2026')
    expect(toReservaFecha('2026-10-05')).toBe('2026-10-05T00:00:00.000Z')
  })
  it('omite lunes y hoy', () => {
    // jueves 1 de octubre de 2026
    const days = bookableDays(new Date(2026, 9, 1), { daysAhead: 7, closedWeekdays: [1], allowSameDay: false })
    expect(days).toEqual(['2026-10-02', '2026-10-03', '2026-10-04', '2026-10-06', '2026-10-07', '2026-10-08'])
  })
  it('puede incluir el mismo día', () => {
    const days = bookableDays(new Date(2026, 9, 1), { daysAhead: 2, closedWeekdays: [], allowSameDay: true })
    expect(days).toEqual(['2026-10-01', '2026-10-02'])
  })
})

describe('RUT', () => {
  it('valida el dígito verificador', () => {
    expect(isRutValid('11.111.111-1')).toBe(true)
    expect(isRutValid('12345678-5')).toBe(true)
    expect(isRutValid('12345678-9')).toBe(false)
    expect(isRutValid('123')).toBe(false)
  })
  it('formatea y normaliza', () => {
    expect(formatRut('123456785')).toBe('12.345.678-5')
    expect(apiRut('12.345.678-5')).toBe('12345678-5')
    expect(apiRut('7.654.321-k')).toBe('7654321-K')
  })
})

describe('contacto', () => {
  it('email y teléfono', () => {
    expect(isEmail('a@b.cl')).toBe(true)
    expect(isEmail('a@b')).toBe(false)
    expect(isPhone('+56 9 9527 8783')).toBe(true)
    expect(isPhone('1234')).toBe(false)
  })
})

describe('carro', () => {
  it('reemplaza por tipo y suma', () => {
    let lines = upsertLine([], line({ idTipoServicio: 3, precio: 15000 }))
    lines = upsertLine(lines, line({ idTipoServicio: 7, precio: 5000, cantidad: 3 }))
    lines = upsertLine(lines, line({ idTipoServicio: 3, precio: 15000, cantidad: 2 }))
    expect(lines).toHaveLength(2)
    expect(cartTotal(lines)).toBe(15000 * 2 + 5000 * 3)
  })
  it('clasifica servicios', () => {
    expect([kindOf(1), kindOf(5), kindOf(6), kindOf(7), kindOf(8)]).toEqual(['cancha', 'cancha', 'quincho', 'piscina', 'piscina'])
  })
  it('arma el payload de la API', () => {
    const r = buildReserva('2026-10-05', [line({})], { ...emptyPersona, rut: '12.345.678-5', nombre: ' Ana ', apellidoPaterno: 'Soto', email: 'a@b.cl', telefono: '+56 9 1234 5678' })
    expect(r.personaCreacion).toMatchObject({ rut: '12345678-5', nombre: 'Ana', segundoNombre: '', apellidoMaterno: '', telefono: 56912345678 })
    expect(r.fechaReserva).toBe('2026-10-05T00:00:00.000Z')
    expect(r.idPersona).toBeNull()
  })
})

describe('crear reserva con persona existente', () => {
  const body = buildReserva('2026-10-05', [line({})], { ...emptyPersona, rut: '12.345.678-5', nombre: 'Ana', apellidoPaterno: 'Soto', email: 'a@b.cl', telefono: '912345678' })
  const ok = { id: 7 } as never

  it('reintenta con idPersona cuando la API dice que la persona ya existe', async () => {
    const calls: unknown[] = []
    const api = {
      nuevaReserva: async (r: typeof body) => {
        calls.push(r)
        if (r.personaCreacion) throw new ApiError(400, 'Ya existe la persona que se intenta ingresar.')
        return ok
      },
      getPersonaId: async (rut: string) => (rut === '12345678-5' ? 42 : null),
    }
    expect(await createReserva(api, body)).toBe(ok)
    expect(calls).toHaveLength(2)
    expect(calls[1]).toMatchObject({ idPersona: 42, personaCreacion: null })
  })

  it('no reintenta con otros errores', async () => {
    const api = { nuevaReserva: async () => { throw new ApiError(400, 'El horario dejó de estar disponible') }, getPersonaId: async () => 1 }
    await expect(createReserva(api, body)).rejects.toThrow('horario')
  })
})
