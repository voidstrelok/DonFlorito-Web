'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import enUS from '@/lib/i18n/messages/en-US.json';
import esCL from '@/lib/i18n/messages/es-CL.json';
import { DEFAULT_LOCALE, type AppLocale, isLocale } from '@/lib/i18n';
import { getStoredLocale, setStoredLocale } from '@/lib/utils/storage';

const messages = {
  'es-CL': esCL,
  'en-US': enUS,
};

interface LocaleContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => {
    const stored = getStoredLocale();
    return stored && isLocale(stored) ? stored : DEFAULT_LOCALE;
  });

  useEffect(() => {
    setStoredLocale(locale);
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: (nextLocale: AppLocale) => {
        setLocaleState(nextLocale);
        setStoredLocale(nextLocale);
      },
    }),
    [locale],
  );

  return (
    <LocaleContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="America/Santiago">
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useAppLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useAppLocale must be used inside LocaleProvider');
  }
  return context;
}
