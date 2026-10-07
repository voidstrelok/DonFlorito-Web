import { describe, expect, it } from 'vitest'
import type { Config, Reserva } from '@/api'
import { applyServiceEdits, canCancel, fetchAllReservas, matchesReserva, reservaTotal, toEspecialCreacion, updateConfig, validateEspecial, validateHours, wallClock, type EspecialForm } from './logic'

const reserva = (over: Partial<Reserva> = {}): Reserva =>
  ({
    id: 24, idEstadoReserva: 2, fechaReserva: '2026-10-10T00:00:00',
    persona: { id: 1, nombre: 'Ana', apellidoPaterno: 'Núñez', apellidoMaterno: 'Soto', email: 'ana@x.cl', rut: '12345678-5', segundoNombre: '', telefono: 1 },
    reservaServicio: [
      { cantidad: 2, precioServicio: { precio: 15000 } },
      { cantidad: 3, precioServicio: { precio: 5000 } },
    ],
    ...over,
  }) as unknown as Reserva

describe('reservas', () => {
  it('calcula el total', () => expect(reservaTotal(reserva())).toBe(45000))

  it('busca por código, nombre sin tildes y RUT', () => {
    expect(matchesReserva(reserva(), 'DF24')).toBe(true)
    expect(matchesReserva(reserva(), 'nunez')).toBe(true)
    expect(matchesReserva(reserva(), '12345678')).toBe(true)
    expect(matchesReserva(reserva(), 'zzz')).toBe(false)
  })

  it('solo anula confirmadas y no pasadas', () => {
    const hoy = new Date(2026, 9, 10, 15, 0)
    expect(canCancel(reserva(), hoy)).toBe(true) // hoy cuenta
    expect(canCancel(reserva({ fechaReserva: '2026-10-09T00:00:00' }), hoy)).toBe(false)
    expect(canCancel(reserva({ idEstadoReserva: 3 }), hoy)).toBe(false)
  })

  it('pagina hasta agotar y corta si la API ignora la paginación', async () => {
    const mk = (ids: number[]) => ids.map((id) => reserva({ id }))
    const pages = [mk([1, 2]), mk([3, 4]), mk([5])]
    const calls: number[] = []
    const all = await fetchAllReservas(async (p) => (calls.push(p), pages[p - 1] ?? []), 2)
    expect(all.map((r) => r.id)).toEqual([1, 2, 3, 4, 5])
    expect(calls).toEqual([1, 2, 3])

    // API sin paginación: repite siempre la misma página
    let n = 0
    const same = await fetchAllReservas(async () => (n++, mk([1, 2])), 2)
    expect(same.map((r) => r.id)).toEqual([1, 2])
    expect(n).toBe(2)
  })
})

describe('reservas especiales', () => {
  const base: EspecialForm = { scope: 'servicio', idTipoServicio: 3, idServicio: 5, startDate: '2026-10-10', startTime: '09:00', endDate: '2026-10-10', endTime: '12:00' }

  it('valida', () => {
    expect(validateEspecial(base)).toBeNull()
    expect(validateEspecial({ ...base, idServicio: null })).toBe('Selecciona la cancha.')
    expect(validateEspecial({ ...base, idTipoServicio: 6, idServicio: null })).toBeNull() // quincho completo
    expect(validateEspecial({ ...base, endTime: '09:00' })).toMatch(/posterior/)
    expect(validateEspecial({ ...base, endDate: '2026-10-09' })).toMatch(/posterior/)
  })

  it('arma el payload con hora local sin zona', () => {
    expect(wallClock('2026-10-10', '09:00')).toBe('2026-10-10T09:00:00')
    expect(toEspecialCreacion(base)).toEqual({ idTipoServicio: 3, idServicio: 5, isCanchas: false, isCamping: false, fechaComienzo: '2026-10-10T09:00:00', fechaTermino: '2026-10-10T12:00:00' })
  })

  it('"todo el recinto" marca canchas y camping y borra el servicio', () => {
    const p = toEspecialCreacion({ ...base, scope: 'todo' })
    expect(p).toMatchObject({ isCanchas: true, isCamping: true, idServicio: null, idTipoServicio: null })
  })
})

describe('configuración', () => {
  const cfg: Config = {
    hApertura: 9, mApertura: 0, hCierre: 19, mCierre: 0, piscinasEnabled: true, reservasEnabled: true,
    servicios: [
      { id: 3, nombre: 'C3', idTipoServicio: 2, isEnabled: true, precio: 95000, cambiaPrecio: false },
      { id: 4, nombre: 'C4', idTipoServicio: 2, isEnabled: true, precio: 95000, cambiaPrecio: false },
      { id: 11, nombre: 'P', idTipoServicio: 7, isEnabled: true, precio: 8000, cambiaPrecio: false },
    ],
  }

  it('marca un solo servicio por tipo al cambiar el precio', () => {
    const out = applyServiceEdits(cfg, { precios: { 2: 99000 } })
    expect(out.servicios.map((s) => [s.precio, s.cambiaPrecio])).toEqual([[99000, true], [99000, false], [8000, false]])
  })

  it('no marca cambio si el precio es igual', () => {
    expect(applyServiceEdits(cfg, { precios: { 2: 95000 } }).servicios.some((s) => s.cambiaPrecio)).toBe(false)
  })

  it('habilita canchas pero las piscinas solo con el interruptor general', () => {
    const out = applyServiceEdits(cfg, { enabled: { 3: false, 11: false }, piscinas: false })
    expect(out.servicios.map((s) => s.isEnabled)).toEqual([false, true, true])
    expect(out.piscinasEnabled).toBe(false)
  })

  it('valida el horario', () => {
    expect(validateHours('09:00', '19:00')).toBeNull()
    expect(validateHours('19:00', '09:00')).toMatch(/posterior/)
    expect(validateHours('', '09:00')).toMatch(/Indica/)
  })

  it('guarda sobre la configuración vigente, no sobre la copia local', async () => {
    let remote = { ...cfg, reservasEnabled: false } // otro administrador la deshabilitó
    const io = { getConfig: async () => structuredClone(remote), guardarConfig: async (c: Config) => { remote = c } }
    const saved = await updateConfig(io, (fresh) => applyServiceEdits(fresh, { precios: { 2: 100000 } }))
    expect(saved.reservasEnabled).toBe(false) // se conserva
    expect(saved.servicios[0].precio).toBe(100000)
  })
})
