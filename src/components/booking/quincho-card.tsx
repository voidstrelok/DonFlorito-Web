import { useTranslation } from 'react-i18next'
import type { TipoServicio } from '@/api'
import { useConfig } from '@/config'
import { useBooking } from '@/features/booking/state'
import { money } from '@/lib/format'
import { ChoicePills, QtyStepper } from '../ui/form'
import { SiteMapLink } from '../ui/site-map'
import { HighlightBadge, highlightRing } from './highlight'
import { useNames } from './line-label'

export function QuinchoCard({ tipo, highlight = false }: { tipo: TipoServicio; highlight?: boolean }) {
  const { t } = useTranslation()
  const tn = useNames()
  const { booking } = useConfig()
  const { draft, dispatch } = useBooking()
  const precio = tipo.precioServicio[0]
  const line = draft.lines.find((l) => l.idTipoServicio === tipo.id)

  const write = (idServicio: number, cantidad: number) => {
    if (cantidad <= 0) return dispatch({ type: 'remove', idTipoServicio: tipo.id })
    const servicio = tipo.servicio.find((s) => s.id === idServicio) ?? tipo.servicio[0]
    dispatch({
      type: 'upsert',
      line: {
        idTipoServicio: tipo.id,
        idServicio: servicio.id,
        idPrecioServicio: precio.id,
        cantidad,
        horaComienzo: null,
        horaFinal: null,
        nombre: servicio.nombre,
        tipoNombre: tipo.nombre,
        precio: precio.precio,
        minutos: 0,
      },
    })
  }

  return (
    <li data-highlight={highlight} className={`scroll-mt-24 space-y-5 rounded-(--radius-card) bg-white p-5 shadow-(--shadow-card) ring-2 ${line ? 'ring-verde-600' : highlight ? highlightRing : 'ring-transparent'}`}>
      <div>
        <h3 className="flex flex-wrap items-center gap-2 text-xl font-bold text-azul-800">
          {t('booking.quincho.title')}
          {highlight && <HighlightBadge />}
        </h3>
        <p className="text-tinta-suave">
          <span className="font-semibold text-rojo-700">{money(precio.precio)}</span> · {t('booking.quincho.desc')}
        </p>
      </div>
      <ChoicePills
        name="quincho-zona"
        legend={t('booking.quincho.zone')}
        value={line?.idServicio ?? null}
        options={tipo.servicio.map((s) => ({ value: s.id, label: tn(s.nombre) }))}
        // Al elegir zona se reserva 1 quincho de inmediato; después se ajusta con el contador.
        onChange={(id) => write(id, line?.cantidad ?? 1)}
      />
      <p className="text-sm"><SiteMapLink label={t('map.quinchoHint')} /></p>
      {line && (
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm font-semibold">{t('booking.quincho.quantity')}</p>
          <QtyStepper label={t('booking.quincho.quantity')} value={line.cantidad} max={booking.maxQuinchos} onChange={(n) => write(line.idServicio, n)} />
        </div>
      )}
    </li>
  )
}
