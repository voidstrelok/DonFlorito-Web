import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, TemplateRef, inject } from '@angular/core';
import { APIService } from '../../../services/api.service';
import { ReservaDTO } from '../../../models/ReservaDTO';
import { LoadingService } from '../../../services/loading.service';
import { delay, retry } from 'rxjs';
import { NgbActiveModal, NgbModal, NgbModalConfig, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { nextThursday } from 'date-fns';

@Component({
  selector: 'admin-reservas',
  standalone: true,
  imports: [
    CommonModule,NgbPaginationModule
  ],
  templateUrl:'./admin-reservas.component.html',
  styleUrl: './admin-reservas.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class AdminReservasComponent implements OnInit{

CancelarReserva(IdReserva: number) {  
  const modalRef = this.modalService.open(Modal);
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
  $reservas!: ReservaDTO[]
  
  Refrescar()
  {
    let selectAnio = document.getElementById("anio") as HTMLSelectElement
    let selectMes = document.getElementById("mes") as HTMLSelectElement
    this.selAnio = selectAnio.selectedIndex
    this.selMes = selectMes.selectedIndex

    this.loading.loadingOn()
    this.api.Reservas.getReservas(this.selAnio+2024,this.selMes+1).pipe(retry(3), delay(1000)).subscribe({
      next: r => {
        this.$reservas = r        
        this.loading.loadingOff()
      },
      error: err=> location.reload()
      
    })
  }
  ngOnInit(): void {
    this.loading.loadingOn()

    this.api.Reservas.getReservas((new Date()).getFullYear(),this.selMes+1).pipe(retry(3), delay(1000)).subscribe({
      next: r => {
        this.$reservas = r
        this.loading.loadingOff()
      },
      error: err=> location.reload()
      
    })
  }
  
 }
 @Component({
	selector: 'modal',
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
export class Modal{

  constructor(private api : APIService, private loading: LoadingService){}
  mensaje = "Al cancelar la reserva, el cliente será notificado y deberá coordinar la devolución del pago. El horario reservado quedará disponible para ser reservado."
  btnOk= false;
  @Input() idReserva!: number;
  @Output() CancelarCorrecto = new EventEmitter<{evento:boolean}>();

  ConfirmaCancelacion(){
    this.loading.loadingOn()

    this.api.Reservas.CancelarReserva(this.idReserva).subscribe({
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