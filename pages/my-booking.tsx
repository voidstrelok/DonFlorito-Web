import clsx from 'clsx'
import { CalendarCheck, QrCode, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, ApiError, ESTADO, type Reserva } from '@/api'
import { CartLines } from '@/components/booking/cart-panel'
import { Button, ButtonLink } from '@/components/ui/button'
import { Alert, Field, inputClass, Spinner } from '@/components/ui/form'
import { SiteMapLink } from '@/components/ui/site-map'
import { Container, Section } from '@/components/ui/section'
import { cartTotal, type CartLine } from '@/features/booking/cart'
import { clearPending, goToWebpay, loadPending, savePending } from '@/features/booking/webpay'
import { clearDraft } from '@/features/booking/state'
import { longDay, money } from '@/lib/format'
import { useAsync } from '@/lib/use-async'
import { usePageTitle } from '@/lib/use-page-title'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Section className="py-8! sm:py-12!">
      <Container className="max-w-2xl">{children}</Container>
    </Section>
  )
}

/* ---------- Buscar ---------- */

const NUM = /^\s*(?:df)?[-\s]?(\d{1,10})\s*$/i

function Search_() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string>()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const m = NUM.exec(value)
    if (!m) return setError(value.trim() ? t('myBooking.invalid') : t('booking.errors.required'))
    navigate(`/mi-reserva/${Number(m[1])}`)
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-(--radius-card) bg-white p-6 shadow-(--shadow-card) sm:p-8">
      <div className="text-center">
        <Search aria-hidden className="mx-auto mb-3 size-10 text-azul-600" />
        <h1 className="text-(length:--text-title) font-extrabold text-azul-800">{t('myBooking.searchTitle')}</h1>
        <p className="text-tinta-suave">{t('myBooking.searchHelp')}</p>
      </div>
      <Field label={t('myBooking.number')} error={error}>
        {({ id, describedBy, invalid }) => (
          <input id={id} className={inputClass(invalid)} aria-describedby={describedBy} aria-invalid={invalid} inputMode="text" placeholder="DF12345" value={value} onChange={(e) => { setValue(e.target.value); setError(undefined) }} />
        )}
      </Field>
      <Button type="submit" size="lg" className="w-full">{t('myBooking.search')}</Button>
    </form>
  )
}

/* ---------- Detalle ---------- */

const estadoStyle: Record<number, string> = {
  [ESTADO.Confirmada]: 'bg-verde-100 text-verde-800',
  [ESTADO.PagoPendiente]: 'bg-azul-100 text-azul-800',
  [ESTADO.Anulada]: 'bg-rojo-100 text-rojo-900',
}
const estadoKey: Record<number, string> = { [ESTADO.Confirmada]: 'confirmed', [ESTADO.PagoPendiente]: 'pending', [ESTADO.Anulada]: 'cancelled' }

function toLines(r: Reserva): CartLine[] {
  return r.reservaServicio.map((rs) => {
    const minutos = rs.precioServicio?.minutos ?? 0
    const fin = rs.horaComienzo && minutos ? new Date(new Date(rs.horaComienzo).getTime() + minutos * rs.cantidad * 60000).toISOString() : null
    return {
      idTipoServicio: rs.servicio.idTipoServicio,
      idServicio: rs.idServicio,
      idPrecioServicio: rs.idPrecioServicio,
      cantidad: rs.cantidad,
      horaComienzo: rs.horaComienzo,
      horaFinal: fin,
      nombre: rs.servicio.nombre,
      tipoNombre: rs.servicio.nombre,
      precio: rs.precioServicio?.precio ?? 0,
      minutos,
    }
  })
}

function Detail({ id }: { id: number }) {
  const { t, i18n } = useTranslation()
  const [params] = useSearchParams()
  const reserva = useAsync(() => api.getReserva(id), [id])
  const r = reserva.data
  const qr = useAsync(() => api.getQr(id), [id], r?.idEstadoReserva === ESTADO.Confirmada)
  usePageTitle(`${t('myBooking.title')} DF${id}`)

  if (reserva.loading && !r) return <p className="flex items-center justify-center gap-2 py-16 text-tinta-suave"><Spinner /> {t('booking.loading')}</p>
  if (reserva.error || !r) {
    const notFound = reserva.error instanceof ApiError && reserva.error.status === 404
    return (
      <div className="space-y-5 text-center">
        <Alert tone="error">{notFound ? t('myBooking.notFound') : t('booking.loadError')}</Alert>
        <ButtonLink to="/mi-reserva" variant="outline">{t('myBooking.another')}</ButtonLink>
      </div>
    )
  }

  const lines = toLines(r)
  const pending = loadPending()
  const canResume = r.idEstadoReserva === ESTADO.PagoPendiente && pending?.id === r.id
  const day = new Date(r.fechaReserva.slice(0, 10) + 'T00:00:00')

  return (
    <div className="space-y-6">
      {params.get('ok') && r.idEstadoReserva === ESTADO.Confirmada && (
        <Alert tone="success">
          <p className="text-lg font-bold">{t('myBooking.successTitle')}</p>
          <p>{t('myBooking.successText', { email: r.persona?.email })}</p>
        </Alert>
      )}

      <div className="space-y-5 rounded-(--radius-card) bg-white p-6 shadow-(--shadow-card) sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-tinta-suave">{t('myBooking.number')}</p>
            <h1 className="font-display text-4xl font-extrabold text-azul-800">DF{r.id}</h1>
          </div>
          <span className={clsx('rounded-full px-4 py-1.5 font-bold', estadoStyle[r.idEstadoReserva])}>{t(`myBooking.status.${estadoKey[r.idEstadoReserva] ?? 'pending'}`)}</span>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="flex items-center gap-1.5 text-sm text-tinta-suave"><CalendarCheck aria-hidden className="size-4" />{t('myBooking.date')}</dt>
            <dd className="font-semibold first-letter:uppercase">{longDay(day, i18n.resolvedLanguage ?? 'es-CL')}</dd>
          </div>
          <div>
            <dt className="text-sm text-tinta-suave">{t('myBooking.holder')}</dt>
            {/* Solo nombre y apellido: el RUT y los contactos no se muestran en pantalla. */}
            <dd className="font-semibold">{r.persona?.nombre} {r.persona?.apellidoPaterno}</dd>
          </div>
        </dl>

        <CartLines lines={lines} />
        <div className="flex items-baseline justify-between border-t border-linea pt-4">
          <span className="font-semibold">{t('booking.cart.total')}</span>
          <span className="font-display text-3xl font-extrabold text-azul-800 tabular-nums">{money(cartTotal(lines))}</span>
        </div>

        {r.idEstadoReserva === ESTADO.Confirmada && (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-papel p-5 text-center">
            {qr.data ? <img src={qr.data} alt={t('myBooking.qr')} className="size-44" /> : <QrCode aria-hidden className="size-16 text-azul-300" />}
            <p className="font-semibold">{t('myBooking.qr')}</p>
            <p className="text-sm text-tinta-suave">{t('myBooking.qrHelp')}</p>
            <p className="mt-2 text-sm"><SiteMapLink label={t('map.arrival')} /></p>
          </div>
        )}

        {r.idEstadoReserva === ESTADO.PagoPendiente && <Alert tone="warning">{t('myBooking.pendingHelp')}</Alert>}
        {canResume && <Retry reserva={pending!} label={t('myBooking.resume')} />}
      </div>

      <p className="text-center"><Link to="/mi-reserva" className="font-semibold text-azul-700 underline">{t('myBooking.another')}</Link></p>
    </div>
  )
}

