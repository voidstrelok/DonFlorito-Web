import clsx from 'clsx'
import { AlertCircle, CheckCircle2, Info, Loader2, Minus, Plus, TriangleAlert } from 'lucide-react'
import { useId, type ComponentProps, type ReactNode } from 'react'

export const inputClass = (invalid?: boolean) =>
  clsx(
    'block w-full rounded-xl border bg-white px-4 py-3 text-base text-tinta placeholder:text-tinta-suave/60',
    'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-azul-600',
    invalid ? 'border-rojo-600' : 'border-linea hover:border-azul-300',
  )

interface FieldProps {
  label: string
  error?: string
  hint?: string
  children: (a: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode
  className?: string
}

/** Etiqueta + control + ayuda/error enlazados por aria. */
export function Field({ label, error, hint, children, className }: FieldProps) {
  const id = useId()
  const msgId = `${id}-msg`
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-tinta">
        {label}
      </label>
      {children({ id, describedBy: error || hint ? msgId : undefined, invalid: Boolean(error) })}
      {(error || hint) && (
        <p id={msgId} className={clsx('mt-1.5 text-sm', error ? 'font-medium text-rojo-700' : 'text-tinta-suave')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 aria-hidden className={clsx('animate-spin', className ?? 'size-5')} />
}

type AlertTone = 'info' | 'error' | 'success' | 'warning'
const tones: Record<AlertTone, { box: string; icon: typeof Info }> = {
  info: { box: 'bg-azul-50 text-azul-900', icon: Info },
  error: { box: 'bg-rojo-50 text-rojo-900', icon: AlertCircle },
  success: { box: 'bg-verde-50 text-verde-900', icon: CheckCircle2 },
  warning: { box: 'bg-naranja-100 text-tinta', icon: TriangleAlert },
}

export function Alert({ tone = 'info', children, className, ...rest }: { tone?: AlertTone; children: ReactNode } & ComponentProps<'div'>) {
  const { box, icon: Icon } = tones[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={clsx('flex items-start gap-3 rounded-xl p-4', box, className)} {...rest}>
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

interface QtyProps {
  value: number
  min?: number
  max: number
  onChange: (n: number) => void
  label: string
}

/** Contador con botones grandes (mínimo 44 px) y valor anunciado a lectores de pantalla. */
export function QtyStepper({ value, min = 0, max, onChange, label }: QtyProps) {
  const btn = 'flex size-11 items-center justify-center rounded-full border-2 border-azul-600 text-azul-700 transition-colors hover:bg-azul-50 disabled:border-linea disabled:text-linea disabled:hover:bg-transparent'
  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-3">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`− ${label}`}>
        <Minus aria-hidden className="size-5" />
      </button>
      <output aria-live="polite" className="min-w-8 text-center font-display text-2xl font-bold tabular-nums">
        {value}
      </output>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`+ ${label}`}>
        <Plus aria-hidden className="size-5" />
      </button>
    </div>
  )
}

interface PillsProps<T extends string | number> {
  legend: string
  value: T | null
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  name: string
}

/** Grupo de opciones tipo "pastilla" con radios nativos (teclado y lectores funcionan sin extra). */
export function ChoicePills<T extends string | number>({ legend, value, options, onChange, name }: PillsProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-tinta">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input type="radio" name={name} className="peer sr-only" checked={value === o.value} onChange={() => onChange(o.value)} />
            <span className="inline-flex min-h-11 items-center rounded-full border-2 border-linea bg-white px-4 font-medium transition-colors hover:border-azul-300 peer-checked:border-azul-600 peer-checked:bg-azul-600 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-azul-600">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
