import * as Menu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, ChevronRight, Globe } from 'lucide-react'
import { NavLink, Link, useMatch, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { useConfig } from '@/config'
import { ButtonLink } from '../ui/button'
import { services } from '@/content/services'
import { useNames } from '../booking/line-label'
import { track } from '@/lib/analytics'
import { MobileMenu } from './mobile-menu'

const menuContent = 'z-40 min-w-56 rounded-2xl bg-white p-2 shadow-(--shadow-card) ring-1 ring-linea'
const menuItem = 'flex cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3 text-lg font-medium text-tinta outline-none data-highlighted:bg-azul-50 data-highlighted:text-azul-700 data-[state=open]:bg-azul-50'

const links = [
  { to: '/contacto', key: 'nav.contact' },
  { to: '/mi-reserva', key: 'nav.myBooking' },
] as const

/** Servicios → clasificación → servicio. Cada clasificación abre su página; cada servicio, su ancla dentro de ella. */
function ServicesMenuItems() {
  const { t } = useTranslation()
  const tn = useNames()
  const navigate = useNavigate()
  return (
    <>
      <Menu.Item onSelect={() => navigate('/servicios')} className={menuItem}>{t('nav.allServices')}</Menu.Item>
      <Menu.Separator className="my-1 h-px bg-linea" />
      {services.map((s) => (
        <Menu.Sub key={s.id}>
          <Menu.SubTrigger className={menuItem}>
            {t(`services.${s.id}.title`)}
            <ChevronRight aria-hidden className="size-4" />
          </Menu.SubTrigger>
          <Menu.Portal>
            <Menu.SubContent sideOffset={6} alignOffset={-8} className={menuContent}>
              <Menu.Item onSelect={() => navigate(`/servicios/${s.id}`)} className={clsx(menuItem, 'font-bold')}>
                {t('nav.seeAll', { name: t(`services.${s.id}.title`) })}
              </Menu.Item>
              <Menu.Separator className="my-1 h-px bg-linea" />
              {s.items.map((i) => (
                <Menu.Item key={i.slug} onSelect={() => navigate(`/servicios/${s.id}#${i.slug}`)} className={menuItem}>
                  {tn(i.name)}
                </Menu.Item>
              ))}
            </Menu.SubContent>
          </Menu.Portal>
        </Menu.Sub>
      ))}
    </>
  )
}

function ServicesNav() {
  const { t } = useTranslation()
  const active = useMatch('/servicios/*')
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        className={clsx('inline-flex items-center gap-1 rounded-full px-4 py-2 font-medium transition-colors hover:bg-azul-50 data-[state=open]:bg-azul-50', active ? 'text-azul-700 bg-azul-50' : 'text-tinta')}
      >
        {t('nav.services')}
        <ChevronDown aria-hidden className="size-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="start" sideOffset={8} className={menuContent}>
          <ServicesMenuItems />
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}

export function Header() {
  const { t, i18n } = useTranslation()
  const { brand, features } = useConfig()
  const other = i18n.resolvedLanguage === 'en-US' ? 'es-CL' : 'en-US'

  return (
    <header className="sticky top-0 z-30 border-b border-linea bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Link to="/" className="min-w-0 shrink" aria-label={brand.name}>
          <img src="/brand/logo-nav-bar.png" alt={brand.name} className="h-6 w-auto max-w-full min-[420px]:h-8 sm:h-10" />
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Principal">
          <ServicesNav />
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                clsx('rounded-full px-4 py-2 font-medium transition-colors hover:bg-azul-50', isActive ? 'text-azul-700 bg-azul-50' : 'text-tinta')
              }
            >
              {t(l.key)}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          {features.english && (
            <button
              type="button"
              onClick={() => i18n.changeLanguage(other)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-tinta hover:bg-azul-50"
              aria-label={t('nav.language')}
            >
              <Globe aria-hidden className="size-4" />
              {other === 'en-US' ? 'EN' : 'ES'}
            </button>
          )}
          <ButtonLink to="/reservar" variant="primary" className="max-sm:hidden" onClick={() => track('click_reservar', { origen: 'header' })}>
            {t('nav.book')}
          </ButtonLink>

          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
