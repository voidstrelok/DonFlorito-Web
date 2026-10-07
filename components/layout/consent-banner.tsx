import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfig } from '@/config'
import { needsConsentBanner, setConsent } from '@/lib/analytics'
import { Button } from '../ui/button'

export function ConsentBanner() {
  const { t } = useTranslation()
  const config = useConfig()
  const [visible, setVisible] = useState(() => needsConsentBanner(config))
  if (!visible) return null

  const choose = (v: 'granted' | 'denied') => {
    setConsent(v, config)
    setVisible(false)
  }

  return (
    <div role="dialog" aria-live="polite" aria-label={t('consent.text')} className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-3xl rounded-2xl bg-white p-5 shadow-(--shadow-card) ring-1 ring-linea sm:flex sm:items-center sm:gap-6">
      <p className="mb-4 text-base sm:mb-0">{t('consent.text')}</p>
      <div className="flex shrink-0 gap-3">
        <Button variant="outline" onClick={() => choose('denied')}>{t('consent.reject')}</Button>
        <Button variant="primary" onClick={() => choose('granted')}>{t('consent.accept')}</Button>
      </div>
    </div>
  )
}
