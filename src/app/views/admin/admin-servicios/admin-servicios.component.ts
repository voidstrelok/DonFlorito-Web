import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';
import { APIService } from '../../../services/api.service';
import { LoadingService } from '../../../services/loading.service';
import { ConfigDTO } from '../../../models/ConfigDTO';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'admin-servicios',
  standalone: true,
  imports: [
    CommonModule,NgbAlertModule
  ],
  templateUrl: './admin-servicios.component.html',
  styleUrl: './admin-servicios.component.css',
  changeDetection : ChangeDetectionStrategy.Default
})
export class AdminServiciosComponent implements OnInit {

  warnVisible= false;
  successVisible = false;
  $config!: ConfigDTO

  constructor(private api : APIService, private loading: LoadingService){}

  ngOnInit(): void {
    this.loading.loadingOn
    this.api.Session.GetConfig().subscribe({
      next: r=> {        
        this.$config = r               
        this.loading.loadingOff
      },
      error: err=> location.replace("/")    
    }) }

  CambiaReservas(index :number) {
    this.warnVisible=false
    this.successVisible=false
    if(index == 11){
      this.$config.piscinasEnabled = !this.$config.piscinasEnabled
      return
    }
    this.$config.servicios[index].isEnabled = !this.$config.servicios[index].isEnabled
    
  }    

  CambiaPrecio(index: number,el : Event) {
    let precio = el.target as HTMLInputElement
    this.$config.servicios[index].precio = Number(precio.value)
    this.$config.servicios[index].cambiaPrecio = true
    this.warnVisible=false
    this.successVisible=false

}

  GuardarCambios() {
  
    let config : ConfigDTO ={
      hApertura: this.$config.hApertura,
      mApertura: this.$config.mApertura,
      hCierre: this.$config.hCierre,
      mCierre: this.$config.mCierre,
      reservasEnabled: this.$config.reservasEnabled,
      piscinasEnabled: this.$config.piscinasEnabled,
      servicios : this.$config.servicios
    }  
    this.loading.loadingOn()
    this.api.Session.GuardarConfig(config).subscribe({
      next : (r: any) => {
        this.successVisible=true
        this.loading.loadingOff()
      },
      error: ()=>{
        location.reload()
      }
    })
  }
}
