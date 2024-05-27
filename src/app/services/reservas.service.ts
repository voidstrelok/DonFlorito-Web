import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable, catchError, map, retry, tap, throwError } from 'rxjs';
import { TipoServicioDTO } from '../models/TipoServicioDTO';
import { ContenedorEventosDTO } from '../models/ContenedorEventosDTO';
import { ReservaCreacionDTO } from '../models/ReservaCreacionDTO';
import { ReservaDTO } from '../models/ReservaDTO';
import { APIService } from './api.service';
import { ReservaEspecialDTO } from '../models/ReservaEspecialDTO';
import { ReservaEspecialCreacionDTO } from '../models/ReservaEspecialCreacionDTO';

@Injectable({
  providedIn: 'root'
})
export class ReservasService {
  private readonly API_URL = environment.API_URL+"reservas/"

  constructor(private http: HttpClient) {}
  
  NuevaReserva(reserva:ReservaCreacionDTO) : Observable<ReservaDTO>
  {
    let body = JSON.stringify(reserva)
    const httpOptions = {
      headers: new HttpHeaders({'Content-Type': 'application/json'})
    }
    return this.http.post<ReservaDTO>(this.API_URL,body,httpOptions)
  }
  IngresarReservaEspecial(reserva:ReservaEspecialCreacionDTO) : Observable<ReservaEspecialDTO>
  {
    let body = JSON.stringify(reserva)
    const httpOptions = {
      headers: new HttpHeaders({'Content-Type': 'application/json',  'Authorization': "Bearer "+sessionStorage.getItem("session") as string})
    }

    return this.http.post<ReservaEspecialDTO>(this.API_URL+"IngresarReservaEspecial/",body,httpOptions)
  }
  ConfirmarReserva(reserva:ReservaDTO,token_ws:string) : Observable<ReservaDTO>
  {
    let body = JSON.stringify(reserva)
    const httpOptions = {
      headers: new HttpHeaders({'Content-Type': 'application/json'})
    }
    return this.http.post<ReservaDTO>(this.API_URL+"ConfirmarReserva/"+token_ws,body,httpOptions)
  }
  getById(IdReserva : number) : Observable<ReservaDTO>
  {
    return this.http.get<ReservaDTO>(this.API_URL+"getById/"+IdReserva.toString())
  }

  getLinkQR(IdReserva : number) : Observable<Blob>
  {
    let httpHeaders = new HttpHeaders()
         .set('Accept', "image/png,*/*");
    return this.http.get<Blob>(this.API_URL+"getLinkQR/"+IdReserva.toString(), { headers: httpHeaders, responseType: 'blob' as 'json' })
  }

  getReservas(anio:number, mes:number) : Observable<ReservaDTO[]>
  {   
    const headers = { 'Authorization': "Bearer "+sessionStorage.getItem("session") as string }
    return this.http.get<ReservaDTO[]>(this.API_URL+"getReservas/?anio="+anio.toString()+"&mes="+mes.toString(),{headers})
  }

  getReservasEspeciales(anio:number, mes:number) : Observable<ReservaEspecialDTO[]>
  {   
    const headers = { 'Authorization': "Bearer "+sessionStorage.getItem("session") as string }
    return this.http.get<ReservaEspecialDTO[]>(this.API_URL+"getReservasEspeciales/?anio="+anio.toString()+"&mes="+mes.toString(),{headers})
  }

  CancelarReserva(IdReserva :number) : Observable<ReservaDTO[]>
  {   
    const headers = { 'Authorization': "Bearer "+sessionStorage.getItem("session") as string }
    return this.http.get<ReservaDTO[]>(this.API_URL+"CancelarReserva/?IdReserva="+IdReserva.toString(),{headers})
  }
  
  CancelarReservaEspecial(IdReserva :number) : Observable<ReservaDTO[]>
  {   
    const headers = { 'Authorization': "Bearer "+sessionStorage.getItem("session") as string }
    return this.http.get<ReservaDTO[]>(this.API_URL+"CancelarReservaEspecial/?IdReserva="+IdReserva.toString(),{headers})
  }
}
