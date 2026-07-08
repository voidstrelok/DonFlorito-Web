import type { Metadata } from 'next';
import { AppProviders } from '@/components/providers/app-providers';
import { PageShell } from '@/components/layout/page-shell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Complejo Deportivo Don Florito',
  description: 'Frontend Next.js para DonFlorito-API',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CL">
      <body>
        <AppProviders>
          <PageShell>{children}</PageShell>
        </AppProviders>
      </body>
    </html>
  );
}
