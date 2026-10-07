import { MapPin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfig } from '@/config'
import { buttonClass } from './button'

let mapsPromise: Promise<void> | null = null

/**
 * Carga la API de Google Maps. Con loading=async hay que esperar el callback de Google: el evento
 * onload del script llega antes de que exista google.maps.importLibrary.
 */
function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof google !== "undefined" && typeof (google.maps as Partial<typeof google.maps> | undefined)?.importLibrary === "function") return Promise.resolve()
  mapsPromise ??= new Promise((resolve, reject) => {
    ;(window as unknown as { __dfMapsReady?: () => void }).__dfMapsReady = () => resolve()
    const s = document.createElement("script")
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&callback=__dfMapsReady`
    s.async = true
    s.onerror = () => {
      mapsPromise = null
      reject(new Error("No se pudo cargar Google Maps"))
    }
    document.head.appendChild(s)
  })
  return mapsPromise
}

/**
 * Mapa de Google si hay `maps.apiKey` en la config; si no (o si falla la carga),
 * muestra una tarjeta con enlace a Google Maps, que funciona sin clave.
 */
export function MapView({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  const { maps, contact } = useConfig()
  const ref = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const link = `https://www.google.com/maps/search/?api=1&query=${maps.marker.lat},${maps.marker.lng}`

  useEffect(() => {
    if (!maps.apiKey || !ref.current) return
    let cancelled = false
    // Google avisa por esta función global si la clave no es válida o el dominio no está autorizado.
    ;(window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
      console.error("Google Maps rechazó la clave: revisa las restricciones de dominio (referrer) en Google Cloud.")
      if (!cancelled) setFailed(true)
    }
    ;(async () => {
      await loadGoogleMaps(maps.apiKey)
      // Con loading=async las clases no existen hasta importarlas.
      const { Map } = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary
      const markers = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary
      if (cancelled || !ref.current) return
      const map = new Map(ref.current, {
        center: maps.center,
        zoom: maps.zoom,
        mapTypeId: "hybrid",
        ...(maps.mapId ? { mapId: maps.mapId } : {}),
      })
      if (maps.mapId) new markers.AdvancedMarkerElement({ map, position: maps.marker })
      else new markers.Marker({ map, position: maps.marker })
    })().catch((e) => {
      console.error("No se pudo mostrar Google Maps:", e)
      if (!cancelled) setFailed(true)
    })
    return () => {
      cancelled = true
    }
  }, [maps])

  if (!maps.apiKey || failed) {
    return (
      <div className={`flex flex-col items-center justify-center gap-4 rounded-(--radius-card) bg-azul-50 p-8 text-center ${className}`}>
        <MapPin aria-hidden className="size-10 text-rojo-600" />
        <p className="font-medium text-azul-800">{contact.address}</p>
        <a href={link} target="_blank" rel="noreferrer" className={buttonClass('brand')}>
          {t('common.openMap')}
        </a>
      </div>
    )
  }

  return <div ref={ref} role="region" aria-label={contact.address} className={`overflow-hidden rounded-(--radius-card) bg-linea ${className}`} />
}
