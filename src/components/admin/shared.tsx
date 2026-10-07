import * as Dialog from '@radix-ui/react-dialog'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ESTADO } from '@/api'
import { yearOptions } from '@/features/admin/logic'
import { errorMessage } from '@/features/admin/session'
import { Button } from '../ui/button'
import { Alert, inputClass, Spinner } from '../ui/form'

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export interface Month {
  anio: number
  mes: number // 1..12
}

export const currentMonth = (): Month => {
  const n = new Date()
  return { anio: n.getFullYear(), mes: n.getMonth() + 1 }
}

export function MonthPicker({ value, onChange }: { value: Month; onChange: (m: Month) => void }) {
  const sel = clsx(inputClass(), 'w-auto! py-2!')
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Período">
      <select aria-label="Mes" className={sel} value={value.mes} onChange={(e) => onChange({ ...value, mes: Number(e.target.value) })}>
        {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
      </select>
      <select aria-label="Año" className={sel} value={value.anio} onChange={(e) => onChange({ ...value, anio: Number(e.target.value) })}>
        {yearOptions().map((y) => <option key={y}>{y}</option>)}
      </select>
    </div>
  )
}

const estadoStyle: Record<number, string> = {
  [ESTADO.Confirmada]: 'bg-verde-100 text-verde-800',
  [ESTADO.PagoPendiente]: 'bg-azul-100 text-azul-800',
  [ESTADO.Anulada]: 'bg-rojo-100 text-rojo-900',
}
const estadoLabel: Record<number, string> = { [ESTADO.Confirmada]: 'Confirmada', [ESTADO.PagoPendiente]: 'Pago pendiente', [ESTADO.Anulada]: 'Anulada' }

export const ESTADO_LABEL = estadoLabel

export function StatusBadge({ estado }: { estado: number }) {
  return <span className={clsx('inline-block rounded-full px-3 py-1 text-sm font-semibold', estadoStyle[estado])}>{estadoLabel[estado] ?? '—'}</span>
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null
  const btn = 'flex size-10 items-center justify-center rounded-full border border-linea bg-white hover:bg-azul-50 disabled:opacity-40 disabled:hover:bg-white'
  return (
    <nav aria-label="Paginación" className="mt-4 flex items-center justify-center gap-3">
      <button type="button" className={btn} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Página anterior"><ChevronLeft aria-hidden className="size-5" /></button>
      <span className="text-sm text-tinta-suave">Página {page} de {pages}</span>
      <button type="button" className={btn} onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Página siguiente"><ChevronRight aria-hidden className="size-5" /></button>
    </nav>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('rounded-(--radius-card) bg-white p-5 shadow-(--shadow-card) sm:p-6', className)}>{children}</div>
}

/** Interruptor accesible (checkbox nativo con apariencia de switch). */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3">
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span aria-hidden className="relative h-7 w-12 rounded-full bg-linea transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-6 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-verde-600 peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-azul-600" />
      <span className="font-medium">{label}</span>
    </label>
  )
}

interface ConfirmProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description: ReactNode
  confirmLabel: string
  onConfirm: () => Promise<void>
  danger?: boolean
}

/** Confirmación para acciones que no se pueden deshacer. Muestra el error de la API sin cerrarse. */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm, danger }: ConfirmProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const run = async () => {
    setBusy(true)
    setError(undefined)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!busy) { onOpenChange(o); setError(undefined) } }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-(--radius-card) bg-white p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-xl font-bold text-azul-800">{title}</Dialog.Title>
            <Dialog.Close className="rounded-full p-1.5 hover:bg-azul-50" aria-label="Cerrar"><X aria-hidden className="size-5" /></Dialog.Close>
          </div>
          <Dialog.Description asChild><div className="text-tinta-suave">{description}</div></Dialog.Description>
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Volver</Button>
            <Button className={danger ? 'bg-rojo-600! hover:bg-rojo-700!' : ''} onClick={run} disabled={busy}>
              {busy && <Spinner />} {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Estados de carga/error comunes de las pestañas. */
export function LoadState({ loading, error, onRetry, children }: { loading: boolean; error?: Error; onRetry: () => void; children: ReactNode }) {
  if (loading) return <p className="flex items-center gap-2 py-10 text-tinta-suave"><Spinner /> Cargando…</p>
  if (error) {
    return (
      <Alert tone="error">
        {errorMessage(error)}{' '}
        <button type="button" className="font-semibold underline" onClick={onRetry}>Reintentar</button>
      </Alert>
    )
  }
  return <>{children}</>
}
