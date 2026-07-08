import { render, screen } from '@testing-library/react';
import { PageShell } from '@/components/layout/page-shell';

jest.mock('next/navigation', () => ({
  usePathname: () => '/servicios',
}));

jest.mock('@/components/providers/locale-provider', () => ({
  useAppLocale: () => ({
    locale: 'es-CL',
    setLocale: jest.fn(),
  }),
}));

jest.mock('@/lib/i18n', () => ({
  useTranslations: () => ((key: string) => key),
}));

describe('PageShell', () => {
  it('renders navbar, footer and wrapped content', () => {
    render(
      <PageShell>
        <div>contenido de prueba</div>
      </PageShell>,
    );

    expect(screen.getByText('contenido de prueba')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText(/ThePit It Development/i)).toBeInTheDocument();
  });
});
