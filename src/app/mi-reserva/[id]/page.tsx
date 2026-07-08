import { Suspense } from 'react';
import { ReservationStatus } from '@/components/reservation/reservation-status';

export default async function MiReservaByIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="text-center">Cargando reserva...</div>}>
      <ReservationStatus reservationId={Number(id)} />
    </Suspense>
  );
}
