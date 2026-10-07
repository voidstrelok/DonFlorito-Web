import clsx from 'clsx'
import { ArrowRight } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ServiceBlock } from '@/components/sections/service-block'
import { useNames } from '@/components/booking/line-label'
import { ButtonLink } from '@/components/ui/button'
import { Container, Section } from '@/components/ui/section'
import { accentClasses, bookingUrl, serviceById } from '@/content/services'
import { track } from '@/lib/analytics'
import { usePageTitle } from '@/lib/use-page-title'
import { NotFoundPage } from './not-found'

/** Detalle de una clasificación (Fútbol, Tenis...) con sus servicios y el acceso a reservar. */
export function ServiceDetailPage() {
  const { id } = useParams()
  const service = serviceById(id)
  return service ? <Detail key={service.id} service={service} /> : <NotFoundPage />
}

function Detail({ service }: { service: NonNullable<ReturnType<typeof serviceById>> }) {
  const { t } = useTranslation()
  const tn = useNames()
  const { hash } = useLocation()
  const a = accentClasses[service.accent]
  const key = `services.${service.id}`
  const title = t(`${key}.title`)
  usePageTitle(title)

  // La página se carga bajo demanda: el ancla (#slug) se resuelve una vez montada.
  const target = hash.slice(1)
  useEffect(() => {
    if (target) document.getElementById(target)?.scrollIntoView({ block: 'center' })
  }, [target])

  return (
    <>
      <div className={clsx('py-12 sm:py-16', a.solid)}>
        <Container className="flex flex-wrap items-center gap-6">
          <img src={service.illustration} alt="" className="h-24 w-auto sm:h-32" />
          <div className="min-w-0 flex-1">
            <h1 className="text-(length:--text-display) font-extrabold">{title}</h1>
            <p className="mt-2 text-lg">{t(`${key}.tagline`)}</p>
          </div>
          <ButtonLink
            to={bookingUrl(service.items.map((i) => i.tipoId))}
            variant="light"
            size="lg"
            onClick={() => track('click_reservar', { origen: `detalle_${service.id}` })}
          >
            {t('common.book')}
          </ButtonLink>
        </Container>
      </div>

      <Section className="pt-12!">
        <Container className="space-y-12">
          <section aria-labelledby="sec-items">
            <h2 id="sec-items" className="mb-4 text-2xl font-bold text-azul-800">{t('serviceDetail.choose')}</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {service.items.map((item) => (
                <li
                  key={item.slug}
                  id={item.slug}
                  className={clsx(
                    'scroll-mt-24 flex flex-col justify-between gap-5 rounded-(--radius-card) bg-white p-5 shadow-(--shadow-card) ring-2',
                    hash === `#${item.slug}` ? 'ring-naranja-500' : 'ring-transparent',
                  )}
                >
                  <h3 className={clsx('text-xl font-bold', a.text)}>{tn(item.name)}</h3>
                  <ButtonLink
                    to={bookingUrl([item.tipoId])}
                    onClick={() => track('click_reservar', { origen: `detalle_${item.slug}` })}
                    aria-label={`${t('serviceDetail.book')}: ${tn(item.name)}`}
                  >
                    {t('serviceDetail.book')} <ArrowRight aria-hidden className="size-4" />
                  </ButtonLink>
                </li>
              ))}
            </ul>
          </section>

          <ServiceBlock service={service} showHeader={false} />

          <p className="text-center">
            <Link to="/servicios" className="font-semibold text-azul-700 underline">{t('nav.allServices')}</Link>
          </p>
        </Container>
      </Section>
    </>
  )
}
