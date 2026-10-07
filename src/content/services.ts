/**
 * Catálogo de servicios y fotos.
 *
 * Para agregar fotos: soltar los archivos en src/content/photos/<carpeta>/
 * (jpg, png, webp o avif). Se ordenan por nombre de archivo; se recomienda
 * prefijar con 01-, 02-... No hace falta tocar código.
 * Carpeta `general` = fotos del complejo (portada y galería del home).
 */
const files = import.meta.glob('./photos/**/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export function photosIn(folder: string): string[] {
  return Object.entries(files)
    .filter(([path]) => path.startsWith(`./photos/${folder}/`))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([, url]) => url)
}

export type Accent = 'verde' | 'naranja' | 'celeste' | 'rojo'

/** Servicio reservable dentro de una clasificación (p. ej. "Fútbol 1" dentro de Fútbol). */
export interface ServiceItem {
  /** Ancla en la página de la clasificación */
  slug: string
  /** Nombre en la base de datos (se traduce con `names.*`) */
  name: string
  /** TipoServicio que se destaca en la reserva */
  tipoId: number
}

export interface ServiceDef {
  id: 'canchas' | 'tenis' | 'piscinas' | 'quinchos'
  accent: Accent
  /** Ilustración de Florito en /public/brand */
  illustration: string
  /** Carpeta dentro de src/content/photos */
  photoFolder: string
  items: ServiceItem[]
}

export const services: ServiceDef[] = [
  {
    id: 'canchas',
    accent: 'verde',
    illustration: '/brand/futbol.png',
    photoFolder: 'canchas',
    items: [
      { slug: 'futbol-1', name: 'Fútbol 1', tipoId: 1 },
      { slug: 'futbol-2', name: 'Fútbol 2', tipoId: 2 },
      { slug: 'futbolito', name: 'Futbolito', tipoId: 3 },
    ],
  },
  {
    id: 'tenis',
    accent: 'naranja',
    illustration: '/brand/tenis.png',
    photoFolder: 'tenis',
    items: [
      { slug: 'tenis-2', name: 'Tenis 2 Personas', tipoId: 4 },
      { slug: 'tenis-4', name: 'Tenis 4 Personas', tipoId: 5 },
    ],
  },
  {
    id: 'piscinas',
    accent: 'celeste',
    illustration: '/brand/piscina.png',
    photoFolder: 'piscinas',
    items: [
      { slug: 'piscina-general', name: 'Piscina General', tipoId: 7 },
      { slug: 'piscina-adulto-mayor', name: 'Piscina Adulto Mayor', tipoId: 8 },
    ],
  },
  {
    id: 'quinchos',
    accent: 'rojo',
    illustration: '/brand/quinchos.png',
    photoFolder: 'quinchos',
    items: [
      { slug: 'quincho-canchas', name: 'Quinchos Zona Canchas', tipoId: 6 },
      { slug: 'quincho-piscinas', name: 'Quinchos Zona Piscinas', tipoId: 6 },
    ],
  },
]

export const serviceById = (id: string | undefined) => services.find((s) => s.id === id)

/** URL de reserva que destaca uno o más tipos de servicio. */
export const bookingUrl = (tipoIds: number[]) => `/reservar?destacar=${[...new Set(tipoIds)].join(',')}`

/** Clases por acento (escritas completas para que Tailwind las detecte). */
export const accentClasses: Record<Accent, { solid: string; soft: string; text: string }> = {
  verde: { solid: 'bg-verde-600 text-white', soft: 'bg-verde-50', text: 'text-verde-700' },
  naranja: { solid: 'bg-naranja-500 text-tinta', soft: 'bg-naranja-100', text: 'text-naranja-700' },
  celeste: { solid: 'bg-celeste-500 text-tinta', soft: 'bg-celeste-100', text: 'text-celeste-700' },
  rojo: { solid: 'bg-rojo-600 text-white', soft: 'bg-rojo-50', text: 'text-rojo-700' },
}
