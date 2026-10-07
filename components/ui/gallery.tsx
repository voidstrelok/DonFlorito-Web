import * as Dialog from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Galería de fotos con visor ampliado (Radix Dialog: foco atrapado, Esc, aria).
 * Si no hay fotos muestra un recuadro "próximamente" en lugar de romper el layout.
 */
export function Gallery({ photos, label, max }: { photos: string[]; label: string; max?: number }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState<number | null>(null)
  const visible = max ? photos.slice(0, max) : photos

  const go = useCallback(
    (delta: number) => setOpen((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length],
  )

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, go])

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/6] items-center justify-center gap-3 rounded-(--radius-card) border-2 border-dashed border-linea bg-white text-tinta-suave">
        <ImageOff aria-hidden className="size-6" />
        <span>{t('common.comingSoon')}</span>
      </div>
    )
  }

  return (
    <Dialog.Root open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((src, i) => (
          <li key={src} className={i === 0 ? 'col-span-2 row-span-2' : ''}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group block size-full overflow-hidden rounded-2xl bg-linea"
              aria-label={`${label} ${i + 1}`}
            >
              <img
                src={src}
                alt={`${label} ${i + 1}`}
                loading="lazy"
                decoding="async"
                className="size-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none"
        >
          <Dialog.Title className="sr-only">{label}</Dialog.Title>
          {open !== null && (
            <img src={photos[open]} alt={`${label} ${open + 1}`} className="max-h-[85vh] max-w-full rounded-xl object-contain" />
          )}
          <Dialog.Close className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-tinta hover:bg-white" aria-label={t('common.close')}>
            <X className="size-5" />
          </Dialog.Close>
          {photos.length > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label={t('common.prev')} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-tinta hover:bg-white">
                <ChevronLeft className="size-6" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label={t('common.next')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-tinta hover:bg-white">
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
