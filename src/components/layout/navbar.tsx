'use client';

import Link from 'next/link';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { useAppLocale } from '@/components/providers/locale-provider';
import { useTranslations } from '@/lib/i18n';

export function AppNavbar() {
  const t = useTranslations();
  const { locale, setLocale } = useAppLocale();

  return (
    <Navbar expand="lg" fixed="top" className="app-navbar px-3">
      <Navbar.Brand as={Link} href="/" className="navbar-logo-link">
        <img className="navbar-logo" src="/assets/res/logos/logo-nav-bar.png" alt="Don Florito" />
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="main-navbar" />
      <Navbar.Collapse id="main-navbar">
        <Nav className="ms-auto align-items-lg-center gap-lg-3">
          <Nav.Link as={Link} href="/servicios">{t('servicios')}</Nav.Link>
          <Nav.Link as={Link} href="/contacto">{t('contacto')}</Nav.Link>
          <Nav.Link as={Link} href="/mi-reserva">{t('mi-reserva')}</Nav.Link>
          <Nav.Link as={Link} href="/reservar" className="fw-bold">{t('reservar')}</Nav.Link>
          <NavDropdown
            title={locale === 'es-CL' ? 'Español 🇨🇱' : 'English 🇺🇸'}
            align="end"
            id="locale-selector"
          >
            <NavDropdown.Item onClick={() => setLocale(locale === 'es-CL' ? 'en-US' : 'es-CL')}>
              {locale === 'es-CL' ? 'English 🇺🇸' : 'Español 🇨🇱'}
            </NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
}
