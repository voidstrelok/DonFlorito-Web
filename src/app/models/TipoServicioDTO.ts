import { PrecioServicioDTO } from "./PrecioServicioDTO";
import { ServicioDTO } from "./ServicioDTO";

export interface TipoServicioDTO {
    id:     number;
    nombre: string;
    servicio: ServicioDTO[];
    precioServicio : PrecioServicioDTO[];
    maxPartidos : number;
}
