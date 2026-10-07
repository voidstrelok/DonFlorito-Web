import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Menu as MenuIcon, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { services } from '@/content/services'
import { track } from '@/lib/analytics'

const row = 'block rounded-xl px-4 py-3 text-lg font-medium text-tinta active:bg-azul-50'

/** Menú de móvil: panel a pantalla completa (sin menús flotantes ni submenús que se salgan de la pantalla). */
export function MobileMenu() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="rounded-full p-2 text-azul-700 hover:bg-azul-50 lg:hidden" aria-label={t('nav.menu')}>
        <MenuIcon className="size-6" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-azul-900/50 lg:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl outline-none lg:hidden"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-linea px-4">
            <Dialog.Title className="font-display text-xl font-bold text-azul-800">{t('nav.menu')}</Dialog.Title>
            <Dialog.Close className="rounded-full p-2 text-azul-700 hover:bg-azul-50" aria-label={t('nav.menu')}>
              <X className="size-6" />
            </Dialog.Close>
          </div>

          <nav aria-label="Principal" className="flex-1 overflow-y-auto overscroll-contain p-3">
            <Link to="/" onClick={close} className={row}>{t('nav.home')}</Link>
            <Link to="/servicios" onClick={close} className={row}>{t('nav.services')}</Link>
            <ul className="mb-1 ml-4 border-l-2 border-linea">
              {services.map((s) => (
                <li key={s.id}>
                  <Link to={`/servicios/${s.id}`} onClick={close} className={clsx(row, 'py-2.5 text-base text-tinta-suave')}>
                    {t(`services.${s.id}.title`)}
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/contacto" onClick={close} className={row}>{t('nav.contact')}</Link>
            <Link to="/mi-reserva" onClick={close} className={row}>{t('nav.myBooking')}</Link>
          </nav>

          <div className="shrink-0 border-t border-linea p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Link
              to="/reservar"
              onClick={() => { track('click_reservar', { origen: 'menu_movil' }); close() }}
              className="flex w-full items-center justify-center rounded-full bg-verde-600 px-6 py-3.5 text-lg font-bold text-white hover:bg-verde-700"
            >
              {t('nav.book')}
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
