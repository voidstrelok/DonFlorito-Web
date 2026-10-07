import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '@/api'
import { kindOf, TIPO } from '@/features/booking/cart'
import { toApiDate } from '@/features/booking/dates'
import { useAsync } from '@/lib/use-async'
import { Alert, Spinner } from '../ui/form'
import { ButtonAnchor } from '../ui/button'
import { useConfig } from '@/config'
import { contactLinks } from '@/lib/contact'
import { CourtCard } from './court-card'
import { PoolCard } from './pool-card'
import { QuinchoCard } from './quincho-card'

/** Servicios disponibles para el día elegido, agrupados como los piensa el cliente. */
export function ServiceList({ fecha, highlight = [] }: { fecha: string; highlight?: number[] }) {
  const { t } = useTranslation()
  const config = useConfig()
  const catalogo = useAsync(() => api.getCatalogo(toApiDate(fecha)), [fecha])
  const key = highlight.join(',')

  // Lleva la vista al servicio elegido en la ficha, una vez que ya está en pantalla.
  const ready = Boolean(catalogo.data)
  useEffect(() => {
    if (ready && key) document.querySelector('[data-highlight="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [ready, key])

  if (catalogo.loading && !catalogo.data) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label={t('booking.loading')}>
        {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-(--radius-card) bg-white/80" />)}
      </div>
    )
  }
  if (catalogo.error) {
    return (
      <Alert tone="error">
        {t('booking.loadError')}{' '}
        <button type="button" className="font-semibold underline" onClick={catalogo.reload}>{t('booking.retry')}</button>
      </Alert>
    )
  }

  const tipos = catalogo.data ?? []
  const canchas = tipos.filter((x) => kindOf(x.id) === 'cancha' && x.servicio.length > 0)
  const general = tipos.find((x) => x.id === TIPO.PiscinaGeneral)
  const senior = tipos.find((x) => x.id === TIPO.PiscinaAM)
  const quincho = tipos.find((x) => x.id === TIPO.Quincho && x.servicio.length > 0)

  if (canchas.length === 0 && !general && !senior && !quincho) {
    return <Alert tone="warning">{t('booking.services.empty')}</Alert>
  }

  return (
    <div className="space-y-8">
      {catalogo.loading && <p className="flex items-center gap-2 text-tinta-suave"><Spinner /> {t('booking.loading')}</p>}
      {canchas.length > 0 && (
        <section aria-labelledby="sec-canchas">
          <h2 id="sec-canchas" className="mb-3 text-2xl font-bold text-azul-800">{t('booking.services.courts')}</h2>
          <ul className="space-y-3">{canchas.map((x) => <CourtCard key={`${x.id}-${fecha}`} tipo={x} fecha={fecha} highlight={highlight.includes(x.id)} />)}</ul>
        </section>
      )}
      {(general || senior) && (
        <section aria-labelledby="sec-piscina">
          <h2 id="sec-piscina" className="mb-3 text-2xl font-bold text-azul-800">{t('booking.services.pool')}</h2>
          <ul><PoolCard general={general} senior={senior} highlight={[general, senior].some((x) => x && highlight.includes(x.id))} /></ul>
        </section>
      )}
      {quincho && (
        <section aria-labelledby="sec-quincho">
          <h2 id="sec-quincho" className="mb-3 text-2xl font-bold text-azul-800">{t('booking.services.quincho')}</h2>
          <ul><QuinchoCard tipo={quincho} highlight={highlight.includes(quincho.id)} /></ul>
        </section>
      )}
      <Alert tone="info" className="items-center">
        <span className="flex flex-wrap items-center justify-between gap-3">
          {t('booking.services.special')}
          <ButtonAnchor href={contactLinks(config).whatsapp} target="_blank" rel="noreferrer" variant="outline">WhatsApp</ButtonAnchor>
        </span>
      </Alert>
    </div>
  )
}
