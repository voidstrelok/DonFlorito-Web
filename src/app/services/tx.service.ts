import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable, map, tap } from 'rxjs';
import { TipoServicioDTO } from '../models/TipoServicioDTO';
import { ContenedorEventosDTO } from '../models/ContenedorEventosDTO';
import { ReservaCreacionDTO } from '../models/ReservaCreacionDTO';
import { ReservaDTO } from '../models/ReservaDTO';

@Injectable({
  providedIn: 'root'
})
export class TXService {
  private readonly API_URL = environment.API_URL+"transacciones/"

  constructor(private http: HttpClient) {}
  
  Commit(token_ws : string, IdReserva: string) : Observable<ReservaDTO>
  {
    const formData = new FormData();
    formData.append('token_ws',token_ws);
    formData.append('IdReserva', IdReserva);
    
    return this.http.post<ReservaDTO>(this.API_URL+"commit",formData)
  }

  usarEnlace(Reserva: ReservaDTO) : Observable<ReservaDTO>
  {
    let body = JSON.stringify(Reserva)
    const httpOptions = {
      headers: new HttpHeaders({'Content-Type': 'application/json'})
    }
    return this.http.post<ReservaDTO>(this.API_URL+"usaEnlace",body,httpOptions)
  }

}
