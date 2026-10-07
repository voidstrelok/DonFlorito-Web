import * as Tabs from '@radix-ui/react-tabs'
import { LockKeyhole, LogOut } from 'lucide-react'
import { useState } from 'react'
import { ConfigTab } from '@/components/admin/config-tab'
import { EspecialesTab } from '@/components/admin/especiales-tab'
import { PersonasTab } from '@/components/admin/personas-tab'
import { ReservasTab } from '@/components/admin/reservas-tab'
import { ServiciosTab } from '@/components/admin/servicios-tab'
import { Button } from '@/components/ui/button'
import { Alert, Field, inputClass, Spinner } from '@/components/ui/form'
import { Container, Section } from '@/components/ui/section'
import { useConfig } from '@/config'
import { errorMessage, useAdminSession } from '@/features/admin/session'
import { NotFoundPage as NotFound } from '@/pages/not-found'

const TABS = [
  { id: 'reservas', label: 'Reservas', Panel: ReservasTab },
  { id: 'especiales', label: 'Reservas especiales', Panel: EspecialesTab },
  { id: 'personas', label: 'Personas', Panel: PersonasTab },
  { id: 'servicios', label: 'Servicios y precios', Panel: ServiciosTab },
  { id: 'config', label: 'Configuración', Panel: ConfigTab },
] as const

function Login({ onLogin, notice }: { onLogin: (u: string, p: string) => Promise<void>; notice?: string }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user.trim() || !pass) return setError('Ingresa usuario y contraseña.')
    setBusy(true)
    setError(undefined)
    try {
      await onLogin(user.trim(), pass)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-md space-y-5 rounded-(--radius-card) bg-white p-6 shadow-(--shadow-card) sm:p-8">
      <div className="text-center">
        <LockKeyhole aria-hidden className="mx-auto mb-3 size-10 text-azul-600" />
        <h1 className="text-3xl font-extrabold text-azul-800">Acceso administración</h1>
      </div>
      {notice && !error && <Alert tone="warning">{notice}</Alert>}
      <Field label="Usuario">{({ id }) => <input id={id} className={inputClass()} autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} />}</Field>
      <Field label="Contraseña">{({ id }) => <input id={id} type="password" className={inputClass()} autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} />}</Field>
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy && <Spinner />} Ingresar</Button>
    </form>
  )
}

export function AdminPage() {
  const { features } = useConfig()
  const session = useAdminSession()

  // Si el admin está apagado en la configuración, la ruta no existe.
  if (!features.admin) return <NotFound />

  return (
    <Section className="py-8! sm:py-10!">
      <Container>
        {session.state === 'checking' ? (
          <p className="flex items-center justify-center gap-2 py-16 text-tinta-suave"><Spinner /> Verificando sesión…</p>
        ) : session.state === 'out' ? (
          <Login onLogin={session.login} notice={session.notice} />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-(length:--text-title) font-extrabold text-azul-800">Administración del sitio</h1>
              <Button variant="outline" onClick={session.logout}><LogOut aria-hidden className="size-4" /> Cerrar sesión</Button>
            </div>
            <Tabs.Root defaultValue="reservas">
              <Tabs.List aria-label="Secciones" className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-linea px-4 sm:mx-0 sm:px-0">
                {TABS.map((t) => (
                  <Tabs.Trigger key={t.id} value={t.id} className="shrink-0 border-b-4 border-transparent px-4 py-3 font-semibold text-tinta-suave hover:text-azul-700 data-[state=active]:border-azul-600 data-[state=active]:text-azul-800">
                    {t.label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
              {TABS.map(({ id, Panel }) => (
                <Tabs.Content key={id} value={id} className="focus-visible:outline-none"><Panel /></Tabs.Content>
              ))}
            </Tabs.Root>
          </div>
        )}
      </Container>
    </Section>
  )
}
