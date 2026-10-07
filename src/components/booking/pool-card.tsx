import { useTranslation } from 'react-i18next'
import type { TipoServicio } from '@/api'
import { useConfig } from '@/config'
import { useBooking } from '@/features/booking/state'
import { money } from '@/lib/format'
import { QtyStepper } from '../ui/form'
import { HighlightBadge, highlightRing } from './highlight'

function Row({ tipo, title, desc }: { tipo: TipoServicio; title: string; desc: string }) {
  const { t } = useTranslation()
  const { booking } = useConfig()
  const { draft, dispatch } = useBooking()
  const precio = tipo.precioServicio[0]
  const servicio = tipo.servicio[0]
  const qty = draft.lines.find((l) => l.idTipoServicio === tipo.id)?.cantidad ?? 0

  const set = (n: number) => {
    if (n <= 0) return dispatch({ type: 'remove', idTipoServicio: tipo.id })
    dispatch({
      type: 'upsert',
      line: {
        idTipoServicio: tipo.id,
        idServicio: servicio.id,
        idPrecioServicio: precio.id,
        cantidad: n,
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
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-lg font-bold">{title}</p>
        <p className="text-tinta-suave">{desc}</p>
        <p className="font-semibold text-celeste-700">{money(precio.precio)} <span className="font-normal text-tinta-suave">{t('booking.pool.perPerson')}</span></p>
      </div>
      <QtyStepper label={title} value={qty} max={booking.maxPoolTickets} onChange={set} />
    </div>
  )
}

export function PoolCard({ general, senior, highlight = false }: { general?: TipoServicio; senior?: TipoServicio; highlight?: boolean }) {
  const { t } = useTranslation()
  const { draft } = useBooking()
  const active = draft.lines.some((l) => l.idTipoServicio === general?.id || l.idTipoServicio === senior?.id)
  return (
    <li data-highlight={highlight} className={`scroll-mt-24 space-y-5 rounded-(--radius-card) bg-white p-5 shadow-(--shadow-card) ring-2 ${active ? 'ring-verde-600' : highlight ? highlightRing : 'ring-transparent'}`}>
      <div>
        <h3 className="flex flex-wrap items-center gap-2 text-xl font-bold text-azul-800">
          {t('booking.pool.title')}
          {highlight && <HighlightBadge />}
        </h3>
        <p className="text-tinta-suave">{t('booking.pool.help')}</p>
      </div>
      {general && <Row tipo={general} title={t('booking.pool.general')} desc={t('booking.pool.generalDesc')} />}
      {senior && <Row tipo={senior} title={t('booking.pool.senior')} desc={t('booking.pool.seniorDesc')} />}
    </li>
  )
}
