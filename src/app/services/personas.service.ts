import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { PersonaDTO } from '../models/PersonaDTO';
import { PersonaCreacionDTO } from '../models/PersonaCreacionDTO';

@Injectable({
  providedIn: 'root'
})
export class PersonasService {
  private readonly API_URL = environment.API_URL+"personas/"

  constructor(private http: HttpClient) {}

  GetPersonaByRut(rut:string) : Observable<PersonaDTO>
  {
    const formData = new FormData();
    formData.append('RUT', rut);
    return this.http.post<PersonaDTO>(this.API_URL+"GetPersonaByRut",formData)
  }

  getPersonas() : Observable<PersonaDTO[]>
  {
    const headers = { 'Authorization': "Bearer "+sessionStorage.getItem("session") as string }
    return this.http.get<PersonaDTO[]>(this.API_URL+"getPersonas",{headers})
  }

  Post(persona:PersonaCreacionDTO) : Observable<PersonaDTO>
  {
    let body = JSON.stringify(persona)
    const httpOptions = {
      headers: new HttpHeaders({'Content-Type': 'application/json'})
    }
    return this.http.post<PersonaDTO>(this.API_URL,body,httpOptions)
  }

}
