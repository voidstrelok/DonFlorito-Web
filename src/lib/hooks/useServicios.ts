'use client';

import { useQuery } from '@tanstack/react-query';
import { serviciosApi } from '@/lib/api/servicios';

export function useCatalogoQuery(fechaReserva: string, enabled = true) {
  return useQuery({
    queryKey: ['servicios', 'catalogo', fechaReserva],
    queryFn: () => serviciosApi.getCatalogo(fechaReserva),
    enabled: enabled && Boolean(fechaReserva),
  });
}

export function useServiciosQuery(enabled = true) {
  return useQuery({ queryKey: ['servicios'], queryFn: serviciosApi.getServicios, enabled });
}

export function useAllTipoServiciosQuery(enabled = true) {
  return useQuery({ queryKey: ['tipo-servicios'], queryFn: serviciosApi.getAllTipoServicios, enabled });
}

export function useTipoServicioByIdQuery(idTipoServicio: number, enabled = true) {
  return useQuery({
    queryKey: ['tipo-servicios', idTipoServicio],
    queryFn: () => serviciosApi.getTipoServicioById(idTipoServicio),
    enabled: enabled && idTipoServicio > 0,
  });
}

export function useCalendarioByServicioQuery(
  idServicio: number,
  nPartidos: number,
  fechaReserva: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ['servicios', 'calendario', idServicio, nPartidos, fechaReserva],
    queryFn: () => serviciosApi.getCalendarioByServicio(idServicio, nPartidos, fechaReserva),
    enabled: enabled && idServicio > 0 && Boolean(fechaReserva),
  });
}
