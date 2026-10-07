import clsx from 'clsx'
import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'brand' | 'outline' | 'ghost' | 'light'
type Size = 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary: 'bg-verde-600 text-white hover:bg-verde-700 focus-visible:outline-verde-600',
  brand: 'bg-azul-600 text-white hover:bg-azul-700',
  outline: 'border-2 border-azul-600 text-azul-700 hover:bg-azul-50',
  ghost: 'text-azul-700 hover:bg-azul-50',
  light: 'bg-white text-azul-800 hover:bg-azul-50 focus-visible:outline-white',
}

const sizes: Record<Size, string> = {
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return clsx(base, variants[variant], sizes[size], extra)
}

interface Common {
  variant?: Variant
  size?: Size
}

export function Button({ variant, size, className, ...props }: Common & ComponentProps<'button'>) {
  return <button className={buttonClass(variant, size, className)} {...props} />
}

/** Enlace interno (React Router) con aspecto de botón. */
export function ButtonLink({ variant, size, className, ...props }: Common & ComponentProps<typeof Link>) {
  return <Link className={buttonClass(variant, size, className)} {...props} />
}

/** Enlace externo (mailto, wa.me, etc.) con aspecto de botón. */
export function ButtonAnchor({ variant, size, className, ...props }: Common & ComponentProps<'a'>) {
  return <a className={buttonClass(variant, size, className)} {...props} />
}
