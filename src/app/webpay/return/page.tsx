'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLoading } from '@/components/providers/loading-provider';
import { useConfirmarReservaMutation } from '@/lib/hooks/useReservas';
import { useCommitTransaccionMutation } from '@/lib/hooks/useTransacciones';
import { getStoredReservation, clearStoredReservation } from '@/lib/utils/storage';

function WebpayReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setManualLoading } = useLoading();
  const commitMutation = useCommitTransaccionMutation();
  const confirmMutation = useConfirmarReservaMutation();
  const [error, setError] = useState<string | null>(null);
  const tokenWs = searchParams.get('token_ws');
  const reservation = getStoredReservation();
  const hasPendingReservation = Boolean(tokenWs && reservation);

  useEffect(() => {
    if (!tokenWs || !reservation) return;

    setManualLoading(true);
    commitMutation
      .mutateAsync({ tokenWs, idReserva: String(reservation.id) })
      .then((committed) => confirmMutation.mutateAsync({ tokenWs, reserva: committed }))
      .then((confirmed) => {
        clearStoredReservation();
        router.replace(`/mi-reserva/${confirmed.id}`);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Error'))
      .finally(() => setManualLoading(false));
  }, [commitMutation, confirmMutation, reservation, router, setManualLoading, tokenWs]);

  if (!hasPendingReservation) {
    return <div className="alert alert-danger">No se encontró una reserva pendiente para confirmar.</div>;
  }

  return <div className="text-center">{error ? <div className="alert alert-danger">{error}</div> : <p>Procesando retorno de Webpay...</p>}</div>;
}

export default function WebpayReturnPage() {
  return (
    <Suspense fallback={<div className="text-center">Procesando retorno de Webpay...</div>}>
      <WebpayReturnContent />
    </Suspense>
  );
}
