import * as Dialog from '@radix-ui/react-dialog'
import clsx from 'clsx'
import { Download, MapPinned, Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Mapa del recinto (plano con canchas, piscinas, quinchos, estacionamientos y entradas).
 * Un solo visor ampliable que se abre desde distintos puntos del sitio.
 * Las imágenes se generan con `node scripts/optimize-map.mjs` a partir de public/docs/mapa-XX.png.
 */
function MapViewer() {
  const { t } = useTranslation()
  const [zoomed, setZoomed] = useState(false)
  const tool = 'inline-flex items-center gap-2 rounded-full border border-linea bg-white px-3.5 py-2 text-sm font-semibold text-azul-800 hover:bg-azul-50'

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70" />
      <Dialog.Content
        aria-describedby={undefined}
        onCloseAutoFocus={() => setZoomed(false)}
        className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-(--radius-card) bg-white shadow-xl"
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-linea p-3 sm:px-5">
          <Dialog.Title className="mr-auto text-lg font-bold text-azul-800 sm:text-xl">{t('map.title')}</Dialog.Title>
          <button type="button" className={tool} onClick={() => setZoomed((z) => !z)} aria-pressed={zoomed}>
            {zoomed ? <ZoomOut aria-hidden className="size-4" /> : <ZoomIn aria-hidden className="size-4" />}
            {zoomed ? t('map.fit') : t('map.zoom')}
          </button>
          <a className={tool} href={t('files.map')} target="_blank" rel="noreferrer" download>
            <Download aria-hidden className="size-4" />
            {t('map.download')}
          </a>
          <Dialog.Close className="rounded-full p-2 hover:bg-azul-50" aria-label={t('common.close')}>
            <X aria-hidden className="size-5" />
          </Dialog.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-[#00b172]">
          <img
            src={t('files.mapImage')}
            alt={t('map.alt')}
            className={clsx('mx-auto block h-auto', zoomed ? 'w-[220%] max-w-none sm:w-[170%]' : 'max-h-[calc(100dvh-7.5rem)] w-full object-contain')}
            onClick={() => setZoomed((z) => !z)}
          />
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  )
}

/** Envuelve cualquier elemento (botón, enlace) para que abra el mapa. */
export function SiteMapDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <MapViewer />
    </Dialog.Root>
  )
}

/** Enlace de texto discreto: "Ver mapa del recinto". */
export function SiteMapLink({ className, label, icon = true }: { className?: string; label?: string; icon?: boolean }) {
  const { t } = useTranslation()
  return (
    <SiteMapDialog>
      <button type="button" className={clsx('inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline', className ?? 'text-azul-700')}>
        {icon && <MapPinned aria-hidden className="size-4 shrink-0" />}
        {label ?? t('map.open')}
      </button>
    </SiteMapDialog>
  )
}

/** Tarjeta con miniatura del plano; al tocarla se abre ampliado. */
/** `stacked`: imagen arriba y texto abajo, para columnas angostas (en las anchas va a un costado). */
export function SiteMapBanner({ className, stacked = false }: { className?: string; stacked?: boolean }) {
  const { t } = useTranslation()
  return (
    <SiteMapDialog>
      <button
        type="button"
        className={clsx('group grid w-full overflow-hidden rounded-(--radius-card) bg-white text-left shadow-(--shadow-card) transition-shadow hover:shadow-lg', !stacked && 'sm:grid-cols-[minmax(0,2fr)_3fr]', className)}
      >
        <span className="relative block bg-verde-600">
          <img src={t('files.mapThumb')} alt="" loading="lazy" decoding="async" width={640} height={416} className="aspect-[16/10] size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </span>
        <span className="flex flex-col justify-center gap-3 p-5 sm:p-7">
          <span className="font-display text-2xl font-bold text-azul-800">{t('map.title')}</span>
          <span className="text-tinta-suave">{t('map.text')}</span>
          <span className="inline-flex items-center gap-2 font-semibold text-azul-700">
            <Maximize2 aria-hidden className="size-4" />
            {t('map.expand')}
          </span>
        </span>
      </button>
    </SiteMapDialog>
  )
}
