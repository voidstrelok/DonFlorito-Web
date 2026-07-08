'use client';

import { useMutation } from '@tanstack/react-query';
import { transaccionesApi } from '@/lib/api/transacciones';
import type { ReservaDTO } from '@/lib/types/models';

export function useCommitTransaccionMutation() {
  return useMutation({
    mutationFn: ({ tokenWs, idReserva }: { tokenWs: string; idReserva: string }) =>
      transaccionesApi.commit(tokenWs, idReserva),
  });
}

export function useUsaEnlaceMutation() {
  return useMutation({
    mutationFn: (reserva: ReservaDTO) => transaccionesApi.usaEnlace(reserva),
  });
}
