import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { constructFrom, getHours, getMinutes, nextDay } from 'date-fns';
import { APIService } from '../../../services/api.service';
import { LoadingService } from '../../../services/loading.service';
import { ParametrosDTO } from '../../../models/ParametrosDTO';
import { ServicioDTO } from '../../../models/ServicioDTO';
import { NgbAlertModule, NgbTimeStruct, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ConfigDTO } from '../../../models/ConfigDTO';
import { EnumServicio } from '../../../models/enum/EnumServicio';
import { config } from 'rxjs';

@Component({
  selector: 'admin-config',
  standalone: true,
  imports: [
    CommonModule,NgbTimepickerModule,FormsModule,NgbAlertModule
  ],
  templateUrl: './admin-config.component.html',
  styleUrl: './admin-config.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class AdminConfigComponent implements OnInit{

warnVisible= false;
successVisible = false;


  Cambio() {
this.warnVisible=false
this.successVisible=false
}



CambiarSistemaReservas(cambio: boolean) {
  this.$config.reservasEnabled = cambio
  this.warnVisible=false
this.successVisible=false
}


GuardarCambios() {



  if(this.apertura.hour == this.cierre.hour && this.apertura.minute >= this.cierre.minute){
    this.warnVisible = true
    return
  }

  if(this.apertura.hour > this.cierre.hour){
    this.warnVisible = true
    return
  }
  this.warnVisible = false

  let config : ConfigDTO ={
    hApertura: this.apertura.hour,
    mApertura: this.apertura.minute,
    hCierre: this.cierre.hour,
    mCierre: this.cierre.minute,
    reservasEnabled: this.$config.reservasEnabled,
    piscinasEnabled: this.$config.piscinasEnabled,
    servicios : this.$config.servicios
  }  

  this.loading.loadingOn()
  this.api.Session.GuardarConfig(config).subscribe({
    next : (r: any) => {
      this.successVisible = true;
      this.loading.loadingOff()
    },
    error : ()=>{
      location.reload()
    }
  })
}

CambiaReservas(index :number) {
  if(index == 11){
    this.$config.piscinasEnabled = !this.$config.piscinasEnabled
    return
  }

  this.$config.servicios[index].isEnabled = !this.$config.servicios[index].isEnabled 
}
  
  $config!: ConfigDTO

  constructor(private api : APIService, private loading: LoadingService){}

  ngOnInit(): void {
    this.loading.loadingOn()
    this.api.Session.GetConfig().subscribe({
      next: r=> {        
        this.apertura.hour= r.hApertura
        this.apertura.minute = r.mApertura
        this.cierre.hour= r.hCierre
        this.cierre.minute = r.mCierre  
        this.$config = r               
        this.loading.loadingOff()
      },
      error: err=> location.replace("/")    
    })
  }

  apertura = { hour: 0, minute: 0 }
  cierre = { hour: 0, minute: 0 }

}
