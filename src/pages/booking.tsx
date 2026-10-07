import clsx from 'clsx'
import { Check } from 'lucide-react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/api'
import { ChooseStep } from '@/components/booking/choose-step'
import { DetailsStep } from '@/components/booking/details-step'
import { ReviewStep } from '@/components/booking/review-step'
import { ButtonAnchor } from '@/components/ui/button'
import { SiteMapLink } from '@/components/ui/site-map'
import { Alert, Spinner } from '@/components/ui/form'
import { Container, Section } from '@/components/ui/section'
import { useConfig } from '@/config'
import { BookingProvider, useBooking } from '@/features/booking/state'
import { isEmail, isPhone, isRutValid } from '@/features/booking/validation'
import { contactLinks } from '@/lib/contact'
import { useAsync } from '@/lib/use-async'
import { usePageTitle } from '@/lib/use-page-title'

const STEPS = ['choose', 'details', 'pay'] as const

function Progress({ current }: { current: number }) {
  const { t } = useTranslation()
  return (
    <ol className="mx-auto mb-8 flex max-w-xl items-center" aria-label={t('booking.title')}>
      {STEPS.map((key, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={key} className={clsx('flex items-center', i < STEPS.length - 1 && 'flex-1')} aria-current={active ? 'step' : undefined}>
            <span className={clsx('flex size-9 shrink-0 items-center justify-center rounded-full font-bold', done ? 'bg-verde-600 text-white' : active ? 'bg-azul-600 text-white' : 'bg-linea text-tinta-suave')}>
              {done ? <Check aria-hidden className="size-5" /> : i + 1}
            </span>
            <span className={clsx('ml-2 text-sm font-semibold sm:block', active ? 'block text-azul-800' : 'hidden text-tinta-suave')}>{t(`booking.steps.${key}`)}</span>
            {i < STEPS.length - 1 && <span aria-hidden className={clsx('mx-3 h-0.5 flex-1', done ? 'bg-verde-600' : 'bg-linea')} />}
          </li>
        )
      })}
    </ol>
  )
}

/** No deja entrar a pasos posteriores sin lo necesario (p. ej. recargar /reservar/pago sin carro). */
function Guarded({ need, children }: { need: 'cart' | 'persona'; children: React.ReactNode }) {
  const { draft } = useBooking()
  const p = draft.persona
  if (!draft.fecha || draft.lines.length === 0) return <Navigate to="/reservar" replace />
  if (need === 'persona' && !(isRutValid(p.rut) && p.nombre && p.apellidoPaterno && isEmail(p.email) && isPhone(p.telefono))) {
    return <Navigate to="/reservar/datos" replace />
  }
  return <>{children}</>
}

function Steps() {
  const { pathname } = useLocation()
  const current = pathname.endsWith('/pago') ? 2 : pathname.endsWith('/datos') ? 1 : 0
  return (
    <>
      <Progress current={current} />
      <Routes>
        <Route index element={<ChooseStep />} />
        <Route path="datos" element={<Guarded need="cart"><DetailsStep /></Guarded>} />
        <Route path="pago" element={<Guarded need="persona"><ReviewStep /></Guarded>} />
        <Route path="*" element={<Navigate to="/reservar" replace />} />
      </Routes>
    </>
  )
}

export function BookingPage() {
  const { t } = useTranslation()
  const config = useConfig()
  usePageTitle(t('booking.title'))
  const params = useAsync(() => api.getParametros(), [])

  return (
    <Section className="py-8! sm:py-12!">
      <Container>
        <h1 className="mb-6 text-center text-(length:--text-title) font-extrabold text-azul-800">{t('booking.title')}</h1>
        <p className="-mt-3 mb-6 text-center text-tinta-suave">{t('map.bookingHint')} <SiteMapLink /></p>
        {config.payments.showTestBanner && <Alert tone="warning" className="mx-auto mb-6 max-w-3xl">{t('booking.testBanner')}</Alert>}

        {params.loading && !params.data ? (
          <p className="flex items-center justify-center gap-2 py-16 text-tinta-suave"><Spinner /> {t('booking.loading')}</p>
        ) : params.error ? (
          <Alert tone="error" className="mx-auto max-w-xl">
            {t('booking.loadError')} <button type="button" className="font-semibold underline" onClick={params.reload}>{t('booking.retry')}</button>
          </Alert>
        ) : params.data && !params.data.reservasEnabled ? (
          <div className="mx-auto max-w-xl space-y-5 text-center">
            <img src="/brand/Queltehue2.png" alt="" className="mx-auto h-36 w-auto" />
            <h2 className="text-2xl font-bold text-azul-800">{t('booking.disabled.title')}</h2>
            <p className="text-lg text-tinta-suave">{t('booking.disabled.text')}</p>
            <ButtonAnchor href={contactLinks(config).whatsapp} target="_blank" rel="noreferrer" size="lg">WhatsApp {config.contact.phoneDisplay}</ButtonAnchor>
          </div>
        ) : (
          <BookingProvider params={params.data}>
            <Steps />
          </BookingProvider>
        )}
      </Container>
    </Section>
  )
}
