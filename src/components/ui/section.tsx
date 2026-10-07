import clsx from 'clsx'
import type { ComponentProps, ReactNode } from 'react'

export function Container({ className, ...props }: ComponentProps<'div'>) {
  return <div className={clsx('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)} {...props} />
}

export function Section({ className, ...props }: ComponentProps<'section'>) {
  return <section className={clsx('py-16 sm:py-24', className)} {...props} />
}

export function SectionTitle({ eyebrow, children, className }: { eyebrow?: string; children: ReactNode; className?: string }) {
  return (
    <div className={clsx('mb-10', className)}>
      {eyebrow && <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-verde-700">{eyebrow}</p>}
      <h2 className="text-(length:--text-title) font-bold text-azul-800">{children}</h2>
    </div>
  )
}
