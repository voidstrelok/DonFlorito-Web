'use client';

import Link from 'next/link';
import { useTranslations } from '@/lib/i18n';

export function AppFooter() {
  const t = useTranslations();

  return (
    <footer className="app-footer mt-auto">
      <div className="container py-4">
        <div className="row text-center text-lg-start align-items-center g-4">
          <div className="col-lg-3">
            <img className="logo-footer" src="/assets/res/logos/logo-blanco.png" alt="Don Florito blanco" />
          </div>
          <div className="col-lg-2 site-map">
            <h3>{t('sitio')}</h3>
            <Link href="/">{t('inicio')}</Link>
            <Link href="/servicios">{t('servicios')}</Link>
            <Link href="/contacto">{t('contacto')}</Link>
            <Link href="/mi-reserva">{t('mi-reserva')}</Link>
            <Link href="/reservar">{t('reservar')}</Link>
            <Link href="/admin">{t('admin')}</Link>
          </div>
          <div className="col-lg-2 site-map">
            <h3>{t('contactoFooter')}</h3>
            <a href="https://www.instagram.com/complejo_don_florito/" target="_blank" rel="noreferrer">
              <i className="bi bi-instagram" /> Instagram
            </a>
            <a href="https://wa.me/56995278783" target="_blank" rel="noreferrer">
              <i className="bi bi-whatsapp" /> Whatsapp
            </a>
            <a href="mailto:contacto@donflorito.cl">
              <i className="bi bi-envelope" /> Email
            </a>
          </div>
          <div className="col-lg-5 text-center text-lg-end">
            <img className="logo-webpay" src="/assets/res/logos/webpay-blanco.png" alt="Webpay" />
          </div>
        </div>
        <hr />
        <p className="thepit-firma text-center mb-0">
          <a href="https://thepit.cl" target="_blank" rel="noreferrer">
            ThePit It Development
          </a>{' '}
          - 2024
        </p>
      </div>
    </footer>
  );
}
