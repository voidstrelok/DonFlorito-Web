'use client';

import { ServicesCarousel } from '@/components/shared/services-carousel';
import { useTranslations } from '@/lib/i18n';

const SECTIONS = [
  { titleKey: 'canchas-de-futbol', icon: '/assets/res/florito/futbol.png', descKey: 'desc-canchas', folder: 'canchas', max: 6, color: '#0e8937' },
  { titleKey: 'canchas-de-tenis', icon: '/assets/res/florito/tenis.png', descKey: 'desc-tenis', folder: 'canchas', max: 6, color: '#DC7E4E' },
  { titleKey: 'piscinas', icon: '/assets/res/florito/piscina.png', descKey: 'desc-piscinas', folder: 'piscinas', max: 8, color: '#3FBFEF' },
  { titleKey: 'quinchos', icon: '/assets/res/florito/quinchos.png', descKey: 'desc-quinchos', folder: 'quinchos', max: 7, color: '#d03543' },
] as const;

export function ServicesContent() {
  const t = useTranslations();

  return (
    <div>
      {SECTIONS.map((section) => (
        <section key={section.titleKey} className="mb-5">
          <div className="boton-servicios hstack" style={{ backgroundColor: section.color }}>
            <div className="col-lg-2"><img src={section.icon} alt={t(section.titleKey)} /></div>
            <div className="col-lg-10"><h1>{t(section.titleKey)}</h1></div>
          </div>
          <div className="texto-servicios" dangerouslySetInnerHTML={{ __html: t(section.descKey) }} />
          <ServicesCarousel folder={section.folder} max={section.max} alt={t(section.titleKey)} />
        </section>
      ))}
    </div>
  );
}
