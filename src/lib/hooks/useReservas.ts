'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reservasApi } from '@/lib/api/reservas';
import type { ReservaCreacionDTO, ReservaDTO, ReservaEspecialCreacionDTO } from '@/lib/types/models';

export function useNuevaReservaMutation() {
  return useMutation({ mutationFn: (reserva: ReservaCreacionDTO) => reservasApi.nuevaReserva(reserva) });
}

export function useConfirmarReservaMutation() {
  return useMutation({
    mutationFn: ({ tokenWs, reserva }: { tokenWs: string; reserva: ReservaDTO }) =>
      reservasApi.confirmarReserva(tokenWs, reserva),
  });
}

export function useReservaByIdQuery(idReserva?: number) {
  return useQuery({
    queryKey: ['reservas', idReserva],
    queryFn: () => reservasApi.getById(idReserva as number),
    enabled: typeof idReserva === 'number' && !Number.isNaN(idReserva),
  });
}

export function useReservaQrQuery(idReserva?: number) {
  return useQuery({
    queryKey: ['reservas', idReserva, 'qr'],
    queryFn: () => reservasApi.getLinkQR(idReserva as number),
    enabled: typeof idReserva === 'number' && !Number.isNaN(idReserva),
  });
}

export function useReservasQuery(anio: number, mes: number, pagina = 1, porPagina = 10, enabled = true) {
  return useQuery({
    queryKey: ['reservas', 'admin', anio, mes, pagina, porPagina],
    queryFn: () => reservasApi.getReservas(anio, mes, pagina, porPagina),
    enabled,
  });
}

export function useReservasEspecialesQuery(anio: number, mes: number, enabled = true) {
  return useQuery({
    queryKey: ['reservas', 'especiales', anio, mes],
    queryFn: () => reservasApi.getReservasEspeciales(anio, mes),
    enabled,
  });
}

export function useCancelarReservaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idReserva: number) => reservasApi.cancelarReserva(idReserva),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reservas'] });
    },
  });
}

export function useIngresarReservaEspecialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReservaEspecialCreacionDTO) => reservasApi.ingresarReservaEspecial(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reservas', 'especiales'] });
    },
  });
}

export function useCancelarReservaEspecialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idReserva: number) => reservasApi.cancelarReservaEspecial(idReserva),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reservas', 'especiales'] });
    },
  });
}
