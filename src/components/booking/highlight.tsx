import clsx from 'clsx'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Anillo de color para el servicio que la persona eligió en la ficha. */
export const highlightRing = 'ring-naranja-500'

export function HighlightBadge({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full bg-naranja-500 px-3 py-1 text-sm font-bold text-tinta', className)}>
      <Sparkles aria-hidden className="size-4" />
      {t('booking.highlight')}
    </span>
  )
}