/* ---------- Reintentar pago ---------- */

function Retry({ reserva, label }: { reserva: Reserva; label?: string }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string>()

  const go = async () => {
    setBusy(true)
    setMsg(undefined)
    try {
      const r = await api.usarEnlace(reserva)
      if (r.idEstadoReserva === ESTADO.Anulada) {
        clearPending()
        clearDraft()
        setMsg(t('return.tooMany'))
        setBusy(false)
        return
      }
      savePending(r)
      goToWebpay(r)
    } catch (e) {
      setMsg(e instanceof ApiError && e.status !== 0 ? e.message : t('booking.review.failed'))
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      {msg && <Alert tone="error">{msg}</Alert>}
      <Button variant="primary" size="lg" className="w-full" onClick={go} disabled={busy}>
        {busy ? <><Spinner /> {t('booking.review.paying')}</> : (label ?? t('return.retry'))}
      </Button>
    </div>
  )
}

/* ---------- Regreso desde Webpay ---------- */

// StrictMode ejecuta los efectos dos veces en desarrollo; esto evita confirmar el mismo pago dos veces.
const confirmations = new Map<string, Promise<Reserva>>()

function Returning({ token }: { token: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const pending = loadPending()
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!pending) return
    let p = confirmations.get(token)
    if (!p) {
      p = api.confirmarReserva(pending, token)
      confirmations.set(token, p)
    }
    let alive = true
    p.then(
      (r) => {
        clearPending()
        clearDraft()
        navigate(`/mi-reserva/${r.id}?ok=1`, { replace: true })
      },
      (e: unknown) => alive && setError(e instanceof ApiError && e.status !== 0 ? e.message : t('booking.review.failed')),
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (!pending) return <NoDraft />
  if (!error) {
    return (
      <div className="space-y-3 py-16 text-center" role="status">
        <Spinner className="mx-auto size-10 text-azul-600" />
        <p className="text-xl font-semibold text-azul-800">{t('return.confirming')}</p>
        <p className="text-tinta-suave">{t('return.dontClose')}</p>
      </div>
    )
  }
  return <Failed title={t('return.failedTitle')} message={error} reserva={pending} />
}

function Failed({ title, message, reserva }: { title: string; message?: string; reserva: Reserva }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-5 rounded-(--radius-card) bg-white p-6 shadow-(--shadow-card) sm:p-8">
      <Alert tone="error"><p className="font-bold">{title}</p>{message && <p>{message}</p>}</Alert>
      <Retry reserva={reserva} />
      <ButtonLink to="/reservar" variant="ghost" className="w-full" onClick={() => { clearPending(); clearDraft() }}>{t('return.startOver')}</ButtonLink>
    </div>
  )
}

function NoDraft() {
  const { t } = useTranslation()
  return (
    <div className="space-y-5 text-center">
      <Alert tone="warning">{t('return.noDraft')}</Alert>
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink to="/mi-reserva" variant="outline">{t('myBooking.searchTitle')}</ButtonLink>
        <ButtonLink to="/reservar">{t('nav.book')}</ButtonLink>
      </div>
    </div>
  )
}

/* ---------- Página ---------- */

export function MyBookingPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [params] = useSearchParams()
  usePageTitle(t('myBooking.title'))

  const token = params.get('token_ws')
  const aborted = params.get('TBK_TOKEN')
  const pending = loadPending()

  return (
    <Shell>
      {token ? (
        <Returning token={token} />
      ) : aborted ? (
        pending ? <Failed title={t('return.abortedTitle')} message={t('return.abortedText')} reserva={pending} /> : <NoDraft />
      ) : id && /^\d+$/.test(id) ? (
        <Detail id={Number(id)} />
      ) : (
        <Search_ />
      )}
    </Shell>
  )
}
