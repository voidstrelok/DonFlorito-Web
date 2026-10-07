import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '@/api'
import { useConfig } from '@/config'
import { bookableDays, toApiDate } from '@/features/booking/dates'
import { useBooking } from '@/features/booking/state'
import { track } from '@/lib/analytics'
import { Alert } from '../ui/form'
import { CartBar, CartSidebar } from './cart-panel'
import { DateStrip } from './date-strip'
import { ServiceList } from './service-list'

/** Paso 1: día y servicios en una sola pantalla. */
export function ChooseStep() {
  const { t } = useTranslation()
  const { booking } = useConfig()
  const navigate = useNavigate()
  const { draft, dispatch } = useBooking()
  const [search] = useSearchParams()
  const highlight = useMemo(
    () => (search.get('destacar') ?? '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0),
    [search],
  )
  const days = useMemo(() => bookableDays(new Date(), booking), [booking])

  // Si el borrador trae un día que ya no es reservable (p. ej. pasó), se descarta.
  const fecha = draft.fecha && days.includes(draft.fecha) ? draft.fecha : null

  // Al abrir la reserva se revisa el día: sin día elegido se propone el primero disponible y, si se llega desde la ficha
  // de un servicio, se exige que ese servicio esté disponible ese día (p. ej. el fútbol no abre todos los días).
  // Solo corre al abrir (o al cambiar el servicio destacado): después la persona manda.
  const fechaRef = useRef(fecha)
  fechaRef.current = fecha
  const highlightKey = highlight.join(',')
  useEffect(() => {
    let cancelled = false
    const has = async (d: string) => {
      const tipos = await api.getCatalogo(toApiDate(d))
      return tipos.some((x) => highlight.includes(x.id) && x.servicio.length > 0)
    }
    ;(async () => {
      const current = fechaRef.current
      let pick = current ?? days[0] ?? null
      if (highlight.length > 0) {
        try {
          if (!(current && (await has(current)))) {
            for (const d of days) {
              if (await has(d)) {
                pick = d
                break
              }
            }
          }
        } catch {
          // Sin catálogo no se puede verificar: se deja el día que había o el primero.
        }
      }
      if (!cancelled && pick && pick !== current) dispatch({ type: 'fecha', fecha: pick })
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightKey, days, dispatch])

  const next = () => {
    track('booking_continue', { items: draft.lines.length })
    navigate('/reservar/datos')
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 pb-24 lg:grid-cols-[minmax(0,1fr)_22rem] lg:pb-0">
      <div className="min-w-0 space-y-8">
        <section aria-labelledby="sec-dia">
          <h2 id="sec-dia" className="text-2xl font-bold text-azul-800">{t('booking.date.title')}</h2>
          <p className="mb-3 text-tinta-suave">{t('booking.date.hint')}</p>
          <DateStrip days={days} value={fecha} onChange={(iso) => dispatch({ type: 'fecha', fecha: iso })} />
        </section>

        {fecha ? <ServiceList fecha={fecha} highlight={highlight} /> : <Alert tone="info">{t('booking.date.pickFirst')}</Alert>}
      </div>

      <CartSidebar onContinue={next} />
      <CartBar onContinue={next} />
    </div>
  )
}
