import { Suspense } from 'react';
import { ReservationStatus } from '@/components/reservation/reservation-status';

export default function MiReservaPage() {
  return (
    <Suspense fallback={<div className="text-center">Cargando reserva...</div>}>
      <ReservationStatus />
    </Suspense>
  );
}
