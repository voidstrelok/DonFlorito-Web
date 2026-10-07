import { useEffect } from 'react'
import { useConfig } from '@/config'

/** Título de pestaña por página: "Página · Nombre del complejo". */
export function usePageTitle(title?: string) {
  const { brand } = useConfig()
  useEffect(() => {
    document.title = title ? `${title} · ${brand.name}` : brand.name
  }, [title, brand.name])
}
