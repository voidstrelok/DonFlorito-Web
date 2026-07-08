import { apiRequest } from '@/lib/api/client';
import type {
  ReservaCreacionDTO,
  ReservaDTO,
  ReservaEspecialCreacionDTO,
  ReservaEspecialDTO,
} from '@/lib/types/models';

export const reservasApi = {
  nuevaReserva: (reserva: ReservaCreacionDTO) =>
    apiRequest<ReservaDTO>('reservas', {
      method: 'POST',
      body: reserva,
    }),
  confirmarReserva: (tokenWs: string, reserva: ReservaDTO) =>
    apiRequest<ReservaDTO>(`reservas/ConfirmarReserva/${tokenWs}`, {
      method: 'POST',
      body: reserva,
    }),
  getById: (idReserva: number) => apiRequest<ReservaDTO>(`reservas/getById/${idReserva}`),
  getLinkQR: (idReserva: number) =>
    apiRequest<Blob>(`reservas/getLinkQR/${idReserva}`, {
      headers: { Accept: 'image/png,*/*' },
      responseType: 'blob',
    }),
  getReservas: (anio: number, mes: number, pagina = 1, porPagina = 10) =>
    apiRequest<ReservaDTO[]>(`reservas/getReservas?anio=${anio}&mes=${mes}&pagina=${pagina}&porPagina=${porPagina}`),
  getReservasEspeciales: (anio: number, mes: number) =>
    apiRequest<ReservaEspecialDTO[]>(`reservas/getReservasEspeciales?anio=${anio}&mes=${mes}`),
  cancelarReserva: (idReserva: number) =>
    apiRequest<ReservaDTO[]>(`reservas/CancelarReserva?IdReserva=${idReserva}`, {
      method: 'PATCH',
    }),
  ingresarReservaEspecial: (reserva: ReservaEspecialCreacionDTO) =>
    apiRequest<ReservaEspecialDTO>('reservas/IngresarReservaEspecial', {
      method: 'POST',
      body: reserva,
    }),
  cancelarReservaEspecial: (idReserva: number) =>
    apiRequest<ReservaDTO[]>(`reservas/CancelarReservaEspecial?IdReserva=${idReserva}`, {
      method: 'PATCH',
    }),
};
