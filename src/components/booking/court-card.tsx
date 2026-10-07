import clsx from 'clsx'
import { Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api, type Parametros, type TipoServicio } from '@/api'
import { toApiDate } from '@/features/booking/dates'
import { useBooking } from '@/features/booking/state'
import { money, timeLabel } from '@/lib/format'
import { useAsync } from '@/lib/use-async'
import { Alert, ChoicePills, QtyStepper, Spinner } from '../ui/form'
import { HighlightBadge, highlightRing } from './highlight'
import { useNames } from './line-label'

/** Cuántos partidos seguidos caben en el horario de atención. */
export function maxMatches(tipo: TipoServicio, params: Parametros | undefined): number {
  const minutos = tipo.precioServicio[0]?.minutos ?? 60
  let byHours = 6
  if (params) {
    const a = new Date(params.horaApertura)
    const c = new Date(params.horaCierre)
    const open = c.getHours() * 60 + c.getMinutes() - (a.getHours() * 60 + a.getMinutes())
    if (open > 0) byHours = Math.max(1, Math.floor(open / minutos))
  }
  return tipo.maxPartidos && tipo.maxPartidos > 0 ? Math.min(byHours, tipo.maxPartidos) : byHours
}

export function CourtCard({ tipo, fecha, highlight = false }: { tipo: TipoServicio; fecha: string; highlight?: boolean }) {
  const { t, i18n } = useTranslation()
  const tn = useNames()
  const lang = i18n.resolvedLanguage ?? 'es-CL'
  const { draft, dispatch, params } = useBooking()
  const precio = tipo.precioServicio[0]
  const line = draft.lines.find((l) => l.idTipoServicio === tipo.id)

  const [open, setOpen] = useState(Boolean(line) || highlight)
  const [servicioId, setServicioId] = useState<number>(line?.idServicio ?? tipo.servicio[0].id)
  const [partidos, setPartidos] = useState(line?.cantidad ?? 1)
  const max = maxMatches(tipo, params)

  const slots = useAsync(() => api.getCalendario(servicioId, partidos, toApiDate(fecha)), [servicioId, partidos, fecha, tipo.id], open)
  const free = (slots.data ?? []).filter((s) => !s.reservado)
  const servicio = tipo.servicio.find((s) => s.id === servicioId) ?? tipo.servicio[0]

  /** Cambiar cancha o duración invalida el horario elegido antes. */
  const clearIfAny = () => line && dispatch({ type: 'remove', idTipoServicio: tipo.id })

  const pick = (horaComienzo: string, horaFinal: string) => {
    if (line?.horaComienzo === horaComienzo && line.idServicio === servicioId && line.cantidad === partidos) {
      dispatch({ type: 'remove', idTipoServicio: tipo.id })
      return
    }
    dispatch({
      type: 'upsert',
      line: {
        idTipoServicio: tipo.id,
        idServicio: servicio.id,
        idPrecioServicio: precio.id,
        cantidad: partidos,
        horaComienzo,
        horaFinal,
        nombre: servicio.nombre,
        tipoNombre: tipo.nombre,
        precio: precio.precio,
        minutos: precio.minutos ?? 0,
      },
    })
  }

  const panelId = `court-${tipo.id}`
  return (
    <li data-highlight={highlight} className={clsx('scroll-mt-24 overflow-hidden rounded-(--radius-card) bg-white shadow-(--shadow-card) ring-2', line ? 'ring-verde-600' : highlight ? highlightRing : 'ring-transparent')}>
      <button type="button" className="flex w-full items-center gap-4 p-5 text-left" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
        <div className="min-w-0 flex-1">
          <h3 className="flex flex-wrap items-center gap-2 text-xl font-bold text-azul-800">
            {tn(tipo.nombre)}
            {highlight && <HighlightBadge />}
          </h3>
          <p className="text-tinta-suave">
            {t('booking.court.price', { price: money(precio.precio), min: precio.minutos })}
            {tipo.servicio.length > 1 && ` · ${t('booking.court.available', { count: tipo.servicio.length })}`}
          </p>
          {line && (
            <p className="mt-1 inline-flex items-center gap-1.5 font-semibold text-verde-700">
              <Check aria-hidden className="size-4" />
              {timeLabel(line.horaComienzo!, lang)} – {timeLabel(line.horaFinal!, lang)} · {tn(line.nombre)}
            </p>
          )}
        </div>
        <span className="hidden text-sm font-semibold text-azul-700 sm:block">{open ? t('booking.court.hide') : line ? t('booking.court.change') : t('booking.court.show')}</span>
        <ChevronDown aria-hidden className={clsx('size-6 shrink-0 text-azul-700 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div id={panelId} className="space-y-5 border-t border-linea p-5">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            {tipo.servicio.length > 1 && (
              <ChoicePills
                name={`cancha-${tipo.id}`}
                legend={t('booking.court.pickCourt')}
                value={servicioId}
                options={tipo.servicio.map((s) => ({ value: s.id, label: tn(s.nombre) }))}
                onChange={(v) => {
                  clearIfAny()
                  setServicioId(v)
                }}
              />
            )}
            {max > 1 && (
              <div>
                <p className="mb-2 text-sm font-semibold">{t('booking.court.matches')}</p>
                <div className="flex items-center gap-4">
                  <QtyStepper
                    label={t('booking.court.matches')}
                    value={partidos}
                    min={1}
                    max={max}
                    onChange={(n) => {
                      clearIfAny()
                      setPartidos(n)
                    }}
                  />
                  <span className="text-sm text-tinta-suave">
                    {t('booking.court.total', { minutes: partidos * (precio.minutos ?? 0), price: money(partidos * precio.precio) })}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">{t('booking.court.pickTime')}</p>
            {slots.loading && !slots.data ? (
              <p className="flex items-center gap-2 text-tinta-suave"><Spinner /> {t('booking.loading')}</p>
            ) : slots.error ? (
              <Alert tone="error">
                {t('booking.loadError')}{' '}
                <button type="button" className="font-semibold underline" onClick={slots.reload}>{t('booking.retry')}</button>
              </Alert>
            ) : free.length === 0 ? (
              <Alert tone="warning">{t('booking.court.noSlots')}</Alert>
            ) : (
              <ul className={clsx('grid grid-cols-2 gap-2 sm:grid-cols-3', slots.loading && 'opacity-50')}>
                {free.map((s) => {
                  const selected = line?.horaComienzo === s.horaComienzo && line.idServicio === servicioId && line.cantidad === partidos
                  return (
                    <li key={s.horaComienzo}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => pick(s.horaComienzo, s.horaFinal)}
                        className={clsx(
                          'flex min-h-12 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border-2 px-3 font-semibold tabular-nums transition-colors',
                          selected ? 'border-verde-600 bg-verde-600 text-white' : 'border-linea bg-white hover:border-verde-400 hover:bg-verde-50',
                        )}
                      >
                        {selected && <Check aria-hidden className="size-4" />}
                        {timeLabel(s.horaComienzo, lang)} – {timeLabel(s.horaFinal, lang)}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </li>
  )
}
