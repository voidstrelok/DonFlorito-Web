import { ApiError, type Api, type Reserva, type ReservaCreacion } from '@/api'

const PERSONA_EXISTE = /ya existe la persona/i

/**
 * Crea la reserva pendiente. Algunas versiones de la API rechazan una persona que ya existe
 * ("Ya existe la persona que se intenta ingresar"); en ese caso se busca su id por RUT y se
 * reintenta enviando `idPersona` en vez de los datos, que es lo que hacía el sitio anterior.
 */
export async function createReserva(api: Pick<Api, 'nuevaReserva' | 'getPersonaId'>, body: ReservaCreacion): Promise<Reserva> {
  try {
    return await api.nuevaReserva(body)
  } catch (e) {
    if (!(e instanceof ApiError) || !PERSONA_EXISTE.test(e.message) || !body.personaCreacion) throw e
    const id = await api.getPersonaId(body.personaCreacion.rut)
    if (id == null) throw e
    return api.nuevaReserva({ ...body, idPersona: id, personaCreacion: null })
  }
}
