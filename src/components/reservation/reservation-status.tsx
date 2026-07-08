'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Countdown from 'react-countdown';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppLocale } from '@/components/providers/locale-provider';
import { useLoading } from '@/components/providers/loading-provider';
import {
  useConfirmarReservaMutation,
  useReservaByIdQuery,
  useReservaQrQuery,
} from '@/lib/hooks/useReservas';
import { useUsaEnlaceMutation } from '@/lib/hooks/useTransacciones';
import { useTranslations } from '@/lib/i18n';
import { EnumEstadoReserva } from '@/lib/types/enums';
import type { ReservaDTO, ReservaServicioDTO } from '@/lib/types/models';
import {
  describeReservationService,
  formatShortDate,
  getRemainingSeconds,
  getReservationStatusColor,
  getReservationTotal,
  parseReservationSearch,
} from '@/lib/utils/format';
import { PAYMENT_TIMEOUT_SECONDS } from '@/lib/utils/constants';
import {
  clearStoredReservation,
  getStoredReservation,
  setStoredReservation,
} from '@/lib/utils/storage';

function ReservationServiceRow({
  service,
  locale,
  t,
}: {
  service: ReservaServicioDTO;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="summary-row row align-items-center g-3">
      <div className="col-lg-8">
        <h5 className="mb-1">{describeReservationService(service, t, locale)}</h5>
      </div>
      <div className="col-lg-4 text-lg-end">
        <strong>${service.precioServicio.precio * service.cantidad}</strong>
      </div>
    </div>
  );
}

export function ReservationStatus({ reservationId }: { reservationId?: number }) {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useAppLocale();
  const { setManualLoading } = useLoading();
  const [lookupValue, setLookupValue] = useState('');
  const [pendingReservation, setPendingReservationState] = useState<ReservaDTO | null>(() => getStoredReservation());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const tokenWs = searchParams.get('token_ws');

  const usaEnlace = useUsaEnlaceMutation();
  const confirmarReserva = useConfirmarReservaMutation();
  const { data: fetchedReservation, isError } = useReservaByIdQuery(reservationId);
  const { data: qrBlob } = useReservaQrQuery(reservationId);

  const qrUrl = useMemo(() => (qrBlob ? URL.createObjectURL(qrBlob) : null), [qrBlob]);

  useEffect(() => {
    if (!qrUrl) return undefined;
    return () => URL.revokeObjectURL(qrUrl);
  }, [qrUrl]);

  useEffect(() => {
    if (!tokenWs || !pendingReservation) return;

    setManualLoading(true);
    confirmarReserva
      .mutateAsync({ tokenWs, reserva: pendingReservation })
      .then((reservation) => {
        clearStoredReservation();
        router.replace(`/mi-reserva/${reservation.id}`);
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : 'Error');
      })
      .finally(() => setManualLoading(false));
  }, [confirmarReserva, pendingReservation, router, setManualLoading, tokenWs]);

  const reservation = fetchedReservation ?? pendingReservation;
  const pendingPayment = reservation && !reservationId && reservation.idEstadoReserva === EnumEstadoReserva.PagoPendiente;
  const [now] = useState(() => Date.now());

  const countdownDate = useMemo(() => {
    if (!pendingReservation) return null;
    const seconds = getRemainingSeconds(pendingReservation.fechaIngreso, PAYMENT_TIMEOUT_SECONDS);
    return seconds > 0 ? now + seconds * 1000 : null;
  }, [now, pendingReservation]);

  async function handleLookupSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseReservationSearch(lookupValue);
    if (!parsed) {
      setErrorMessage(t('error-nreserva'));
      return;
    }
    router.push(`/mi-reserva/${parsed}`);
  }

  async function handlePay() {
    if (!pendingReservation) return;
    setManualLoading(true);
    try {
      const refreshedReservation = await usaEnlace.mutateAsync(pendingReservation);
      setStoredReservation(refreshedReservation);
      setPendingReservationState(refreshedReservation);
      if (refreshedReservation.idEstadoReserva === EnumEstadoReserva.Anulada) {
        clearStoredReservation();
        window.location.reload();
        return;
      }
      const order = refreshedReservation.ordenCompra[0];
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = order.url;
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'token_ws';
      input.value = order.token;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error');
    } finally {
      setManualLoading(false);
    }
  }

  if (!reservationId && !pendingReservation) {
    return (
      <div>
        <h1 className="azul text-center">{t('buscar-reserva')}</h1>
        <h3 className="parrafos azul text-center">{t('instruccion-buscar-reserva')}</h3>
        {errorMessage ? <div className="lb-error text-center mb-3">{errorMessage}</div> : null}
        <form onSubmit={handleLookupSubmit} className="mx-auto lookup-form">
          <div className="input-group mb-3">
            <span className="input-group-text">{t('n-reserva')}</span>
            <input
              type="text"
              className="form-control"
              placeholder={t('placeholder-nReserva')}
              value={lookupValue}
              onChange={(event) => setLookupValue(event.target.value)}
            />
          </div>
          <div className="text-center">
            <Button className="btn-azul" type="submit">
              {t('buscar-reserva')}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (reservationId && isError) {
    return (
      <div className="text-center">
        <p className="titulo-1">{t('reserva-notfound')}</p>
        <Button className="btn-azul" onClick={() => router.push('/mi-reserva')}>
          {t('regresar')}
        </Button>
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  return (
    <div>
      {errorMessage ? <div className="alert alert-danger">{errorMessage}</div> : null}
      <h1 className="azul text-center">{t('info-reserva')}</h1>
      {reservationId ? <h1 className="bryant-bold text-center">N° DF{reservation.id}</h1> : null}
      <h2 className={`${getReservationStatusColor(reservation.idEstadoReserva)} text-center`}>
        {pendingPayment ? (
          <>
            {t('Pago Pendiente')}{' '}
            {countdownDate ? (
              <Countdown date={countdownDate} renderer={({ minutes, seconds }) => <span>{`${minutes}:${String(seconds).padStart(2, '0')}`}</span>} />
            ) : null}
          </>
        ) : (
          t(reservation.estadoReserva.nombre)
        )}
      </h2>
      <h2 className="parrafos azul text-center">{t('fecha')}: {formatShortDate(reservation.fechaReserva, locale)}</h2>
      <h2 className="parrafos azul text-center">
        {reservation.persona.rut} {reservation.persona.nombre} {reservation.persona.apellidoPaterno}
      </h2>
      <div className="reservation-block mt-4">
        {reservation.reservaServicio.map((service) => (
          <ReservationServiceRow key={service.id} service={service} locale={locale} t={t} />
        ))}
        <hr />
        <div className="row align-items-center">
          <div className="col-lg-8">
            <h2>{t('total-reserva')}</h2>
          </div>
          <div className="col-lg-4 text-lg-end">
            <h2>${getReservationTotal(reservation.reservaServicio)}</h2>
          </div>
        </div>
      </div>
      {qrUrl ? (
        <div className="text-center my-4">
          <img src={qrUrl} width={300} alt="QR reserva" />
        </div>
      ) : null}
      <div className="text-center mt-4">
        {pendingPayment ? (
          <Button className="btn-azul" onClick={handlePay}>
            {t('pagar')}
          </Button>
        ) : (
          <Button className="btn-azul" onClick={() => router.push('/mi-reserva')}>
            {t('buscar-otra-reserva')}
          </Button>
        )}
      </div>
    </div>
  );
}
