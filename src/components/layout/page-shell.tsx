'use client';

import { usePathname } from 'next/navigation';
import { AppFooter } from '@/components/layout/footer';
import { AppNavbar } from '@/components/layout/navbar';
import { DEMO_PAYMENT_MESSAGE } from '@/lib/utils/constants';

export function PageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      <AppNavbar />
      {isHome ? (
        <main>{children}</main>
      ) : (
        <main className="contenido-pagina">
          <div className="panel-contenido">
            <div className="alert alert-warning" role="alert">
              {DEMO_PAYMENT_MESSAGE}
            </div>
            {children}
          </div>
        </main>
      )}
      <AppFooter />
    </>
  );
}
