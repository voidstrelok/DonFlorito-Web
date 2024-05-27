import { Injectable } from '@angular/core';
import { ServiciosService } from './servicios.service';
import { SessionService } from './session.service';
import { PersonasService } from './personas.service';
import { ReservasService } from './reservas.service';
import { TXService } from './tx.service';

@Injectable({
  providedIn: 'root',
})
export class APIService {
  public Servicios = this._servicios;
  public Session = this._parametros;
  public Personas = this._personas;
  public Reservas = this._reservas;
  public Tx = this._tx
  constructor(
    private _servicios: ServiciosService,
    private _parametros: SessionService,
    private _personas : PersonasService,
    private _reservas : ReservasService,
    private _tx : TXService) { 
  }

}
