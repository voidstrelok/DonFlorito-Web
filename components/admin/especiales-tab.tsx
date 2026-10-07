import * as Dialog from '@radix-ui/react-dialog'
import { Plus, X, XCircle } from 'lucide-react'
import { useState } from 'react'
import { api, type ReservaEspecial, type TipoServicio } from '@/api'
import { especialScopeLabel, especialTipos, needsServicio, toEspecialCreacion, validateEspecial, type EspecialForm, type EspecialScope } from '@/features/admin/logic'
import { errorMessage } from '@/features/admin/session'
import { toIsoDay } from '@/features/booking/dates'
import { useAsync } from '@/lib/use-async'
import { Button } from '../ui/button'
import { Alert, ChoicePills, Field, inputClass, Spinner } from '../ui/form'
import { Card, ConfirmDialog, currentMonth, LoadState, MonthPicker, type Month } from './shared'

const fmt = (iso: string) => new Date(iso).toLocaleString('es-CL', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export function EspecialesTab() {
  const [month, setMonth] = useState<Month>(currentMonth)
  const [creating, setCreating] = useState(false)
  const [toCancel, setToCancel] = useState<ReservaEspecial | null>(null)
  const data = useAsync(() => api.getReservasEspeciales(month.anio, month.mes), [month.anio, month.mes])
  const rows = data.data ?? []

  return (
    <div className="space-y-5">
      <p className="max-w-3xl text-tinta-suave">Bloquean un servicio, las canchas o todo el recinto en un rango de fechas (eventos, mantención, arriendos). Los clientes no podrán reservar en ese horario.</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthPicker value={month} onChange={setMonth} />
        <Button onClick={() => setCreating(true)}><Plus aria-hidden className="size-5" /> Nueva reserva especial</Button>
      </div>

      <LoadState loading={data.loading && !data.data} error={data.error} onRetry={data.reload}>
        {rows.length === 0 ? (
          <Card className="text-center text-tinta-suave">No hay reservas especiales vigentes este mes.</Card>
        ) : (
          <Card className="p-0! overflow-hidden">
            <ul className="divide-y divide-linea">
              {rows.map((e) => (
                <li key={e.id} className="grid items-center gap-x-4 gap-y-1 px-4 py-3 sm:px-6 md:grid-cols-[4rem_1fr_1fr_1fr_3rem]">
                  <span className="font-display text-lg font-bold text-azul-800">R{e.id}</span>
                  <span className="text-sm"><span className="text-tinta-suave">Desde </span>{fmt(e.fechaComienzo)}</span>
                  <span className="text-sm"><span className="text-tinta-suave">Hasta </span>{fmt(e.fechaTermino)}</span>
                  <span className="font-medium">{especialScopeLabel(e)}</span>
                  <span className="md:text-right">
                    <button type="button" onClick={() => setToCancel(e)} className="rounded-full p-2 text-rojo-600 hover:bg-rojo-50" aria-label={`Cancelar reserva especial R${e.id}`} title="Cancelar"><XCircle aria-hidden className="size-4" /></button>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </LoadState>

      <ConfirmDialog
        open={toCancel !== null}
        onOpenChange={(o) => !o && setToCancel(null)}
        danger
        title={`Cancelar reserva especial R${toCancel?.id ?? ''}`}
        confirmLabel="Cancelar reserva"
        description="El horario bloqueado quedará disponible para los clientes."
        onConfirm={async () => {
          await api.cancelarReservaEspecial(toCancel!.id)
          data.reload()
        }}
      />

      <NuevaEspecial open={creating} onOpenChange={setCreating} onCreated={data.reload} />
    </div>
  )
}

const SCOPES: { value: EspecialScope; label: string }[] = [
  { value: 'servicio', label: 'Un servicio' },
  { value: 'canchas', label: 'Todas las canchas' },
  { value: 'camping', label: 'Todo el camping' },
  { value: 'todo', label: 'Todo el recinto' },
]

function initialForm(): EspecialForm {
  const today = toIsoDay(new Date())
  return { scope: 'servicio', idTipoServicio: null, idServicio: null, startDate: today, startTime: '09:00', endDate: today, endTime: '19:00' }
}

function NuevaEspecial({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void }) {
  const [form, setForm] = useState<EspecialForm>(initialForm)
  const [step, setStep] = useState<'form' | 'review'>('form')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const tipos = useAsync(() => api.getAllTipoServicios(), [], open)
  const options: TipoServicio[] = especialTipos(tipos.data ?? [])
  const tipo = options.find((t) => t.id === form.idTipoServicio)
  const set = (patch: Partial<EspecialForm>) => { setForm((f) => ({ ...f, ...patch })); setError(undefined) }

  const close = (o: boolean) => {
    if (busy) return
    onOpenChange(o)
    if (!o) { setForm(initialForm()); setStep('form'); setError(undefined) }
  }

  const review = () => {
    const msg = validateEspecial(form)
    if (msg) return setError(msg)
    setStep('review')
  }

  const submit = async () => {
    setBusy(true)
    setError(undefined)
    try {
      await api.ingresarReservaEspecial(toEspecialCreacion(form))
      onCreated()
      setForm(initialForm())
      setStep('form')
      onOpenChange(false)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const preview = toEspecialCreacion(form)
  const scopeText = form.scope === 'servicio' ? [tipo?.nombre, tipo?.servicio.find((s) => s.id === form.idServicio)?.nombre].filter(Boolean).join(': ') : SCOPES.find((s) => s.value === form.scope)!.label

  return (
    <Dialog.Root open={open} onOpenChange={close}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 space-y-5 overflow-y-auto rounded-(--radius-card) bg-white p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-xl font-bold text-azul-800">{step === 'form' ? 'Nueva reserva especial' : 'Confirmar reserva especial'}</Dialog.Title>
            <Dialog.Close className="rounded-full p-1.5 hover:bg-azul-50" aria-label="Cerrar"><X aria-hidden className="size-5" /></Dialog.Close>
          </div>

          {step === 'form' ? (
            <>
              <ChoicePills name="alcance" legend="¿Qué se bloquea?" value={form.scope} options={SCOPES} onChange={(scope) => set({ scope, ...(scope !== 'servicio' ? { idTipoServicio: null, idServicio: null } : {}) })} />

              {form.scope === 'servicio' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Tipo de servicio">
                    {({ id }) => (
                      <select id={id} className={inputClass()} value={form.idTipoServicio ?? ''} onChange={(e) => set({ idTipoServicio: e.target.value ? Number(e.target.value) : null, idServicio: null })}>
                        <option value="">Selecciona…</option>
                        {options.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                      </select>
                    )}
                  </Field>
                  {tipo && tipo.servicio.length > 0 && (
                    <Field label={needsServicio(tipo.id) ? 'Cancha' : 'Servicio (opcional)'}>
                      {({ id }) => (
                        <select id={id} className={inputClass()} value={form.idServicio ?? ''} onChange={(e) => set({ idServicio: e.target.value ? Number(e.target.value) : null })}>
                          <option value="">{needsServicio(tipo.id) ? 'Selecciona…' : 'Todos'}</option>
                          {tipo.servicio.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                      )}
                    </Field>
                  )}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Fecha de inicio">{({ id }) => <input id={id} type="date" className={inputClass()} value={form.startDate} onChange={(e) => set({ startDate: e.target.value, endDate: form.endDate < e.target.value ? e.target.value : form.endDate })} />}</Field>
                <Field label="Hora de inicio">{({ id }) => <input id={id} type="time" className={inputClass()} value={form.startTime} onChange={(e) => set({ startTime: e.target.value })} />}</Field>
                <Field label="Fecha de término">{({ id }) => <input id={id} type="date" min={form.startDate} className={inputClass()} value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} />}</Field>
                <Field label="Hora de término">{({ id }) => <input id={id} type="time" className={inputClass()} value={form.endTime} onChange={(e) => set({ endTime: e.target.value })} />}</Field>
              </div>

              {error && <Alert tone="error">{error}</Alert>}
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => close(false)}>Cancelar</Button>
                <Button onClick={review}>Revisar</Button>
              </div>
            </>
          ) : (
            <>
              <dl className="space-y-3 rounded-xl bg-papel p-4">
                <div><dt className="text-sm text-tinta-suave">Se bloqueará</dt><dd className="font-semibold">{scopeText}</dd></div>
                <div><dt className="text-sm text-tinta-suave">Desde</dt><dd className="font-semibold">{fmt(preview.fechaComienzo)}</dd></div>
                <div><dt className="text-sm text-tinta-suave">Hasta</dt><dd className="font-semibold">{fmt(preview.fechaTermino)}</dd></div>
              </dl>
              {error && <Alert tone="error">{error}</Alert>}
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setStep('form')} disabled={busy}>Volver</Button>
                <Button onClick={submit} disabled={busy}>{busy && <Spinner />} Confirmar</Button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
