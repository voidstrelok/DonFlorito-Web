import { Mail, MessageCircle } from 'lucide-react'
import { InstagramIcon } from '../ui/icons'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useConfig } from '@/config'
import { contactLinks } from '@/lib/contact'
import { Container } from '../ui/section'
import { SiteMapLink } from '../ui/site-map'

export function Footer() {
  const { t } = useTranslation()
  const config = useConfig()
  const links = contactLinks(config)
  const item = 'inline-flex items-center gap-2 py-1 text-white/85 hover:text-white'

  return (
    <footer className="bg-azul-900 text-white">
      <Container className="grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <img src="/brand/logo-blanco.png" alt={config.brand.name} className="w-48" />
        </div>

        <nav aria-label={t('footer.site')}>
          <h3 className="mb-3 text-lg font-bold">{t('footer.site')}</h3>
          <ul>
            {[['/', 'nav.home'], ['/servicios', 'nav.services'], ['/contacto', 'nav.contact'], ['/mi-reserva', 'nav.myBooking'], ['/reservar', 'nav.book']].map(([to, key]) => (
              <li key={to}><Link to={to} className={item}>{t(key)}</Link></li>
            ))}
            <li><SiteMapLink icon={false} className="py-1 text-white/85 hover:text-white" /></li>
            {config.features.admin && <li><Link to="/admin" className={item}>{t('nav.admin')}</Link></li>}
          </ul>
        </nav>

        <div>
          <h3 className="mb-3 text-lg font-bold">{t('footer.contact')}</h3>
          <ul>
            <li><a href={links.whatsapp} target="_blank" rel="noreferrer" className={item}><MessageCircle aria-hidden className="size-4" />{config.contact.phoneDisplay}</a></li>
            <li><a href={links.email} className={item}><Mail aria-hidden className="size-4" />{config.contact.email}</a></li>
            {links.instagram && <li><a href={links.instagram} target="_blank" rel="noreferrer" className={item}><InstagramIcon className="size-4" />Instagram</a></li>}
            <li><a href={t('files.terms')} target="_blank" rel="noreferrer" className={item}>{t('footer.terms')}</a></li>
          </ul>
        </div>

        <div className="md:text-right">
          <img src="/brand/webpay-blanco.png" alt="Webpay" className="h-12 w-auto md:ml-auto" />
        </div>
      </Container>
      <div className="border-t border-white/15 py-5 text-center text-sm text-white/70">
        © {new Date().getFullYear()} {config.brand.name} · {t('footer.rights')} · {t('footer.madeBy')}{' '}
        <a href="https://thepit.cl" target="_blank" rel="noreferrer" className="underline">ThePit It Development</a>
      </div>
    </footer>
  )
}
