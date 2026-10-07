import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/layout'
import { HomePage } from '@/pages/home'

// Las demás páginas se cargan bajo demanda para mantener liviana la portada.
const ServicesPage = lazy(() => import('@/pages/services').then((m) => ({ default: m.ServicesPage })))
const ServiceDetailPage = lazy(() => import('@/pages/service-detail').then((m) => ({ default: m.ServiceDetailPage })))
const ContactPage = lazy(() => import('@/pages/contact').then((m) => ({ default: m.ContactPage })))
const BookingPage = lazy(() => import('@/pages/booking').then((m) => ({ default: m.BookingPage })))
const MyBookingPage = lazy(() => import('@/pages/my-booking').then((m) => ({ default: m.MyBookingPage })))
const AdminPage = lazy(() => import('@/pages/admin').then((m) => ({ default: m.AdminPage })))
const NotFoundPage = lazy(() => import('@/pages/not-found').then((m) => ({ default: m.NotFoundPage })))

export function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="servicios" element={<ServicesPage />} />
          <Route path="servicios/:id" element={<ServiceDetailPage />} />
          <Route path="contacto" element={<ContactPage />} />
          <Route path="reservar/*" element={<BookingPage />} />
          <Route path="mi-reserva/:id?" element={<MyBookingPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
