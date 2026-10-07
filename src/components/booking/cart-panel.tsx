import * as Dialog from '@radix-ui/react-dialog'
import { ChevronUp, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cartTotal, lineTotal, type CartLine } from '@/features/booking/cart'
import { parseIsoDay } from '@/features/booking/dates'
import { useBooking } from '@/features/booking/state'
import { longDay, money } from '@/lib/format'
import { Button } from '../ui/button'
import { useLineText } from './line-label'

export function CartLines({ lines, onRemove }: { lines: CartLine[]; onRemove?: (idTipo: number) => void }) {
  const { t } = useTranslation()
  const text = useLineText()
  return (
    <ul className="divide-y divide-linea">
      {lines.map((l) => {
        const { title, detail } = text(l)
        return (
          <li key={l.idTipoServicio} className="flex items-start gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-tinta-suave">{detail}</p>
            </div>
            <p className="font-semibold tabular-nums">{money(lineTotal(l))}</p>
            {onRemove && (
              <button type="button" onClick={() => onRemove(l.idTipoServicio)} aria-label={`${t('booking.cart.remove')}: ${title}`} className="rounded-full p-2 text-tinta-suave hover:bg-rojo-50 hover:text-rojo-700">
                <Trash2 aria-hidden className="size-4" />
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function DayLine() {
  const { t, i18n } = useTranslation()
  const { draft } = useBooking()
  if (!draft.fecha) return null
  return (
    <p className="text-sm text-tinta-suave">
      {t('booking.cart.day')}: <span className="inline-block font-semibold text-tinta first-letter:uppercase">{longDay(parseIsoDay(draft.fecha), i18n.resolvedLanguage ?? 'es-CL')}</span>
    </p>
  )
}

/** Resumen fijo a la derecha en pantallas anchas. */
export function CartSidebar({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation()
  const { draft, dispatch } = useBooking()
  const total = cartTotal(draft.lines)
  return (
    <aside aria-label={t('booking.cart.title')} className="sticky top-24 hidden self-start space-y-4 rounded-(--radius-card) bg-white p-6 shadow-(--shadow-card) lg:block">
      <h2 className="text-xl font-bold text-azul-800">{t('booking.cart.title')}</h2>
      <DayLine />
      {draft.lines.length === 0 ? (
        <p className="py-6 text-center text-tinta-suave">{t('booking.cart.empty')}</p>
      ) : (
        <CartLines lines={draft.lines} onRemove={(id) => dispatch({ type: 'remove', idTipoServicio: id })} />
      )}
      <div className="flex items-baseline justify-between border-t border-linea pt-4">
        <span className="font-semibold">{t('booking.cart.total')}</span>
        <span className="font-display text-3xl font-extrabold text-azul-800 tabular-nums">{money(total)}</span>
      </div>
      <Button variant="primary" size="lg" className="w-full" disabled={draft.lines.length === 0} onClick={onContinue}>
        {t('booking.cart.continue')}
      </Button>
    </aside>
  )
}

/** Barra inferior fija en móvil, con detalle desplegable. */
export function CartBar({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation()
  const { draft, dispatch } = useBooking()
  const total = cartTotal(draft.lines)
  const n = draft.lines.length
  if (n === 0) return null
  return (
    <Dialog.Root>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-linea bg-white/95 p-3 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.25)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <Dialog.Trigger className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-1 text-left" aria-label={t('booking.cart.viewDetail')}>
            <ChevronUp aria-hidden className="size-5 shrink-0 text-azul-700" />
            <span className="min-w-0">
              <span className="block text-xs text-tinta-suave">{t('booking.cart.items', { count: n })}</span>
              <span className="block font-display text-xl font-extrabold text-azul-800 tabular-nums">{money(total)}</span>
            </span>
          </Dialog.Trigger>
          <Button variant="primary" onClick={onContinue}>{t('booking.cart.continue')}</Button>
        </div>
      </div>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content aria-describedby={undefined} className="fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-3xl bg-white p-6">
          <div className="mb-2 flex items-center justify-between">
            <Dialog.Title className="text-xl font-bold text-azul-800">{t('booking.cart.title')}</Dialog.Title>
            <Dialog.Close className="rounded-full p-2 hover:bg-azul-50" aria-label={t('common.close')}><X aria-hidden className="size-5" /></Dialog.Close>
          </div>
          <DayLine />
          <CartLines lines={draft.lines} onRemove={(id) => dispatch({ type: 'remove', idTipoServicio: id })} />
          <div className="mt-2 flex items-baseline justify-between border-t border-linea pt-4">
            <span className="font-semibold">{t('booking.cart.total')}</span>
            <span className="font-display text-2xl font-extrabold text-azul-800 tabular-nums">{money(total)}</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
