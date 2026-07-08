import { apiRequest, createFormData } from '@/lib/api/client';
import type { ReservaDTO } from '@/lib/types/models';

export const transaccionesApi = {
  commit: (tokenWs: string, idReserva: string) =>
    apiRequest<ReservaDTO>('transacciones/commit', {
      method: 'POST',
      body: createFormData({ token_ws: tokenWs, IdReserva: idReserva }),
    }),
  usaEnlace: (reserva: ReservaDTO) =>
    apiRequest<ReservaDTO>('transacciones/usaEnlace', {
      method: 'POST',
      body: reserva,
    }),
};
