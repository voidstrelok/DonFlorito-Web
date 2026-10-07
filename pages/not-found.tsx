import { useTranslation } from 'react-i18next'
import { usePageTitle } from '@/lib/use-page-title'
import { ButtonLink } from '@/components/ui/button'
import { Container, Section } from '@/components/ui/section'

export function NotFoundPage() {
  const { t } = useTranslation()
  usePageTitle(t('errors.notFoundTitle'))
  return (
    <Section>
      <Container className="max-w-xl space-y-6 text-center">
        <img src="/brand/Queltehue2.png" alt="" className="mx-auto h-40 w-auto" />
        <p className="font-display text-7xl font-extrabold text-azul-600">404</p>
        <p className="text-lg text-tinta-suave">{t('errors.notFound')}</p>
        <ButtonLink to="/" size="lg">{t('errors.backHome')}</ButtonLink>
      </Container>
    </Section>
  )
}
