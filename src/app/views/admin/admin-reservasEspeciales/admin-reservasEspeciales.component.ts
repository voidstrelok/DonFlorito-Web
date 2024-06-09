import { CommonModule, JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { NgbModalConfig, NgbModal, NgbActiveModal,NgbPaginationModule, NgbDatepickerModule, NgbDate, NgbCalendar, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { retry, delay } from 'rxjs';
import { ReservaDTO } from '../../../models/ReservaDTO';
import { APIService } from '../../../services/api.service';
import { LoadingService } from '../../../services/loading.service';
import { ReservaEspecialDTO } from '../../../models/ReservaEspecialDTO';
import { TipoServicioDTO } from '../../../models/TipoServicioDTO';
import { ReservaCreacionDTO } from '../../../models/ReservaCreacionDTO';
import { ReservaEspecialCreacionDTO } from '../../../models/ReservaEspecialCreacionDTO';
import { FormsModule } from '@angular/forms';
import { ServicioDTO } from '../../../models/ServicioDTO';
import { LoadingComponent } from "../../base/loading/loading.component";

@Component({
  selector: 'admin-reservas-especiales',
  standalone: true,
  imports: [
    CommonModule,NgbPaginationModule
  ],
  templateUrl: './admin-reservasEspeciales.component.html',
  styleUrl: './admin-reservasEspeciales.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class AdminReservasEspecialesComponent { 

  servicios! : TipoServicioDTO[]
  IngresarReservaEspecial() {  
    this.api.Servicios.getAllTipoServicios().subscribe({
      next: r=> {
        this.servicios = r.filter(r=>r.id < 7 ) as TipoServicioDTO[];
        this.servicios.push({id:7,nombre:"Piscinas",servicio:[],maxPartidos:0,precioServicio:[]})
        const modalRef = this.modalService.open(ModalIngresar);
        modalRef.componentInstance.$servicios = this.servicios;
        modalRef.componentInstance.IngresarCorrecto.subscribe({
          next: () =>{this.Refrescar()}
        }
    )},
      error: () =>{location.reload()}
    })  
  }
  CancelarReserva(IdReserva: number) {  
    const modalRef = this.modalService.open(ModalCancelar);
    modalRef.componentInstance.idReserva = IdReserva;
    modalRef.componentInstance.CancelarCorrecto.subscribe({
      next: () =>{this.Refrescar()}
    })
  }
    open(content: any) {
      this.modalService.open(content);
    }
  pagina=1
  elemPagina = 10
  selAnio = (new Date()).getFullYear() - 2024
  selMes = (new Date()).getMonth()
    constructor(private api : APIService,private loading : LoadingService, config: NgbModalConfig, private modalService: NgbModal){
      // customize default values of modals used by this component tree
      config.backdrop = 'static';
      config.keyboard = false;
    }
    $reservas!: ReservaEspecialDTO[]
    
    Refrescar()
    {
      let selectAnio = document.getElementById("anio") as HTMLSelectElement
      let selectMes = document.getElementById("mes") as HTMLSelectElement
      this.selAnio = selectAnio.selectedIndex
      this.selMes = selectMes.selectedIndex
  
      this.loading.loadingOn()
      this.api.Reservas.getReservasEspeciales(this.selAnio+2024,this.selMes+1).pipe(retry(3), delay(1000)).subscribe({
        next: r => {
          this.$reservas = r        
          this.loading.loadingOff()
        },
        error: err=> location.reload()
        
      })
    }
    ngOnInit(): void {
      this.loading.loadingOn()
  
      this.api.Reservas.getReservasEspeciales((new Date()).getFullYear(),this.selMes+1).pipe(retry(3), delay(1000)).subscribe({
        next: r => {
          this.$reservas = r
          this.loading.loadingOff()
        },
        error: err=> location.reload()
        
      })
    }
    
   }
   @Component({
    selector: 'modal-cancelar',
    standalone: true,
    imports:[CommonModule],
    changeDetection: ChangeDetectionStrategy.Default,
    template: `
      <div class="modal-header">
        <h4 class="modal-title">Atención</h4>
        <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
      </div>
      <div class="modal-body">
        <p>{{mensaje}}</p>
      </div>
      <div class="modal-footer">
        @if(btnOk){
          <button type="button" class="btn btn-azul btn-outline-dark" (click)="activeModal.dismiss();">Ok</button>
  
        }
        @else{
          <button type="button" class="btn btn-rojo btn-outline-dark" (click)="ConfirmaCancelacion()">Cancelar Reserva</button>
        }
      </div>
    `,
  })
  export class ModalCancelar{
  
    constructor(private api : APIService, private loading: LoadingService){}
    mensaje = "Al cancelar la reserva, el horario indicado quedará disponible para ser reservado."
    btnOk= false;
    @Input() idReserva!: number;
    @Output() CancelarCorrecto = new EventEmitter<{evento:boolean}>();
  
    ConfirmaCancelacion(){
      this.loading.loadingOn()
  
      this.api.Reservas.CancelarReservaEspecial(this.idReserva).subscribe({
        next: r=>{
          this.mensaje = "La reserva ha sido cancelada con éxito."
          this.btnOk = true
          this.CancelarCorrecto.emit({evento:this.btnOk})
        },
        error: err=>{
          if(err.error == null)
            {
              location.reload()
            }
          this.mensaje ="No se pudo anular la reserva. (" + err.error + ")."
          this.CancelarCorrecto.emit({evento:this.btnOk})
          this.loading.loadingOff()
        }
      })
    }
    activeModal = inject(NgbActiveModal);
  
    
  
    
  }

  @Component({
    selector: 'modal-ingresar',
    standalone: true,
    styleUrl: './admin-reservasEspeciales.component.css',
    changeDetection: ChangeDetectionStrategy.Default,
    template: `
    <app-loading></app-loading>
      <div class="modal-header">
        <h4 class="modal-title">Ingresar Reserva</h4>
        <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
      </div>
      @if(!confirmar) {
      <div class="modal-body">
        <p>Ingrese los detalles de la reserva especial. Esta reserva ocupará el horario seleccionado para el servicio seleccionado. 'Todo el recinto' significa que la reserva aplicará para todos los servicios.</p>       
            <h4 class="text-center azul">Servicio</h4>
            <select  class="form-select" (change)="TipoSelected($event)" [disabled]="isCamping || isCanchas">
            <option value=0 selected>--Seleccionar Tipo Servicio--</option>
            @if($servicios != undefined){
              @for (tipo of $servicios; track $index) {
                <option value={{tipo.id}}>{{tipo.nombre}}</option>
              }
            }              
            </select>
            <select class="form-select" [disabled]="tipoSeleccionado == undefined || isCamping || isCanchas" (change)="ServicioSelected($event)">
            <option value=0 selected>--Seleccionar Servicio--</option>
              @if(tipoSeleccionado != undefined){
                @for (serv of tipoSeleccionado.servicio; track $index) {
                <option value={{serv.id}}>{{serv.nombre}}</option>
              }
              }
              
            </select>

          <div class="col-lg-12 text-center mt-5">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" id="isCanchas" [checked]="isCanchas" (change)="CambiaCanchas()">
              <label class="form-check-label" for="isCanchas">
                <h5 class="rojo">Todas las canchas</h5>
              </label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" id="isCamping" [checked]="isCamping" (change)="CambiaCamping()">
              <label class="form-check-label" for="isCamping">
                <h5 class="rojo">Todo el camping</h5>
              </label>
            </div>
          </div>
          <hr>
          <div class="col-lg-12 text-center">
          <h4 class="azul">Fecha</h4>
          <ngb-datepicker #dp (dateSelect)="onDateSelection($event)" [displayMonths]="1" [dayTemplate]="t" outsideDays="hidden" />

          <ng-template #t let-date let-focused="focused">
            <span
              class="custom-day"
              [class.focused]="focused"
              [class.range]="isRange(date)"
              [class.faded]="isHovered(date) || isInside(date)"
              (mouseenter)="hoveredDate = date"
              (mouseleave)="hoveredDate = null"
            >
              {{ date.day }}
            </span>
          </ng-template>
          <div class="hstack">
            <div class="col-6">
            <h4 class="azul">Desde</h4>
          <ngb-timepicker [(ngModel)]="time1" />
            </div>
            <div class="col-6">
            <h4 class="azul">Hasta</h4>
          <ngb-timepicker [(ngModel)]="time2" />
            </div>
          </div>
          
          

          <h5>Desde:</h5>{{fromDate.day+"-"+fromDate.month+"-"+fromDate.year+", "+(time1.hour | number :"2.0-0")+":"+ (time1.minute | number :"2.0-0")}}
          
              <h5>Hasta:</h5> @if(toDate != null)
            {
              {{toDate.day+"-"+toDate.month+"-"+toDate.year+", "+(time2.hour | number :"2.0-0")+":"+ (time2.minute | number :"2.0-0")}} 
            }
          </div>
          </div>}
          @else{
            <div class="modal-body" id="msgConfirmar">
            @if(toDate != undefined){
              <p >Se ingresará una reserva para:</p> 
              <strong><p>{{isCamping&&isCanchas?"Todo el recinto":(isCanchas?"Todas las canchas":(isCamping?"Todo el camping":(servicioSeleccionado!=undefined?tipoSeleccionado.nombre+": "+servicioSeleccionado.nombre:tipoSeleccionado.nombre)))}}</p></strong>
              <p>Desde <strong>{{fromDate.day+"-"+fromDate.month+"-"+fromDate.year+", "+(time1.hour | number :"2.0-0")+":"+ (time1.minute | number :"2.0-0")}}</strong></p>
              <p>Hasta <strong>{{toDate.day+"-"+toDate.month+"-"+toDate.year+", "+(time2.hour | number :"2.0-0")+":"+ (time2.minute | number :"2.0-0")}}</strong></p>            
            }
              
            </div>
          }
      <div class="modal-footer">
          <p class="rojo" [hidden]="confirmar">{{msgError}}</p>
          <button type="button" class="btn btn-azul btn-outline-dark" (click)="Confirmar()" [hidden]="confirmar || correcto">Ingresar</button>
          <button type="button" class="btn btn-azul btn-outline-dark" (click)="confirmar=true;IngresarReserva()"[hidden]="!confirmar || correcto">Confirmar</button>
          <button type="button" class="btn btn-azul btn-outline-dark" (click)="activeModal.dismiss()"[hidden]="!correcto">Ok</button>

      </div>
    `,
    imports: [CommonModule, NgbDatepickerModule, NgbTimepickerModule, FormsModule, JsonPipe, LoadingComponent]
})
  export class ModalIngresar implements OnInit{
    
    confirmar = false
    isCamping = false
    isCanchas= false
    correcto = false
    msgError = ""
    desde : Date = new Date()
    hasta : Date = new Date()

    time1 = { hour: this.desde.getHours(), minute: this.desde.getMinutes() };
    time2 = { hour: this.desde.getHours(), minute: this.desde.getMinutes() };

    msgConfirmar = ""
    constructor(private api : APIService, private loading: LoadingService){}
    ngOnInit(): void {      
    }

    Confirmar(){
      if(this.toDate == null){
        this.msgError = "Falta indicar fecha final."
        return
      }
      if(this.tipoSeleccionado == undefined && (!this.isCamping && !this.isCanchas)){
        this.msgError = "Seleccionar servicios."
        return
      }
      if(this.fromDate.equals(this.toDate) && (this.time1.hour >= this.time2.hour && this.time1.minute >= this.time2.minute)){
        this.msgError = "La fecha de término de la reserva debe ser mayor a la de inicio."
        return
      }
      this.confirmar = true
    }
    CambiaCanchas(){
      this.isCanchas = !this.isCanchas
    }
    CambiaCamping(){
      this.isCamping = !this.isCamping      
    }
    TipoSelected(tipo : Event){
      let selTipo = tipo.target as HTMLSelectElement
      this.tipoSeleccionado = this.$servicios.find(s=>s.id == Number(selTipo.value)) as TipoServicioDTO

    }
    ServicioSelected(serv : Event){
      let selServ = serv.target as HTMLSelectElement      
      this.servicioSeleccionado = this.tipoSeleccionado.servicio.find(s=>s.id == Number(selServ.value)) as ServicioDTO
      
    }
    tipoSeleccionado!: TipoServicioDTO
    servicioSeleccionado!: ServicioDTO
    reservaCreacion! : ReservaEspecialCreacionDTO;
    btnOk= false;
    @Input() $servicios!: TipoServicioDTO[];
    @Output() IngresarCorrecto = new EventEmitter<boolean>();
  
    IngresarReserva(){
      this.loading.loadingOn() 
      let toFecha = this.toDate as NgbDate

      this.reservaCreacion = {
        fechaComienzo : new Date(this.fromDate.year,this.fromDate.month-1,this.fromDate.day,this.time1.hour-4,this.time1.minute),
        fechaTermino : new Date(toFecha.year,toFecha.month-1,toFecha.day,this.time2.hour-4,this.time2.minute),
        idServicio : this.servicioSeleccionado!=undefined?this.servicioSeleccionado.id:null,
        isCamping : this.isCamping,
        isCanchas : this.isCanchas,
        idTipoServicio : this.tipoSeleccionado!=undefined?this.tipoSeleccionado.id:null
      };
      
      this.api.Reservas.IngresarReservaEspecial(this.reservaCreacion).subscribe({
        next: r=>{
          let msg = document.getElementById("msgConfirmar") as HTMLElement
          msg.innerHTML = "La reserva ha sido ingresada correctamente."
          this.correcto = true
          this.IngresarCorrecto.emit(true);
        },
        error: err=>{
          this.msgConfirmar = err.error
        }
      })
    }
    activeModal = inject(NgbActiveModal);
  

    calendar = inject(NgbCalendar);

	hoveredDate: NgbDate | null = null;
	fromDate: NgbDate = this.calendar.getToday();
	toDate: NgbDate | null = this.calendar.getNext(this.fromDate, 'd', 0);
    onDateSelection(date: NgbDate) {
      if (!this.fromDate && !this.toDate) {
        this.fromDate = date;
      } else if (this.fromDate && !this.toDate && (date.after(this.fromDate)||date.equals(this.fromDate)) ) {
        this.toDate = date;
      } else {
        this.toDate = null;
        this.fromDate = date;
      }
    }
  
    isHovered(date: NgbDate) {
      return (
        this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate)
      );
    }
  
    isInside(date: NgbDate) {
      return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
    }
  
    isRange(date: NgbDate) {
      return (
        date.equals(this.fromDate) ||
        (this.toDate && date.equals(this.toDate)) ||
        this.isInside(date) ||
        this.isHovered(date)
      );
    }
    
  }