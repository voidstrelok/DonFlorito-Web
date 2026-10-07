import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { Parametros } from '@/api'
import { emptyPersona, upsertLine, type CartLine, type PersonaForm } from './cart'

const DRAFT_KEY = 'df-booking-draft'
const PERSONA_KEY = 'df-persona'

export interface Draft {
  /** "yyyy-MM-dd" */
  fecha: string | null
  lines: CartLine[]
  persona: PersonaForm
  /** Recordar datos de contacto en este dispositivo */
  remember: boolean
  accepted: boolean
}

type Action =
  | { type: 'fecha'; fecha: string }
  | { type: 'upsert'; line: CartLine }
  | { type: 'remove'; idTipoServicio: number }
  | { type: 'persona'; patch: Partial<PersonaForm> }
  | { type: 'remember'; value: boolean }
  | { type: 'accepted'; value: boolean }
  | { type: 'reset' }

function reducer(s: Draft, a: Action): Draft {
  switch (a.type) {
    case 'fecha':
      // Cambiar de día invalida horarios y cupos elegidos.
      return a.fecha === s.fecha ? s : { ...s, fecha: a.fecha, lines: [] }
    case 'upsert':
      return { ...s, lines: upsertLine(s.lines, a.line) }
    case 'remove':
      return { ...s, lines: s.lines.filter((l) => l.idTipoServicio !== a.idTipoServicio) }
    case 'persona':
      return { ...s, persona: { ...s.persona, ...a.patch } }
    case 'remember':
      return { ...s, remember: a.value }
    case 'accepted':
      return { ...s, accepted: a.value }
    case 'reset':
      return { ...initial(), persona: s.persona, remember: s.remember }
  }
}

function read<T>(storage: Storage, key: string): T | null {
  try {
    const v = storage.getItem(key)
    return v ? (JSON.parse(v) as T) : null
  } catch {
    return null
  }
}

function initial(): Draft {
  const saved = read<Draft>(sessionStorage, DRAFT_KEY)
  const persona = read<PersonaForm>(localStorage, PERSONA_KEY)
  return {
    fecha: saved?.fecha ?? null,
    lines: saved?.lines ?? [],
    persona: saved?.persona?.rut ? saved.persona : (persona ?? emptyPersona),
    remember: Boolean(persona),
    accepted: false,
  }
}

interface Ctx {
  draft: Draft
  dispatch: (a: Action) => void
  params: Parametros | undefined
  /** Guarda o borra los datos de contacto según la casilla "recordar". */
  commitPersona: () => void
}

const BookingContext = createContext<Ctx | null>(null)

export function BookingProvider({ params, children }: { params: Parametros | undefined; children: ReactNode }) {
  const [draft, dispatch] = useReducer(reducer, undefined, initial)

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, accepted: false }))
    } catch {
      /* sin storage: el borrador solo vive en memoria */
    }
  }, [draft])

  const value = useMemo<Ctx>(
    () => ({
      draft,
      dispatch,
      params,
      commitPersona: () => {
        try {
          if (draft.remember) localStorage.setItem(PERSONA_KEY, JSON.stringify(draft.persona))
          else localStorage.removeItem(PERSONA_KEY)
        } catch {
          /* ignorar */
        }
      },
    }),
    [draft, params],
  )
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBooking(): Ctx {
  const c = useContext(BookingContext)
  if (!c) throw new Error('useBooking fuera de BookingProvider')
  return c
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    /* ignorar */
  }
}
