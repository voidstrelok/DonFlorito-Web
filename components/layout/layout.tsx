import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './header'
import { Footer } from './footer'
import { ConsentBanner } from './consent-banner'

/** Sube al inicio al cambiar de ruta, o baja al ancla (#id) si la URL trae una. */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])
  return null
}

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ConsentBanner />
      <ScrollManager />
    </div>
  )
}
