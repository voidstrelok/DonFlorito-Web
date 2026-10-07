import { useEffect, useMemo, useState } from 'react'
import { api, type Config, type Servicio, type TipoServicio } from '@/api'
import { applyServiceEdits, POOL_TIPOS, updateConfig } from '@/features/admin/logic'
import { errorMessage } from '@/features/admin/session'
import { useAsync } from '@/lib/use-async'
import { Button } from '../ui/button'
import { Alert, inputClass, Spinner } from '../ui/form'
import { Card, LoadState, Switch } from './shared'

/**
 * Habilitar servicios y cambiar precios. La API guarda el precio por TIPO de servicio
 * (todas las canchas de un tipo cuestan lo mismo) y las piscinas se habilitan juntas.
 */
export function ServiciosTab() {
  const load = useAsync(async () => ({ config: await api.getConfig(), tipos: await api.getAllTipoServicios() }), [])
  const [base, setBase] = useState<Config>()
  const [enabled, setEnabled] = useState<Record<number, boolean>>({})
  const [precios, setPrecios] = useState<Record<number, string>>({})
  const [piscinas, setPiscinas] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string }>()

  const hydrate = (c: Config) => {
    setBase(c)
    setEnabled(Object.fromEntries(c.servicios.map((s) => [s.id, s.isEnabled])))
    const byTipo: Record<number, string> = {}
    for (const s of c.servicios) byTipo[s.idTipoServicio] ??= String(s.precio)
    setPrecios(byTipo)
    setPiscinas(c.piscinasEnabled)
  }
  useEffect(() => { if (load.data) hydrate(load.data.config) }, [load.data])

  const tipos: TipoServicio[] = load.data?.tipos ?? []
  const serviciosDe = (tipoId: number): Servicio[] => base?.servicios.filter((s) => s.idTipoServicio === tipoId) ?? []

  const parsed = useMemo(() => Object.fromEntries(Object.entries(precios).map(([k, v]) => [Number(k), v === '' ? NaN : Number(v)])), [precios])
  const invalid = Object.values(parsed).some((n) => !Number.isInteger(n) || n < 0)
  const dirty = useMemo(() => {
    if (!base) return false
    return piscinas !== base.piscinasEnabled
      || base.servicios.some((s) => !POOL_TIPOS.includes(s.idTipoServicio) && enabled[s.id] !== s.isEnabled)
      || base.servicios.some((s) => parsed[s.idTipoServicio] !== undefined && parsed[s.idTipoServicio] !== s.precio)
  }, [base, enabled, parsed, piscinas])

  const save = async () => {
    setBusy(true)
    setMsg(undefined)
    try {
      const saved = await updateConfig(api, (fresh) => applyServiceEdits(fresh, { enabled, precios: parsed, piscinas }))
      hydrate(saved)
      setMsg({ tone: 'success', text: 'Cambios guardados. Ya se reflejan en el sitio.' })
    } catch (e) {
      setMsg({ tone: 'error', text: errorMessage(e) })
    } finally {
      setBusy(false)
    }
  }

  const priceInput = (tipoId: number, label: string) => (
    <label className="flex items-center gap-2">
      <span className="sr-only">{label}</span>
      <span className="text-tinta-suave" aria-hidden>$</span>
      <input type="number" min={0} step={500} inputMode="numeric" aria-label={label} className={`${inputClass(Number.isNaN(parsed[tipoId]) || parsed[tipoId] < 0)} w-36! py-2!`} value={precios[tipoId] ?? ''} onChange={(e) => { setPrecios((p) => ({ ...p, [tipoId]: e.target.value })); setMsg(undefined) }} />
    </label>
  )

  const regular = tipos.filter((t) => !POOL_TIPOS.includes(t.id))
  const pools = tipos.filter((t) => POOL_TIPOS.includes(t.id))

  return (
    <LoadState loading={load.loading && !load.data} error={load.error} onRetry={load.reload}>
      <div className="space-y-5">
        <p className="max-w-3xl text-tinta-suave">Los cambios de precio aplican a las reservas nuevas; las ya hechas conservan su valor.</p>

        {regular.map((t) => (
          <Card key={t.id} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-azul-800">{t.nombre}</h3>
              {priceInput(t.id, `Precio de ${t.nombre}`)}
            </div>
            <ul className="space-y-3">
              {serviciosDe(t.id).map((s) => (
                <li key={s.id}><Switch checked={enabled[s.id] ?? true} onChange={(v) => { setEnabled((e) => ({ ...e, [s.id]: v })); setMsg(undefined) }} label={s.nombre} /></li>
              ))}
            </ul>
            {serviciosDe(t.id).length > 1 && <p className="text-sm text-tinta-suave">El precio aplica a todos los servicios de este tipo.</p>}
          </Card>
        ))}

        {pools.length > 0 && (
          <Card className="space-y-4">
            <h3 className="text-lg font-bold text-azul-800">Piscinas</h3>
            <Switch checked={piscinas} onChange={(v) => { setPiscinas(v); setMsg(undefined) }} label="Acceso a piscinas habilitado" />
            <div className="flex flex-wrap gap-x-10 gap-y-3">
              {pools.map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="font-medium">{t.id === 7 ? 'General' : 'Adulto mayor y niños'}</span>
                  {priceInput(t.id, `Precio ${t.nombre}`)}
                </div>
              ))}
            </div>
          </Card>
        )}

        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        {invalid && <Alert tone="warning">Los precios deben ser números enteros, sin decimales.</Alert>}

        <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl bg-white/95 p-4 shadow-(--shadow-card) backdrop-blur">
          <span className="text-sm text-tinta-suave">{dirty ? 'Hay cambios sin guardar.' : 'Sin cambios.'}</span>
          <Button size="lg" onClick={save} disabled={!dirty || invalid || busy}>{busy && <Spinner />} Guardar cambios</Button>
        </div>
      </div>
    </LoadState>
  )
}
