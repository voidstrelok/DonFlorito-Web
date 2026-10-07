import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, configureApi, realApi, retryDelays } from './client'

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
const bad = (status: number) => new Response('<html>Bad Gateway</html>', { status, headers: { 'content-type': 'text/html' } })

/** Almacenamiento mínimo: las pruebas unitarias corren en Node, sin navegador. */
const memoryStorage = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), clear: () => m.clear() }
}

describe('cliente de la API: reintentos', () => {
  beforeEach(() => {
    configureApi('https://api.test/api')
    retryDelays.value = [1, 1, 1]
    vi.stubGlobal('sessionStorage', memoryStorage())
    vi.stubGlobal('window', { dispatchEvent: () => true })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('una lectura se recupera de un reinicio de la API (502 y corte de red)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(bad(502)).mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(ok({ horaApertura: 'a', horaCierre: 'b', reservasEnabled: true }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(realApi.getParametros()).resolves.toMatchObject({ reservasEnabled: true })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('se rinde tras agotar los reintentos', async () => {
    const fetchMock = vi.fn().mockResolvedValue(bad(502))
    vi.stubGlobal('fetch', fetchMock)
    await expect(realApi.getParametros()).rejects.toMatchObject({ status: 502 })
    expect(fetchMock).toHaveBeenCalledTimes(4) // 1 intento + 3 reintentos
  })

  it('no reintenta errores de negocio ni de autenticación', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('No se encontró la reserva :9', { status: 404 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(realApi.getReserva(9)).rejects.toBeInstanceOf(ApiError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('las escrituras no se reintentan solas (no duplicar reservas ni anulaciones)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(bad(502))
    vi.stubGlobal('fetch', fetchMock)
    await expect(realApi.nuevaReserva({} as never)).rejects.toMatchObject({ status: 502 })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    fetchMock.mockClear()
    await expect(realApi.cancelarReserva(5)).rejects.toMatchObject({ status: 502 })
    expect(fetchMock).toHaveBeenCalledTimes(1) // PATCH falla y no cae a GET por un 502
  })

  it('anular cae a GET solo si el servidor no admite PATCH (405)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response('', { status: 405 })).mockResolvedValueOnce(new Response('', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await realApi.cancelarReserva(5)
    expect(fetchMock.mock.calls.map((c) => (c[1] as RequestInit).method ?? 'GET')).toEqual(['PATCH', 'GET'])
  })

  it('envía el token de sesión como Bearer', async () => {
    sessionStorage.setItem('session', 'abc')
    const fetchMock = vi.fn().mockResolvedValue(ok([]))
    vi.stubGlobal('fetch', fetchMock)
    await realApi.getPersonas()
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer abc' })
  })
})
