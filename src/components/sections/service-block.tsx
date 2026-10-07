import clsx from 'clsx'
import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Gallery } from '../ui/gallery'
import { accentClasses, photosIn, type ServiceDef } from '@/content/services'

interface Section {
  title: string
  body: string
}

/** Bloque completo de un servicio: encabezado de color, texto y galería. */
export function ServiceBlock({ service, showHeader = true, actions }: { service: ServiceDef; showHeader?: boolean; actions?: ReactNode }) {
  const { t } = useTranslation()
  const a = accentClasses[service.accent]
  const key = `services.${service.id}`
  const sections = t(`${key}.sections`, { returnObjects: true }) as Section[]
  const note = t(`${key}.note`)

  return (
    <article id={service.id} className="scroll-mt-24">
      {showHeader && (
      <header className={clsx('flex items-center gap-5 rounded-t-(--radius-card) px-6 py-5 sm:px-8', a.solid)}>
        <img src={service.illustration} alt="" className="h-16 w-auto sm:h-20" />
        <div>
          <h2 className="text-2xl font-bold sm:text-4xl">{t(`${key}.title`)}</h2>
          <p>{t(`${key}.tagline`)}</p>
          {actions}
        </div>
      </header>
      )}

      <div className={clsx('bg-white p-6 shadow-(--shadow-card) sm:p-8', showHeader ? 'rounded-b-(--radius-card)' : 'rounded-(--radius-card)')}>
        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((s) => (
            <div key={s.title}>
              <h3 className={clsx('mb-2 text-xl font-bold', a.text)}>{s.title}</h3>
              <p className="text-tinta-suave">{s.body}</p>
            </div>
          ))}
        </div>
        {note && (
          <p className={clsx('mt-6 flex items-start gap-3 rounded-xl p-4 font-medium', a.soft)}>
            <Info aria-hidden className="mt-0.5 size-5 shrink-0" />
            <span>
              <strong>{t('common.important')}:</strong> {note}
            </span>
          </p>
        )}
        <div className="mt-8">
          <Gallery photos={photosIn(service.photoFolder)} label={t(`${key}.title`)} />
        </div>
      </div>
    </article>
  )
}
