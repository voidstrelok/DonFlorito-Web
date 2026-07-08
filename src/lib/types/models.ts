export interface ServicioDTO {
  id: number;
  nombre: string;
  idTipoServicio: number;
  isEnabled: boolean;
  precio: number;
  cambiaPrecio: boolean;
}

export interface ConfigDTO {
  hApertura: number;
  mApertura: number;
  hCierre: number;
  mCierre: number;
  reservasEnabled: boolean;
  piscinasEnabled: boolean;
  servicios: ServicioDTO[];
}

export interface ContenedorEventosDTO {
  horaComienzo: Date | string;
  horaFinal: Date | string;
  reservado: boolean;
}

export interface EstadoReservaDTO {
  id: number;
  nombre: string;
}

export interface ParametrosDTO {
  horaApertura: Date | string;
  horaCierre: Date | string;
  reservasEnabled: boolean;
}

export interface PersonaCreacionDTO {
  rut: string;
  nombre: string;
  segundoNombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  telefono: number;
}

export interface PersonaDTO {
  id: number;
  rut: string;
  nombre: string;
  segundoNombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  telefono: number;
  isEnabled: boolean;
}

export interface PersonaReservaDTO {
  id: number;
  rut: string;
  nombre: string;
  email: string;
  telefono: number;
  isEnabled: boolean;
}

export interface PrecioServicioDTO {
  id: number;
  idServicio: number;
  precio: number;
  minutos: number | null;
  isEnabled: boolean;
}

export interface ReservaServicioCreacionDTO {
  idServicio: number;
  idTipoServicio: number;
  idPrecioServicio: number;
  cantidad: number;
  horaComienzo: Date | string | undefined;
  nombre: string;
  precio: number;
  minutos: number;
}

export interface ReservaCreacionDTO {
  idPersona: number | null;
  fechaReserva: Date | string;
  reservaServicio: ReservaServicioCreacionDTO[];
  personaCreacion: PersonaCreacionDTO | null;
  ordenCompra: OrdenCompraDTO | null;
}

export interface Voucher {
  id: number;
  vci: string;
  amount: number;
  status: string;
  buyOrder: string;
  sessionId: string;
  cardNumber: string;
  accountingDate: string;
  transactionDate: string;
  authorizationCode: string;
  paymentTypeCode: string;
  responseCode: number;
  installmentsAmount: number;
  installmentsNumber: number;
  balance: number;
  idOrdenCompra: number;
  fecha: string;
  idOrdenCompraNavigation: string;
}

export interface OrdenCompraDTO {
  id: number;
  token: string;
  url: string;
  idReserva: number;
  isUsed: boolean;
  voucher: Voucher[];
}

export interface ReservaServicioDTO {
  id: number;
  idReserva: number;
  idServicio: number;
  idPrecioServicio: number;
  cantidad: number;
  horaComienzo: Date | string;
  precioServicio: PrecioServicioDTO;
  servicio: ServicioDTO;
}

export interface ReservaDTO {
  id: number;
  idEstadoReserva: number;
  idPersona: number;
  fechaReserva: Date | string;
  fechaIngreso: Date | string;
  fechaConfirmacion: Date | string | null;
  fechaCancelacion: Date | string | null;
  comentario: string;
  isEnabled: boolean;
  estadoReserva: EstadoReservaDTO;
  persona: PersonaDTO;
  ordenCompra: OrdenCompraDTO[];
  reservaServicio: ReservaServicioDTO[];
  idOrdenCompra: number;
}

export interface ReservaEspecialCreacionDTO {
  idServicio: number | null;
  idTipoServicio: number | null;
  fechaComienzo: Date | string;
  fechaTermino: Date | string;
  isCanchas: boolean;
  isCamping: boolean;
}

export interface TipoServicioDTO {
  id: number;
  nombre: string;
  servicio: ServicioDTO[];
  precioServicio: PrecioServicioDTO[];
  maxPartidos: number;
}

export interface ReservaEspecialDTO {
  id: number;
  idServicio: number | null;
  idTipoServicio: number | null;
  fechaComienzo: Date | string;
  fechaTermino: Date | string;
  isCanchas: boolean;
  isCamping: boolean;
  isEnabled: boolean;
  servicio: ServicioDTO | null;
  tipoServicio: TipoServicioDTO | null;
}
