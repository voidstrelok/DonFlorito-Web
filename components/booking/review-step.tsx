import { Lock } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '@/api'
import { createReserva } from '@/features/booking/submit'
import { buildReserva, cartTotal } from '@/features/booking/cart'
import { parseIsoDay } from '@/features/booking/dates'
import { useBooking } from '@/features/booking/state'
import { goToWebpay, savePending } from '@/features/booking/webpay'
import { track } from '@/lib/analytics'
import { longDay, money } from '@/lib/format'
import { Button } from '../ui/button'
import { Alert, Spinner } from '../ui/form'
import { CartLines } from './cart-panel'

/** Paso 3: revisar, aceptar términos y pagar. Un solo botón lleva directo a Webpay. */
export function ReviewStep() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { draft, dispatch } = useBooking()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTermsError, setShowTermsError] = useState(false)
  const p = draft.persona
  const total = cartTotal(draft.lines)

  const pay = async () => {
    if (!draft.accepted) {
      setShowTermsError(true)
      return
    }
    setBusy(true)
    setError(null)
    try {
      // 1) crea la reserva pendiente  2) genera la orden de pago  3) redirige a Webpay
      const reserva = await createReserva(api, buildReserva(draft.fecha!, draft.lines, p))
      savePending(reserva)
      const conOrden = await api.usarEnlace(reserva)
      savePending(conOrden)
      track('begin_checkout', { value: total, currency: 'CLP' })
      goToWebpay(conOrden)
    } catch (e) {
      setBusy(false)
      // Mensajes de negocio de la API (horario ocupado, servicio deshabilitado...) se muestran tal cual.
      setError(e instanceof ApiError && e.status !== 0 ? e.message : t('booking.review.failed'))
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-5 rounded-(--radius-card) bg-white p-6 shadow-(--shadow-card) sm:p-8">
        <h2 className="text-2xl font-bold text-azul-800">{t('booking.review.title')}</h2>

        <div className="flex items-start justify-between gap-4 rounded-xl bg-azul-50 p-4">
          <div>
            <p className="text-sm text-tinta-suave">{t('booking.cart.day')}</p>
            <p className="font-semibold first-letter:uppercase">{longDay(parseIsoDay(draft.fecha!), i18n.resolvedLanguage ?? 'es-CL')}</p>
          </div>
          <Link to="/reservar" className="text-sm font-semibold text-azul-700 underline">{t('booking.review.edit')}</Link>
        </div>

        <CartLines lines={draft.lines} />

        <div className="flex items-baseline justify-between border-t border-linea pt-4">
          <span className="font-semibold">{t('booking.cart.total')}</span>
          <span className="font-display text-3xl font-extrabold text-azul-800 tabular-nums">{money(total)}</span>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl bg-papel p-4">
          <div>
            <p className="text-sm text-tinta-suave">{t('booking.review.holder')}</p>
            <p className="font-semibold">{p.nombre} {p.apellidoPaterno}</p>
            <p className="text-sm text-tinta-suave">{p.email} · {p.telefono}</p>
          </div>
          <Link to="/reservar/datos" className="text-sm font-semibold text-azul-700 underline">{t('booking.review.edit')}</Link>
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" className="mt-1 size-5 accent-azul-600" checked={draft.accepted} aria-invalid={showTermsError && !draft.accepted} onChange={(e) => dispatch({ type: 'accepted', value: e.target.checked })} />
            <span>
              {t('booking.review.terms')}{' '}
              <a href={t('files.terms')} target="_blank" rel="noreferrer" className="font-semibold text-azul-700 underline">{t('booking.review.readTerms')}</a>
            </span>
          </label>
          {showTermsError && !draft.accepted && <p role="alert" className="mt-2 text-sm font-medium text-rojo-700">{t('booking.errors.terms')}</p>}
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        <div className="flex flex-wrap justify-between gap-3">
          <Button type="button" variant="ghost" size="lg" onClick={() => navigate('/reservar/datos')} disabled={busy}>{t('booking.back')}</Button>
          <Button type="button" variant="primary" size="lg" onClick={pay} disabled={busy}>
            {busy ? <><Spinner /> {t('booking.review.paying')}</> : <><Lock aria-hidden className="size-5" /> {t('booking.review.pay', { total: money(total) })}</>}
          </Button>
        </div>
        <p className="text-center text-sm text-tinta-suave">{t('booking.review.secure')}</p>
      </div>
    </div>
  )
}
