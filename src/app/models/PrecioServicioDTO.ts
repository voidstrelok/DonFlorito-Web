export interface PrecioServicioDTO {
    id:         number;
    idServicio: number;
    precio:     number;
    minutos:    number | null;
    isEnabled:  boolean;
}
