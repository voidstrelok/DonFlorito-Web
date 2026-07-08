'use client';

import { VenueMap } from '@/components/shared/google-map';
import { useTranslations } from '@/lib/i18n';

export function HomeContent() {
  const t = useTranslations();

  return (
    <div>
      <div className="welcome-div">
        <div className="welcome-bar">
          <img className="welcome-logo" src="/assets/res/logos/logo-completo-color.png" alt="Don Florito" />
        </div>
        <div className="welcome-botones text-center row g-3">
          <div className="col-lg-6">
            <a href="#como-llegar" className="btn btn-welcome btn-lg w-100">{t('como-llegar')}</a>
          </div>
          <div className="col-lg-6">
            <a href="/reservar" className="btn btn-welcome btn-lg w-100">{t('reservar')}</a>
          </div>
        </div>
      </div>
      <div className="contenido-info text-center">
        <img className="logo-info" src="/assets/res/logos/logo-nav-bar.png" alt="Logo información" />
        <hr />
        <p>{t('sobre-nosotros')}</p>
        <p className="titulo-2">{t('horario-atencion')}</p>
        <hr />
        <p className="info-home">{t('dias-atencion')}</p>
        <p>9:00 AM - 7:00 PM</p>
        <a className="info-home" href="https://www.instagram.com/complejo_don_florito/" target="_blank" rel="noreferrer"><p><i className="bi bi-instagram" /> complejo_don_florito</p></a>
        <a className="info-home" href="https://wa.me/56995278783" target="_blank" rel="noreferrer"><p><i className="bi bi-whatsapp" /> +569 9527 8783</p></a>
        <a className="info-home" href="mailto:contacto@donflorito.cl"><p><i className="bi bi-envelope" /> contacto@donflorito.cl</p></a>
        <p id="como-llegar" className="titulo-2">{t('ubicacion')}</p>
        <hr />
        <p className="info-home"><i className="bi bi-geo-alt-fill" /> Parcela 226, Quebrada Peñuelas</p>
        <div className="mapa"><VenueMap /></div>
      </div>
    </div>
  );
}
