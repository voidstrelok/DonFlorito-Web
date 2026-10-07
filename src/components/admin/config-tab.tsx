import { useEffect, useState } from 'react'
import { api, type Config } from '@/api'
import { fromTime, toTime, updateConfig, validateHours } from '@/features/admin/logic'
import { errorMessage } from '@/features/admin/session'
import { useAsync } from '@/lib/use-async'
import { Button } from '../ui/button'
import { Alert, Field, inputClass, Spinner } from '../ui/form'
import { Card, LoadState, Switch } from './shared'

/** Horario de atención y botón general de reservas en línea. */
export function ConfigTab() {
  const load = useAsync(() => api.getConfig(), [])
  const [base, setBase] = useState<Config>()
  const [apertura, setApertura] = useState('')
  const [cierre, setCierre] = useState('')
  const [reservas, setReservas] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string }>()

  const hydrate = (c: Config) => {
    setBase(c)
    setApertura(toTime(c.hApertura, c.mApertura))
    setCierre(toTime(c.hCierre, c.mCierre))
    setReservas(c.reservasEnabled)
  }
  useEffect(() => { if (load.data) hydrate(load.data) }, [load.data])

  const hoursError = validateHours(apertura, cierre)
  const dirty = Boolean(base) && (apertura !== toTime(base!.hApertura, base!.mApertura) || cierre !== toTime(base!.hCierre, base!.mCierre) || reservas !== base!.reservasEnabled)

  const save = async () => {
    setBusy(true)
    setMsg(undefined)
    try {
      const a = fromTime(apertura)
      const c = fromTime(cierre)
      const saved = await updateConfig(api, (fresh) => ({ ...fresh, hApertura: a.h, mApertura: a.m, hCierre: c.h, mCierre: c.m, reservasEnabled: reservas }))
      hydrate(saved)
      setMsg({ tone: 'success', text: 'Cambios guardados.' })
    } catch (e) {
      setMsg({ tone: 'error', text: errorMessage(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <LoadState loading={load.loading && !load.data} error={load.error} onRetry={load.reload}>
      <div className="max-w-2xl space-y-5">
        <Card className="space-y-5">
          <div>
            <h3 className="text-lg font-bold text-azul-800">Reservas en línea</h3>
            <p className="text-tinta-suave">Si las deshabilitas, el sitio muestra un aviso y no permite reservar. Las reservas ya hechas no se afectan.</p>
          </div>
          <Switch checked={reservas} onChange={(v) => { setReservas(v); setMsg(undefined) }} label={reservas ? 'Habilitadas' : 'Deshabilitadas'} />
        </Card>

        <Card className="space-y-5">
          <div>
            <h3 className="text-lg font-bold text-azul-800">Horario de atención</h3>
            <p className="text-tinta-suave">Define los horarios que se ofrecen al reservar canchas.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Apertura">{({ id }) => <input id={id} type="time" className={inputClass(Boolean(hoursError))} value={apertura} onChange={(e) => { setApertura(e.target.value); setMsg(undefined) }} />}</Field>
            <Field label="Cierre" error={hoursError ?? undefined}>{({ id }) => <input id={id} type="time" className={inputClass(Boolean(hoursError))} value={cierre} onChange={(e) => { setCierre(e.target.value); setMsg(undefined) }} />}</Field>
          </div>
        </Card>

        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        <div className="flex justify-end">
          <Button size="lg" onClick={save} disabled={!dirty || Boolean(hoursError) || busy}>{busy && <Spinner />} Guardar cambios</Button>
        </div>
      </div>
    </LoadState>
  )
}
