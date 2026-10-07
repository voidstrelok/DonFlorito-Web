import { useTranslation } from 'react-i18next'
import { kindOf, type CartLine } from '@/features/booking/cart'
import { timeLabel } from '@/lib/format'

/** Traduce nombres que vienen de la base de datos (en español) cuando hay versión en inglés. */
export function useNames() {
  const { t } = useTranslation()
  return (name: string) => t(`names.${name}`, { defaultValue: name })
}

/** Texto de una línea del carro: título y detalle. */
export function useLineText() {
  const { t, i18n } = useTranslation()
  const tn = useNames()
  const lang = i18n.resolvedLanguage ?? 'es-CL'
  return (l: CartLine): { title: string; detail: string } => {
    switch (kindOf(l.idTipoServicio)) {
      case 'cancha':
        return {
          title: tn(l.nombre),
          detail: `${l.horaComienzo ? timeLabel(l.horaComienzo, lang) : ''} – ${l.horaFinal ? timeLabel(l.horaFinal, lang) : ''} · ${t('booking.court.matchesCount', { count: l.cantidad })}`,
        }
      case 'piscina':
        return { title: tn(l.tipoNombre), detail: t('booking.pool.people', { count: l.cantidad }) }
      case 'quincho':
        return { title: tn(l.nombre), detail: t('booking.quincho.count', { count: l.cantidad }) }
    }
  }
}
