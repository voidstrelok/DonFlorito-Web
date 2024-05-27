import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable, map, tap } from 'rxjs';
import { TipoServicioDTO } from '../models/TipoServicioDTO';
import { ContenedorEventosDTO } from '../models/ContenedorEventosDTO';
import { ReservaCreacionDTO } from '../models/ReservaCreacionDTO';
import { ReservaDTO } from '../models/ReservaDTO';
import { ServicioDTO } from '../models/ServicioDTO';

@Injectable({
  providedIn: 'root'
})
export class ServiciosService {
  private readonly API_URL = environment.API_URL+"servicios/"

  constructor(private http: HttpClient) {}

  getCatalogo(fechaReserva : string) : Observable<TipoServicioDTO[]>
  {
    const formData = new FormData();
    formData.append('FechaReserva', fechaReserva);

    return this.http.post<TipoServicioDTO[]>(this.API_URL+"getCatalogo",formData)
  }

  getServicios() : Observable<TipoServicioDTO[]>
  {
    const headers = { 'Authorization': "Bearer "+sessionStorage.getItem("session") as string }
    return this.http.get<TipoServicioDTO[]>(this.API_URL+"getServicios",{headers})
  }
  getAllTipoServicios() : Observable<TipoServicioDTO[]>
  {
    const headers = { 'Authorization': "Bearer "+sessionStorage.getItem("session") as string }
    return this.http.get<TipoServicioDTO[]>(this.API_URL+"getAllTipoServicios",{headers})
  }
  GetTipoServicioById(idTipoServicio : number) : Observable<TipoServicioDTO>
  {
    const formData = new FormData();
    formData.append('IdTipoServicio', idTipoServicio.toString());

    return this.http.post<TipoServicioDTO>(this.API_URL+"GetTipoServicioById",formData)
  }

  getCalendarioByServicio(idServicio : number, nPartidos : number, fechaReserva : string) : Observable<ContenedorEventosDTO[]>
  {
    const formData = new FormData();
    formData.append('IdServicio', idServicio.toString());
    formData.append('nPartidos', nPartidos.toString());
    formData.append('FechaReserva', fechaReserva);

    return this.http.post<ContenedorEventosDTO[]>(this.API_URL+"getCalendarioByServicio",formData)
  }
}
