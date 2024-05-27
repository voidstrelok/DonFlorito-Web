import { PersonaCreacionDTO } from "./PersonaCreacionDTO";
import { OrdenCompraDTO } from "./ReservaDTO";
import { ReservaServicioCreacionDTO } from "./ReservaServicioCreacionDTO";

export interface ReservaCreacionDTO {
    idPersona:         number|null;
    fechaReserva:      Date;
    reservaServicio:  ReservaServicioCreacionDTO[];
    personaCreacion: PersonaCreacionDTO | null;
    ordenCompra : OrdenCompraDTO | null;
}

