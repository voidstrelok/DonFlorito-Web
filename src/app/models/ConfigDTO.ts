import { ServicioDTO } from "./ServicioDTO";

export interface ConfigDTO {
    hApertura:        number;
    mApertura:        number;
    hCierre:          number;
    mCierre:          number;
    reservasEnabled: boolean;
    piscinasEnabled: boolean;
    servicios:       ServicioDTO[];
}