export interface ReservaEspecialCreacionDTO {
  idServicio:     number|null;
  idTipoServicio: number|null;
  fechaComienzo:  Date;
  fechaTermino:   Date;
  isCanchas:      boolean;
  isCamping:      boolean;
}

