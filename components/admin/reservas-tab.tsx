import clsx from 'clsx'
import { ExternalLink, Search, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ESTADO, type Reserva } from '@/api'
import { canCancel, fetchAllReservas, matchesReserva, reservaDay, reservaTotal } from '@/features/admin/logic'
import { useAsync } from '@/lib/use-async'
import { money } from '@/lib/format'
import { inputClass } from '../ui/form'
import { Card, ConfirmDialog, currentMonth, LoadState, MonthPicker, Pagination, StatusBadge, ESTADO_LABEL, type Month } from './shared'

const PAGE = 15
type Filter = 'todas' | number

export function ReservasTab() {
  const [month, setMonth] = useState<Month>(currentMonth)
  const [filter, setFilter] = useState<Filter>('todas')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [toCancel, setToCancel] = useState<Reserva | null>(null)

  const data = useAsync(() => fetchAllReservas((p, pp) => api.getReservas(month.anio, month.mes, p, pp)), [month.anio, month.mes])
  const all = useMemo(() => data.data ?? [], [data.data])

  const rows = useMemo(
    () => all.filter((r) => (filter === 'todas' || r.idEstadoReserva === filter) && matchesReserva(r, query)).sort((a, b) => reservaDay(a).getTime() - reservaDay(b).getTime() || a.id - b.id),
    [all, filter, query],
  )
  const confirmed = all.filter((r) => r.idEstadoReserva === ESTADO.Confirmada)
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const view = rows.slice((Math.min(page, pages) - 1) * PAGE, Math.min(page, pages) * PAGE)

  const chips: { id: Filter; label: string; count: number }[] = [
    { id: 'todas', label: 'Todas', count: all.length },
    { id: ESTADO.Confirmada, label: 'Confirmadas', count: confirmed.length },
    { id: ESTADO.PagoPendiente, label: 'Pendientes', count: all.filter((r) => r.idEstadoReserva === ESTADO.PagoPendiente).length },
    { id: ESTADO.Anulada, label: 'Anuladas', count: all.filter((r) => r.idEstadoReserva === ESTADO.Anulada).length },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthPicker value={month} onChange={(m) => { setMonth(m); setPage(1) }} />
        <p className="text-sm text-tinta-suave">
          {confirmed.length} confirmadas · <span className="font-semibold text-tinta">{money(confirmed.reduce((s, r) => s + reservaTotal(r), 0))}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tinta-suave" />
          <input className={clsx(inputClass(), 'py-2.5! pl-10!')} placeholder="Buscar por código, nombre, RUT o correo" aria-label="Buscar reservas" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
          {chips.map((c) => (
            <button key={String(c.id)} type="button" aria-pressed={filter === c.id} onClick={() => { setFilter(c.id); setPage(1) }}
              className={clsx('rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold', filter === c.id ? 'border-azul-600 bg-azul-600 text-white' : 'border-linea bg-white hover:border-azul-300')}>
              {c.label} <span className="opacity-70">{c.count}</span>
            </button>
          ))}
        </div>
      </div>

      <LoadState loading={data.loading && !data.data} error={data.error} onRetry={data.reload}>
        {rows.length === 0 ? (
          <Card className="text-center text-tinta-suave">{all.length === 0 ? 'No hay reservas este mes.' : 'Ninguna reserva coincide con el filtro.'}</Card>
        ) : (
          <Card className="p-0! overflow-hidden">
            <ul className="divide-y divide-linea">
              {view.map((r) => (
                <li key={r.id} className="grid items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 md:grid-cols-[5rem_7rem_1fr_9rem_7rem_5rem]">
                  <span className="font-display text-lg font-bold text-azul-800">DF{r.id}</span>
                  <span className="text-sm text-tinta-suave">{reservaDay(r).toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                  <span className="min-w-0 truncate font-medium">{r.persona?.nombre} {r.persona?.apellidoPaterno}</span>
                  <span><StatusBadge estado={r.idEstadoReserva} /></span>
                  <span className="font-semibold tabular-nums md:text-right">{money(reservaTotal(r))}</span>
                  <span className="flex items-center gap-1 md:justify-end">
                    <Link to={`/mi-reserva/${r.id}`} target="_blank" className="rounded-full p-2 text-azul-700 hover:bg-azul-50" aria-label={`Ver reserva DF${r.id}`} title="Ver reserva"><ExternalLink aria-hidden className="size-4" /></Link>
                    {canCancel(r) && (
                      <button type="button" onClick={() => setToCancel(r)} className="rounded-full p-2 text-rojo-600 hover:bg-rojo-50" aria-label={`Anular reserva DF${r.id}`} title="Anular reserva"><XCircle aria-hidden className="size-4" /></button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <Pagination page={Math.min(page, pages)} pages={pages} onChange={setPage} />
      </LoadState>

      <ConfirmDialog
        open={toCancel !== null}
        onOpenChange={(o) => !o && setToCancel(null)}
        danger
        title={`Anular reserva DF${toCancel?.id ?? ''}`}
        confirmLabel="Anular reserva"
        description={<>Se notificará al cliente y deberá coordinar la devolución del pago. El horario quedará disponible. <span className="font-semibold">Esta acción no se puede deshacer.</span> <span className="sr-only">{ESTADO_LABEL[toCancel?.idEstadoReserva ?? 0]}</span></>}
        onConfirm={async () => {
          await api.cancelarReserva(toCancel!.id)
          data.reload()
        }}
      />
    </div>
  )
}
