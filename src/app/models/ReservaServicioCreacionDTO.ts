import { PrecioServicioDTO } from "./PrecioServicioDTO";
import { ReservaDTO } from "./ReservaDTO";
import { ServicioDTO } from "./ServicioDTO";

export interface ReservaServicioCreacionDTO {
    idServicio:           number;
    idTipoServicio:       number;
    idPrecioServicio:     number;
    cantidad:             number;
    horaComienzo:         Date | undefined;
    nombre:                string;
    precio:                 number;
    minutos:              number;
    
}