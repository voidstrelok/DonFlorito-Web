import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { PersonaForm } from '@/features/booking/cart'
import { useBooking } from '@/features/booking/state'
import { formatRut, isEmail, isName, isPhone, isRutValid } from '@/features/booking/validation'
import { Button } from '../ui/button'
import { Field, inputClass } from '../ui/form'

type Errors = Partial<Record<keyof PersonaForm, string>>

/** Paso 2: solo lo indispensable para emitir la reserva y enviar el comprobante. */
export function DetailsStep() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { draft, dispatch, commitPersona } = useBooking()
  const p = draft.persona
  const [touched, setTouched] = useState<Set<string>>(new Set())

  const errors: Errors = {}
  if (!p.rut.trim()) errors.rut = t('booking.errors.required')
  else if (!isRutValid(p.rut)) errors.rut = t('booking.errors.rut')
  if (!p.nombre.trim()) errors.nombre = t('booking.errors.required')
  else if (!isName(p.nombre)) errors.nombre = t('booking.errors.name')
  if (!p.apellidoPaterno.trim()) errors.apellidoPaterno = t('booking.errors.required')
  else if (!isName(p.apellidoPaterno)) errors.apellidoPaterno = t('booking.errors.name')
  if (!p.email.trim()) errors.email = t('booking.errors.required')
  else if (!isEmail(p.email)) errors.email = t('booking.errors.email')
  if (!p.telefono.trim()) errors.telefono = t('booking.errors.required')
  else if (!isPhone(p.telefono)) errors.telefono = t('booking.errors.phone')

  const show = (k: keyof PersonaForm) => (touched.has(k) ? errors[k] : undefined)
  const blur = (k: keyof PersonaForm) => () => setTouched((s) => new Set(s).add(k))
  const set = (patch: Partial<PersonaForm>) => dispatch({ type: 'persona', patch })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (Object.keys(errors).length > 0) {
      setTouched(new Set(Object.keys(p)))
      // Lleva el foco al primer campo con error.
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    commitPersona()
    navigate('/reservar/pago')
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-2xl space-y-6 rounded-(--radius-card) bg-white p-6 shadow-(--shadow-card) sm:p-8">
      <div>
        <h2 className="text-2xl font-bold text-azul-800">{t('booking.details.title')}</h2>
        <p className="text-tinta-suave">{t('booking.details.subtitle')}</p>
      </div>

      <Field label={t('booking.details.rut')} hint={t('booking.details.rutHelp')} error={show('rut')}>
        {({ id, describedBy, invalid }) => (
          <input id={id} className={inputClass(invalid)} aria-describedby={describedBy} aria-invalid={invalid} inputMode="text" autoComplete="off" value={p.rut} onChange={(e) => set({ rut: formatRut(e.target.value) })} onBlur={blur('rut')} />
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t('booking.details.firstName')} error={show('nombre')}>
          {({ id, describedBy, invalid }) => (
            <input id={id} className={inputClass(invalid)} aria-describedby={describedBy} aria-invalid={invalid} autoComplete="given-name" value={p.nombre} onChange={(e) => set({ nombre: e.target.value })} onBlur={blur('nombre')} />
          )}
        </Field>
        <Field label={t('booking.details.lastName')} error={show('apellidoPaterno')}>
          {({ id, describedBy, invalid }) => (
            <input id={id} className={inputClass(invalid)} aria-describedby={describedBy} aria-invalid={invalid} autoComplete="family-name" value={p.apellidoPaterno} onChange={(e) => set({ apellidoPaterno: e.target.value })} onBlur={blur('apellidoPaterno')} />
          )}
        </Field>
      </div>

      <Field label={t('booking.details.email')} error={show('email')}>
        {({ id, describedBy, invalid }) => (
          <input id={id} type="email" className={inputClass(invalid)} aria-describedby={describedBy} aria-invalid={invalid} autoComplete="email" inputMode="email" value={p.email} onChange={(e) => set({ email: e.target.value })} onBlur={blur('email')} />
        )}
      </Field>

      <Field label={t('booking.details.phone')} hint={t('booking.details.phoneHelp')} error={show('telefono')}>
        {({ id, describedBy, invalid }) => (
          <input id={id} type="tel" className={inputClass(invalid)} aria-describedby={describedBy} aria-invalid={invalid} autoComplete="tel" inputMode="tel" placeholder="+56 9 1234 5678" value={p.telefono} onChange={(e) => set({ telefono: e.target.value })} onBlur={blur('telefono')} />
        )}
      </Field>

      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" className="mt-1 size-5 accent-azul-600" checked={draft.remember} onChange={(e) => dispatch({ type: 'remember', value: e.target.checked })} />
        <span>
          {t('booking.details.remember')}
          <span className="block text-sm text-tinta-suave">{t('booking.details.rememberHelp')}</span>
        </span>
      </label>

      <div className="flex flex-wrap justify-between gap-3 border-t border-linea pt-6">
        <Button type="button" variant="ghost" size="lg" onClick={() => navigate('/reservar')}>{t('booking.back')}</Button>
        <Button type="submit" variant="primary" size="lg">{t('booking.details.continue')}</Button>
      </div>
    </form>
  )
}
