import { useCallback, useEffect, useRef, useState } from 'react'

export interface AsyncState<T> {
  data: T | undefined
  error: Error | undefined
  loading: boolean
  reload: () => void
}

/**
 * Ejecuta `fn` cuando cambian `deps` (o `enabled` pasa a true). Descarta
 * respuestas de llamadas anteriores para que una respuesta lenta no pise a una nueva.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[], enabled = true): AsyncState<T> {
  const [state, setState] = useState<{ data?: T; error?: Error; loading: boolean }>({ loading: enabled })
  const run = useRef(0)
  const [tick, setTick] = useState(0)
  const reload = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!enabled) {
      setState({ loading: false })
      return
    }
    const id = ++run.current
    setState((s) => ({ data: s.data, loading: true }))
    fn().then(
      (data) => id === run.current && setState({ data, loading: false }),
      (error: Error) => id === run.current && setState({ error, loading: false }),
    )
    return () => {
      // Invalida la respuesta pendiente: no es un nodo del DOM, por eso la advertencia no aplica.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      run.current++
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, tick])

  return { data: state.data, error: state.error, loading: state.loading, reload }
}
