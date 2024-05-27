import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { ParametrosDTO } from '../models/ParametrosDTO';
import { ConfigDTO } from '../models/ConfigDTO';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly API_URL = environment.API_URL+"session/"

  constructor(private http: HttpClient) {}

  getParametros() : Observable<ParametrosDTO>
  {
    return this.http.get<ParametrosDTO>(this.API_URL+"GetParametros")
  }

  AdminLogin(usuario:string, pass:string) : Observable<string>
  {
    const formData = new FormData();
    formData.append('usuario', usuario);
    formData.append('password', pass);
    return this.http.post(this.API_URL+"AdminLogin",formData,{responseType:'text'})
  }
  SessionIsValid() : Observable<boolean>
  {
    const headers = { 'Authorization': "Bearer "+sessionStorage.getItem("session") as string }    
    return this.http.get<boolean>(this.API_URL+"SessionIsValid",{headers})
  }

  GuardarConfig(config : ConfigDTO) : any{

    let body = JSON.stringify(config)
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': "Bearer "+sessionStorage.getItem("session") as string 
      })      
    }
    return this.http.post(this.API_URL+"GuardarConfig",body,httpOptions)
  }

  GetConfig() : Observable<ConfigDTO>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': "Bearer "+sessionStorage.getItem("session") as string 
      })      
    }
    return this.http.get<ConfigDTO>(this.API_URL+"GetConfig",httpOptions)
  }
}
