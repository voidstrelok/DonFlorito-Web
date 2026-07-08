import { renderHook, waitFor } from '@testing-library/react';
import { useCatalogoQuery } from '@/lib/hooks/useServicios';
import { useParametrosQuery } from '@/lib/hooks/useSession';
import { createQueryWrapper } from '@/test-utils/query-wrapper';

const fetchMock = jest.fn();

describe('data hooks', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost/api/';
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(() => null),
      },
      configurable: true,
    });
  });

  it('loads parametros from the session endpoint', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ horaApertura: '2026-07-01T09:00:00', horaCierre: '2026-07-01T19:00:00', reservasEnabled: true }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    const { result } = renderHook(() => useParametrosQuery(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock).toHaveBeenCalledWith('http://localhost/api/session/GetParametros', expect.objectContaining({ method: 'GET' }));
  });

  it('loads catalogo with form-data payload', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 1, nombre: 'Fútbol 1', servicio: [], precioServicio: [], maxPartidos: 6 }],
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    const { result } = renderHook(() => useCatalogoQuery('08-07-2026', true), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [, request] = fetchMock.mock.calls[0];
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost/api/servicios/getCatalogo');
    expect(request.method).toBe('POST');
    expect(request.body).toBeInstanceOf(FormData);
    expect((request.body as FormData).get('FechaReserva')).toBe('08-07-2026');
  });
});
