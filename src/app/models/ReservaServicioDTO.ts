import { PrecioServicioDTO } from "./PrecioServicioDTO";
import { ReservaDTO } from "./ReservaDTO";
import { ServicioDTO } from "./ServicioDTO";

export interface ReservaServicioDTO {
    id:                   number;
    idReserva:            number;
    idServicio:           number;
    idPrecioServicio:     number;
    cantidad:             number;
    horaComienzo:         Date;
    precioServicio:       PrecioServicioDTO;
    servicio:             ServicioDTO;
}