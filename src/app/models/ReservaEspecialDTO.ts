import { ServicioDTO } from "./ServicioDTO";
import { TipoServicioDTO } from "./TipoServicioDTO";

export interface ReservaEspecialDTO {
  id:             number;
  idServicio:     number|null;
  idTipoServicio: number|null;
  fechaComienzo:  Date;
  fechaTermino:   Date;
  isCanchas:      boolean;
  isCamping:      boolean;
  isEnabled:      boolean;
  servicio:       ServicioDTO|null;
  tipoServicio:   TipoServicioDTO|null;
}

