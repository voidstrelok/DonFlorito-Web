import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { AdminReservasComponent } from "./admin-reservas/admin-reservas.component";
import { APIService } from '../../services/api.service';
import { delay, retry } from 'rxjs';
import { LoadingComponent } from "../base/loading/loading.component";
import { LoadingService } from '../../services/loading.service';
import { AdminConfigComponent } from "./admin-config/admin-config.component";
import { AdminPersonasComponent } from "./admin-personas/admin-personas.component";
import { AdminServiciosComponent } from "./admin-servicios/admin-servicios.component";
import { environment } from '../../../environments/environment';
import { AdminReservasEspecialesComponent } from "./admin-reservasEspeciales/admin-reservasEspeciales.component";

@Component({
    selector: 'app-admin',
    standalone: true,
    templateUrl: './admin.component.html',
    styleUrl: './admin.component.css',
    changeDetection: ChangeDetectionStrategy.Default,
    imports: [
        CommonModule, NgbNavModule,
        AdminReservasComponent,
        LoadingComponent,
        AdminConfigComponent,
        AdminPersonasComponent,
        AdminServiciosComponent,
        AdminReservasEspecialesComponent
    ]
})
export class AdminComponent implements OnInit {
CerrarSesion() {
  sessionStorage.removeItem("session")
  location.reload()
}
msgError = ""

  constructor(private api : APIService, private loading: LoadingService){}
  ngOnInit(): void {
    this.loading.loadingOn()
    let token = sessionStorage.getItem("session")
    if(token != null){
      this.api.Session.SessionIsValid().subscribe({
        next: r => {
          this.isAutorizado = r
        },
        error: err=> {
          this.isAutorizado = false
          this.msgError = "Sesión expirada."
          this.loading.loadingOff()}
      })
    }else{
      this.loading.loadingOff()

    } 
    
  }
AdminLogin() {
  this.loading.loadingOn()

  let usuario = (document.getElementById("usuario") as HTMLInputElement).value
  let pass = (document.getElementById("pass") as HTMLInputElement).value
  this.msgError = ""
  if(usuario == "" || pass==""){
    this.msgError="Credenciales no válidas."
    this.loading.loadingOff()

    return
  }

  this.api.Session.AdminLogin(usuario,pass).subscribe({
    next: r=> {
      sessionStorage.setItem("session",r)
      this.isAutorizado = true;
    },
    error: err => {
      this.msgError = err.error      
      this.loading.loadingOff()
    }
  })
}
isAutorizado = false;
}
