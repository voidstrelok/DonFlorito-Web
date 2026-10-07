import clsx from 'clsx'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api } from '@/api'
import { matchesPersona } from '@/features/admin/logic'
import { useAsync } from '@/lib/use-async'
import { inputClass } from '../ui/form'
import { Card, LoadState, Pagination } from './shared'

const PAGE = 15

export function PersonasTab() {
  const data = useAsync(() => api.getPersonas(), [])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const rows = useMemo(() => (data.data ?? []).filter((p) => matchesPersona(p, query)), [data.data, query])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const current = Math.min(page, pages)

  return (
    <div className="space-y-5">
      <div className="relative max-w-xl">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tinta-suave" />
        <input className={clsx(inputClass(), 'py-2.5! pl-10!')} placeholder="Buscar por nombre, RUT, correo o teléfono" aria-label="Buscar personas" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} />
      </div>

      <LoadState loading={data.loading && !data.data} error={data.error} onRetry={data.reload}>
        <p className="text-sm text-tinta-suave">{rows.length} {rows.length === 1 ? 'persona' : 'personas'}</p>
        {rows.length === 0 ? (
          <Card className="text-center text-tinta-suave">No hay personas que coincidan.</Card>
        ) : (
          <Card className="p-0! overflow-hidden">
            <ul className="divide-y divide-linea">
              {rows.slice((current - 1) * PAGE, current * PAGE).map((p) => (
                <li key={p.id} className="grid gap-x-4 gap-y-1 px-4 py-3 sm:px-6 md:grid-cols-[3rem_8rem_1fr_1fr]">
                  <span className="text-sm text-tinta-suave">#{p.id}</span>
                  <span className="font-mono text-sm">{p.rut}</span>
                  <span className="font-medium">{[p.nombre, p.segundoNombre, p.apellidoPaterno, p.apellidoMaterno].filter(Boolean).join(' ')}</span>
                  <span className="min-w-0 truncate text-sm text-tinta-suave">{p.email} · {p.telefono}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <Pagination page={current} pages={pages} onChange={setPage} />
      </LoadState>
    </div>
  )
}
