'use client';

import { useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { EventClickArg } from '@fullcalendar/core';
import { useCalendarioByServicioQuery } from '@/lib/hooks/useServicios';
import { useTranslations } from '@/lib/i18n';
import type { ReservaServicioCreacionDTO, TipoServicioDTO } from '@/lib/types/models';
import { buildCalendarTitle, formatShortTime } from '@/lib/utils/format';

interface TimedServiceCardProps {
  tipoServicio: TipoServicioDTO;
  fechaReserva: string;
  locale: string;
  onChange: (item: ReservaServicioCreacionDTO | null) => void;
}

export function TimedServiceCard({ tipoServicio, fechaReserva, locale, onChange }: TimedServiceCardProps) {
  const t = useTranslations();
  const [selectedServiceId, setSelectedServiceId] = useState(tipoServicio.servicio[0]?.id ?? 0);
  const [selectedMatches, setSelectedMatches] = useState(1);
  const [selectedSlotKey, setSelectedSlotKey] = useState('');

  const { data: calendario = [], isLoading } = useCalendarioByServicioQuery(
    selectedServiceId,
    selectedMatches,
    fechaReserva,
    Boolean(fechaReserva) && selectedServiceId > 0,
  );

  const availableSlots = useMemo(
    () =>
      calendario.filter((slot) => !slot.reservado).map((slot) => ({
        ...slot,
        key: new Date(slot.horaComienzo).toISOString(),
      })),
    [calendario],
  );

  const calendarEvents = useMemo(
    () =>
      calendario.map((slot) => ({
        id: new Date(slot.horaComienzo).toISOString(),
        start: new Date(slot.horaComienzo),
        end: new Date(slot.horaFinal),
        title: buildCalendarTitle(slot, t),
        color: slot.reservado ? '#d03543' : '#0e8937',
        textColor: '#ffffff',
        extendedProps: { reservado: slot.reservado },
      })),
    [calendario, t],
  );

  useEffect(() => {
    const slot = availableSlots.find((item) => item.key === selectedSlotKey);
    if (!slot) {
      onChange(null);
      return;
    }

    onChange({
      idServicio: selectedServiceId,
      idTipoServicio: tipoServicio.id,
      idPrecioServicio: tipoServicio.precioServicio[0]?.id ?? 0,
      cantidad: selectedMatches,
      horaComienzo: slot.horaComienzo,
      nombre: tipoServicio.servicio.find((servicio) => servicio.id === selectedServiceId)?.nombre ?? tipoServicio.nombre,
      precio: tipoServicio.precioServicio[0]?.precio ?? 0,
      minutos: tipoServicio.precioServicio[0]?.minutos ?? 0,
    });
  }, [availableSlots, onChange, selectedMatches, selectedServiceId, selectedSlotKey, tipoServicio]);

  function handleEventClick(arg: EventClickArg) {
    if (arg.event.extendedProps.reservado) return;
    setSelectedSlotKey(arg.event.id);
  }

  return (
    <div className="service-selector-card">
      <div className="row g-3 align-items-end mb-3">
        <div className="col-lg-6">
          <label className="form-label">{t('seleccionar-cancha')}</label>
          <select
            className="form-select"
            value={selectedServiceId}
            onChange={(event) => {
              setSelectedServiceId(Number(event.target.value));
              setSelectedSlotKey('');
              onChange(null);
            }}
          >
            {tipoServicio.servicio.map((servicio) => (
              <option key={servicio.id} value={servicio.id}>
                {t(servicio.nombre)}
              </option>
            ))}
          </select>
        </div>
        <div className="col-lg-3">
          <label className="form-label">{t('partidos')}</label>
          <input
            className="form-control"
            type="number"
            min={1}
            max={Math.max(tipoServicio.maxPartidos || 1, 1)}
            value={selectedMatches}
            onChange={(event) => {
              setSelectedMatches(
                Math.max(1, Math.min(Number(event.target.value) || 1, Math.max(tipoServicio.maxPartidos || 1, 1))),
              );
              setSelectedSlotKey('');
              onChange(null);
            }}
          />
        </div>
        <div className="col-lg-3">
          <div className="selector-total text-lg-end">
            <strong>${(tipoServicio.precioServicio[0]?.precio ?? 0) * selectedMatches}</strong>
            <div className="small text-muted">{(tipoServicio.precioServicio[0]?.minutos ?? 0) * selectedMatches} min.</div>
          </div>
        </div>
      </div>

      <div className="calendar-wrapper mb-3">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          locale={locale === 'en-US' ? 'en-gb' : 'es'}
          headerToolbar={false}
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          height="auto"
          events={calendarEvents}
          eventClick={handleEventClick}
        />
      </div>

      <div className="row g-3 align-items-end">
        <div className="col-lg-9">
          <label className="form-label">{t('seleccionar-horario')}</label>
          <select
            className="form-select"
            value={selectedSlotKey}
            onChange={(event) => setSelectedSlotKey(event.target.value)}
            disabled={isLoading || availableSlots.length === 0}
          >
            <option value="">-- {t('seleccionar-horario')} --</option>
            {availableSlots.map((slot) => (
              <option key={slot.key} value={slot.key}>
                {formatShortTime(slot.horaComienzo, locale)} - {formatShortTime(slot.horaFinal, locale)}
              </option>
            ))}
          </select>
        </div>
        <div className="col-lg-3 text-lg-end">
          <span className="small text-muted">
            {isLoading ? 'Cargando...' : `${availableSlots.length} ${t('disponible')}`}
          </span>
        </div>
      </div>
    </div>
  );
}
