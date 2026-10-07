import { Clock, Mail, MapPin, MessageCircle } from 'lucide-react'
import { InstagramIcon } from '@/components/ui/icons'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfig } from '@/config'
import { contactLinks } from '@/lib/contact'
import { usePageTitle } from '@/lib/use-page-title'
import { MapView } from '@/components/ui/map-view'
import { SiteMapBanner } from '@/components/ui/site-map'
import { Container, Section } from '@/components/ui/section'

function Card({ icon, label, children, href }: { icon: ReactNode; label: string; children: ReactNode; href?: string }) {
  const inner = (
    <>
      <span className="flex size-11 items-center justify-center rounded-full bg-azul-50 text-azul-700">{icon}</span>
      <span>
        <span className="block text-sm font-semibold uppercase tracking-wide text-tinta-suave">{label}</span>
        <span className="text-lg font-medium text-azul-800">{children}</span>
      </span>
    </>
  )
  const cls = 'flex items-center gap-4 rounded-(--radius-card) bg-white p-5 shadow-(--shadow-card)'
  return href ? (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={`${cls} transition-transform hover:-translate-y-0.5`}>{inner}</a>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

export function ContactPage() {
  const { t, i18n } = useTranslation()
  const config = useConfig()
  usePageTitle(t('nav.contact'))
  const links = contactLinks(config)
  const hoursText = config.hours.text[i18n.resolvedLanguage ?? 'es-CL'] ?? Object.values(config.hours.text)[0]

  return (
    <>
      <div className="bg-azul-800 py-14 text-white sm:py-20">
        <Container>
          <h1 className="text-(length:--text-display) font-extrabold">{t('contactPage.title')}</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/85">{t('contactPage.subtitle')}</p>
        </Container>
      </div>
      <Section className="pt-12!">
        <Container className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <Card icon={<MessageCircle aria-hidden />} label={t('contactPage.whatsapp')} href={links.whatsapp}>{config.contact.phoneDisplay}</Card>
            <Card icon={<Mail aria-hidden />} label={t('contactPage.email')} href={links.email}>{config.contact.email}</Card>
            {links.instagram && <Card icon={<InstagramIcon className="size-5" />} label={t('contactPage.instagram')} href={links.instagram}>@{config.social.instagram}</Card>}
            <Card icon={<MapPin aria-hidden />} label={t('contactPage.address')}>{config.contact.address}</Card>
            <Card icon={<Clock aria-hidden />} label={t('contactPage.hours')}>{hoursText}</Card>
          </div>
          <MapView className="min-h-96" />
          <div className="lg:col-span-2"><SiteMapBanner /></div>
        </Container>
      </Section>
    </>
  )
}
