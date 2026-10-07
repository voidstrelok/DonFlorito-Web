import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { parseIsoDay } from '@/features/booking/dates'
import { longDay, shortMonth, shortWeekday } from '@/lib/format'

/** Franja horizontal de días. Un toque elige el día (sin calendario emergente). */
export function DateStrip({ days, value, onChange }: { days: string[]; value: string | null; onChange: (iso: string) => void }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'es-CL'
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scroller.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [value])

  const nudge = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * 280, behavior: 'smooth' })
  const arrow = 'hidden size-10 shrink-0 items-center justify-center rounded-full border border-linea bg-white text-azul-700 hover:bg-azul-50 sm:flex'

  return (
    <div className="flex items-center gap-2">
      <button type="button" className={arrow} onClick={() => nudge(-1)} aria-label={t('common.prev')}>
        <ChevronLeft aria-hidden className="size-5" />
      </button>
      <div ref={scroller} className="-mx-4 flex flex-1 snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0" role="group" aria-label={t('booking.date.title')}>
        {days.map((iso, i) => {
          const d = parseIsoDay(iso)
          const selected = iso === value
          const newMonth = i === 0 || parseIsoDay(days[i - 1]).getMonth() !== d.getMonth()
          return (
            <button
              key={iso}
              type="button"
              aria-pressed={selected}
              aria-label={longDay(d, lang)}
              onClick={() => onChange(iso)}
              className={clsx(
                'flex min-h-20 w-16 shrink-0 snap-center flex-col items-center justify-center rounded-2xl border-2 px-2 py-2 transition-colors',
                selected ? 'border-azul-600 bg-azul-600 text-white' : 'border-linea bg-white hover:border-azul-300',
              )}
            >
              <span className="text-xs font-semibold uppercase tracking-wide opacity-80">{shortWeekday(d, lang)}</span>
              <span className="font-display text-2xl font-bold leading-none">{d.getDate()}</span>
              <span className={clsx('text-xs', newMonth ? 'font-bold' : 'opacity-70')}>{shortMonth(d, lang)}</span>
            </button>
          )
        })}
      </div>
      <button type="button" className={arrow} onClick={() => nudge(1)} aria-label={t('common.next')}>
        <ChevronRight aria-hidden className="size-5" />
      </button>
    </div>
  )
}
