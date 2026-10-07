/** Contratos de la API .NET (DonFlorito-API). Fechas viajan como string ISO sin tocar. */

export interface Parametros {
  horaApertura: string
  horaCierre: string
  reservasEnabled: boolean
}

export interface Servicio {
  id: number
  nombre: string
  idTipoServicio: number
  isEnabled: boolean
  precio: number
  cambiaPrecio: boolean
}

export interface PrecioServicio {
  id: number
  idServicio: number
  precio: number
  minutos: number | null
  isEnabled: boolean
}

export interface TipoServicio {
  id: number
  nombre: string
  servicio: Servicio[]
  precioServicio: PrecioServicio[]
  maxPartidos?: number
}

/** Bloque horario de una cancha. `reservado` = no disponible. */
export interface Slot {
  horaComienzo: string
  horaFinal: string
  reservado: boolean
}

export interface Persona {
  id: number
  rut: string
  nombre: string
  segundoNombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  email: string
  telefono: number
}

export type PersonaCreacion = Omit<Persona, 'id'>

export interface ReservaServicioCreacion {
  idServicio: number
  idTipoServicio: number
  idPrecioServicio: number
  cantidad: number
  horaComienzo: string | null
  nombre: string
  precio: number
  minutos: number
}

export interface ReservaCreacion {
  idPersona: number | null
  personaCreacion: PersonaCreacion | null
  reservaServicio: ReservaServicioCreacion[]
  fechaReserva: string
  ordenCompra: null
}

export interface OrdenCompra {
  id: number
  token: string
  url: string
  idReserva: number
  isUsed: boolean
  fecha?: string
}

export interface ReservaServicio {
  id: number
  idReserva: number
  idServicio: number
  idPrecioServicio: number
  cantidad: number
  horaComienzo: string | null
  precioServicio: PrecioServicio
  servicio: Servicio
}

export const ESTADO = { PagoPendiente: 1, Confirmada: 2, Anulada: 3 } as const

export interface Reserva {
  id: number
  idEstadoReserva: number
  idPersona: number
  fechaReserva: string
  fechaIngreso: string
  fechaConfirmacion: string | null
  estadoReserva: { id: number; nombre: string }
  persona: Persona
  ordenCompra: OrdenCompra[]
  reservaServicio: ReservaServicio[]
  idOrdenCompra: number
}

/** Configuración editable desde el admin (session/GetConfig + GuardarConfig). */
export interface Config {
  hApertura: number
  mApertura: number
  hCierre: number
  mCierre: number
  piscinasEnabled: boolean
  reservasEnabled: boolean
  servicios: Servicio[]
}

export interface ReservaEspecial {
  id: number
  idServicio: number | null
  idTipoServicio: number | null
  fechaComienzo: string
  fechaTermino: string
  isCanchas: boolean
  isCamping: boolean
  isEnabled: boolean
  servicio: Servicio | null
  tipoServicio: TipoServicio | null
}

export interface ReservaEspecialCreacion {
  idServicio: number | null
  idTipoServicio: number | null
  fechaComienzo: string
  fechaTermino: string
  isCanchas: boolean
  isCamping: boolean
}

/** Interfaz común del backend real y del mock de desarrollo. */
export interface Api {
  getParametros(): Promise<Parametros>
  getCatalogo(fechaApi: string): Promise<TipoServicio[]>
  getCalendario(idServicio: number, partidos: number, fechaApi: string): Promise<Slot[]>
  nuevaReserva(r: ReservaCreacion): Promise<Reserva>
  usarEnlace(r: Reserva): Promise<Reserva>
  confirmarReserva(r: Reserva, tokenWs: string): Promise<Reserva>
  getReserva(id: number): Promise<Reserva>
  /** Solo se usa el id: los datos personales que devuelve la API no se muestran en pantalla. */
  getPersonaId(rut: string): Promise<number | null>
  /** URL (object URL) de la imagen QR, o null si no hay. */
  getQr(id: number): Promise<string | null>

  // ---- Administración (requiere sesión) ----
  adminLogin(usuario: string, password: string): Promise<string>
  sessionIsValid(): Promise<boolean>
  getConfig(): Promise<Config>
  guardarConfig(c: Config): Promise<void>
  getReservas(anio: number, mes: number, pagina: number, porPagina: number): Promise<Reserva[]>
  getReservasEspeciales(anio: number, mes: number): Promise<ReservaEspecial[]>
  cancelarReserva(id: number): Promise<void>
  cancelarReservaEspecial(id: number): Promise<void>
  ingresarReservaEspecial(r: ReservaEspecialCreacion): Promise<void>
  getPersonas(): Promise<Persona[]>
  getAllTipoServicios(): Promise<TipoServicio[]>
}
