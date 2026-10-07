import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNames } from '@/components/booking/line-label'
import { ServiceBlock } from '@/components/sections/service-block'
import { ButtonLink } from '@/components/ui/button'
import { Container, Section } from '@/components/ui/section'
import { SiteMapBanner } from '@/components/ui/site-map'
import { bookingUrl, services, type ServiceDef } from '@/content/services'
import { track } from '@/lib/analytics'
import { usePageTitle } from '@/lib/use-page-title'

/** Un botón de reserva por servicio: lleva directo a reservar con ese servicio destacado. */
function BookButtons({ service }: { service: ServiceDef }) {
  const { t } = useTranslation()
  const tn = useNames()
  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide">{t('servicesPage.bookTitle')}</p>
      <ul className="flex flex-wrap gap-2">
        {service.items.map((item) => (
          <li key={item.slug}>
            <ButtonLink
              to={bookingUrl([item.tipoId])}
              variant="light"
              aria-label={`${t('servicesPage.bookAria')}: ${tn(item.name)}`}
              onClick={() => track('click_reservar', { origen: `servicios_${item.slug}` })}
            >
              {tn(item.name)} <ArrowRight aria-hidden className="size-4" />
            </ButtonLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ServicesPage() {
  const { t } = useTranslation()
  usePageTitle(t('nav.services'))

  return (
    <>
      <div className="bg-azul-800 py-14 text-white sm:py-20">
        <Container>
          <h1 className="text-(length:--text-display) font-extrabold">{t('servicesPage.title')}</h1>
          <p className="mt-3 text-lg text-white/85">{t('servicesPage.subtitle')}</p>
        </Container>
      </div>
      <Section className="pt-12!">
        <Container className="space-y-14">
          <SiteMapBanner />
          {services.map((s) => (
            <ServiceBlock key={s.id} service={s} actions={<BookButtons service={s} />} />
          ))}
          <div className="text-center">
            <ButtonLink to="/reservar" size="lg">{t('common.book')}</ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  )
}
