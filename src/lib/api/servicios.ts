import { apiRequest, createFormData } from '@/lib/api/client';
import type { ContenedorEventosDTO, TipoServicioDTO } from '@/lib/types/models';

export const serviciosApi = {
  getCatalogo: (fechaReserva: string) =>
    apiRequest<TipoServicioDTO[]>('servicios/getCatalogo', {
      method: 'POST',
      body: createFormData({ FechaReserva: fechaReserva }),
    }),
  getServicios: () => apiRequest<TipoServicioDTO[]>('servicios/getServicios'),
  getAllTipoServicios: () => apiRequest<TipoServicioDTO[]>('servicios/getAllTipoServicios'),
  getTipoServicioById: (idTipoServicio: number) =>
    apiRequest<TipoServicioDTO>('servicios/GetTipoServicioById', {
      method: 'POST',
      body: createFormData({ IdTipoServicio: idTipoServicio }),
    }),
  getCalendarioByServicio: (idServicio: number, nPartidos: number, fechaReserva: string) =>
    apiRequest<ContenedorEventosDTO[]>('servicios/getCalendarioByServicio', {
      method: 'POST',
      body: createFormData({ IdServicio: idServicio, nPartidos, FechaReserva: fechaReserva }),
    }),
};
