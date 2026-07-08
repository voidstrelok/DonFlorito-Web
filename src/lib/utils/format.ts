import { format, getTime, millisecondsToSeconds } from 'date-fns';
import type { ContenedorEventosDTO, ReservaDTO, ReservaServicioCreacionDTO, ReservaServicioDTO } from '@/lib/types/models';
import { EnumEstadoReserva, EnumTipoServicio } from '@/lib/types/enums';

export function toDate(value: Date | string | undefined | null) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function formatShortDate(value: Date | string | undefined | null, locale = 'es-CL') {
  const date = toDate(value);
  return date ? date.toLocaleDateString(locale) : '';
}

export function formatShortTime(value: Date | string | undefined | null, locale = 'es-CL') {
  const date = toDate(value);
  return date ? date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '';
}

export function getReservationTotal(
  services: Array<ReservaServicioCreacionDTO | ReservaServicioDTO> | undefined,
) {
  return (services ?? []).reduce((total, service) => {
    const price = 'precio' in service ? service.precio : service.precioServicio.precio;
    return total + service.cantidad * price;
  }, 0);
}

export function getReservationStatusColor(status: number) {
  switch (status) {
    case EnumEstadoReserva.Confirmada:
      return 'verde';
    case EnumEstadoReserva.Anulada:
      return 'rojo';
    default:
      return 'azul';
  }
}

export function isBookableDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today && date.getDay() !== 1 && date.getMonth() === today.getMonth();
}

export function toApiDate(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}-${month}-${year}`;
}

export function fromApiDate(value: string) {
  const [day, month, year] = value.split('-');
  return `${year}-${month}-${day}`;
}

export function getRemainingSeconds(createdAt: Date | string, timeoutSeconds: number) {
  return timeoutSeconds - millisecondsToSeconds(getTime(new Date()) - getTime(new Date(createdAt)));
}

export function describeReservationService(service: ReservaServicioCreacionDTO | ReservaServicioDTO, t: (key: string) => string, locale = 'es-CL') {
  const minutes = 'minutos' in service ? service.minutos : service.precioServicio.minutos ?? 0;
  const time = formatShortTime(service.horaComienzo, locale);
  const serviceName = 'nombre' in service ? service.nombre : service.servicio.nombre;
  const typeId = 'idTipoServicio' in service ? service.idTipoServicio : service.servicio.idTipoServicio;

  if (typeId === EnumTipoServicio.Quincho) {
    return `${service.cantidad} x ${t(serviceName)}`;
  }

  if (typeId === EnumTipoServicio.PiscinaGeneral || typeId === EnumTipoServicio.PiscinaAM) {
    return `${service.cantidad} x ${t('entrada')} ${t(serviceName)}`;
  }

  return `${service.cantidad} ${service.cantidad > 1 ? t('partidos') : t('partido')} - ${t(serviceName)}${time ? ` · ${t('desde')} ${time} - ${minutes * service.cantidad} min.` : ''}`;
}

export function buildCalendarTitle(slot: ContenedorEventosDTO, t: (key: string) => string) {
  const start = format(new Date(slot.horaComienzo), 'p');
  const end = format(new Date(slot.horaFinal), 'p');
  return slot.reservado ? 'No Disponible' : `${t('disponible-desde')} ${start} ${t('hasta')} ${end}`;
}

export function parseReservationSearch(raw: string) {
  const trimmed = raw.trim();
  if (/^[Dd][Ff]\d+$/.test(trimmed)) return trimmed.slice(2);
  if (/^\d+$/.test(trimmed)) return trimmed;
  return null;
}

export function buildPaymentPayload(reservation: ReservaDTO) {
  return {
    id: reservation.id,
    token: reservation.ordenCompra?.[0]?.token,
    url: reservation.ordenCompra?.[0]?.url,
  };
}
