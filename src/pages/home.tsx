import clsx from 'clsx'
import { ArrowRight, Clock, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useConfig } from '@/config'
import { accentClasses, photosIn, services } from '@/content/services'
import { track } from '@/lib/analytics'
import { usePageTitle } from '@/lib/use-page-title'
import { ButtonLink } from '@/components/ui/button'
import { SiteMapBanner } from '@/components/ui/site-map'
import { Gallery } from '@/components/ui/gallery'
import { MapView } from '@/components/ui/map-view'
import { Container, Section, SectionTitle } from '@/components/ui/section'

export function HomePage() {
  const { t, i18n } = useTranslation()
  const { hours, contact } = useConfig()
  usePageTitle()
  const general = photosIn('general')
  // Con pocas fotos generales (hoy solo la portada) la galería se completa con fotos de los servicios.
  const gallery = general.length >= 4 ? general : [...general, ...services.flatMap((s) => photosIn(s.photoFolder).slice(0, 2))].slice(0, 8)
  const hero = general[0]
  const hoursText = hours.text[i18n.resolvedLanguage ?? 'es-CL'] ?? Object.values(hours.text)[0]

  return (
    <>
      <section className="relative isolate overflow-hidden bg-azul-900 text-white">
        {hero && <img src={hero} alt="" className="absolute inset-0 -z-20 size-full object-cover" fetchPriority="high" />}
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-azul-900/90 via-azul-900/60 to-azul-900/10" />
        <Container className="py-24 sm:py-36 lg:py-44">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-verde-200">{t('home.eyebrow')}</p>
          <h1 className="max-w-3xl text-(length:--text-display) font-extrabold">{t('home.title')}</h1>
          <p className="mt-6 max-w-xl text-lg text-white/90 sm:text-xl">{t('home.subtitle')}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <ButtonLink to="/reservar" size="lg" onClick={() => track('click_reservar', { origen: 'hero' })}>
              {t('common.book')}
            </ButtonLink>
            <ButtonLink to="/contacto" size="lg" variant="light">
              {t('common.howToGet')}
            </ButtonLink>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <SectionTitle>{t('home.servicesTitle')}</SectionTitle>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => {
              const a = accentClasses[s.accent]
              const cover = photosIn(s.photoFolder)[0]
              return (
                <li key={s.id}>
                  <Link to={`/servicios/${s.id}`} className="group flex h-full flex-col overflow-hidden rounded-(--radius-card) bg-white shadow-(--shadow-card) transition-transform hover:-translate-y-1">
                    <div className={clsx('relative flex h-40 items-end justify-end overflow-hidden', a.soft)}>
                      {cover && <img src={cover} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                      <img src={s.illustration} alt="" className="relative mr-3 h-24 w-auto drop-shadow-lg" />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className={clsx('text-xl font-bold', a.text)}>{t(`services.${s.id}.title`)}</h3>
                      <p className="mt-1 flex-1 text-tinta-suave">{t(`services.${s.id}.tagline`)}</p>
                      <span className="mt-4 inline-flex items-center gap-1 font-semibold text-azul-700">
                        {t('common.learnMore')} <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Container>
      </Section>

      <Section className="bg-white">
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionTitle className="mb-6">{t('home.aboutTitle')}</SectionTitle>
            <p className="text-lg text-tinta-suave">{t('home.about')}</p>
          </div>
          <img src="/brand/florito.png" alt="" className="mx-auto max-h-80 w-auto" loading="lazy" />
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionTitle>{t('home.galleryTitle')}</SectionTitle>
          <Gallery photos={gallery} label={t('home.galleryTitle')} max={8} />
        </Container>
      </Section>

      <Section className="bg-azul-50">
        <Container className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <SectionTitle className="mb-0">{t('home.locationTitle')}</SectionTitle>
            <p className="flex items-start gap-3 text-lg"><MapPin aria-hidden className="mt-1 size-5 shrink-0 text-rojo-600" />{contact.address}</p>
            <p className="flex items-start gap-3 text-lg"><Clock aria-hidden className="mt-1 size-5 shrink-0 text-azul-600" />{hoursText}</p>
            <SiteMapBanner stacked />
          </div>
          <MapView className="min-h-80" />
        </Container>
      </Section>
    </>
  )
}
