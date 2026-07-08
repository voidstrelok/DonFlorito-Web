import { useTranslations as useIntlTranslations } from 'next-intl';

export const LOCALES = ['es-CL', 'en-US'] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = 'es-CL';

export function isLocale(value: string | null | undefined): value is AppLocale {
  return value === 'es-CL' || value === 'en-US';
}

export function useTranslations() {
  return useIntlTranslations();
}
