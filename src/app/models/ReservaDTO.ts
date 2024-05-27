import { EstadoReservaDTO } from "./EstadoReservaDTO";
import { PersonaDTO } from "./PersonaDTO";
import { ReservaServicioDTO } from "./ReservaServicioDTO";
import { ServicioDTO } from "./ServicioDTO";

  export interface ReservaDTO {
    id: number
    idEstadoReserva: number
    idPersona: number
    fechaReserva: Date
    fechaIngreso: Date
    fechaConfirmacion: Date | null
    fechaCancelacion: Date | null
    comentario: string
    isEnabled: boolean
    estadoReserva: EstadoReservaDTO
    persona: PersonaDTO
    ordenCompra: OrdenCompraDTO[]
    reservaServicio: ReservaServicioDTO[]
    idOrdenCompra: number;
  }


  export interface OrdenCompraDTO {
    id: number
    token: string
    url: string
    idReserva: number
    isUsed: boolean
    voucher: Voucher[]
  }

  export interface Voucher {
    id: number
    vci: string
    amount: number
    status: string
    buyOrder: string
    sessionId: string
    cardNumber: string
    accountingDate: string
    transactionDate: string
    authorizationCode: string
    paymentTypeCode: string
    responseCode: number
    installmentsAmount: number
    installmentsNumber: number
    balance: number
    idOrdenCompra: number
    fecha: string
    idOrdenCompraNavigation: string
  }