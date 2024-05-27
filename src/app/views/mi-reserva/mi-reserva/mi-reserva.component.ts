import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { APIService } from '../../../services/api.service';
import { ReservaDTO } from '../../../models/ReservaDTO';
import { ActivatedRoute } from '@angular/router';
import { LoadingService } from '../../../services/loading.service';
import { EnumEstadoReserva } from '../../../models/enum/EnumEstadoReserva';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { identifierName } from '@angular/compiler';
import { Observable, catchError, delay, throwError } from 'rxjs';
import { CountdownComponent, CountdownEvent } from 'ngx-countdown';
import { getTime, millisecondsToSeconds } from 'date-fns';
import { ReservaCreacionDTO } from '../../../models/ReservaCreacionDTO';
import { ReservaServicioCreacionDTO } from '../../../models/ReservaServicioCreacionDTO';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-mi-reserva',
  standalone: true,
  imports: [CommonModule, TranslateModule, CountdownComponent],
  templateUrl: './mi-reserva.component.html',
  styleUrl: './mi-reserva.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class MiReservaComponent implements OnInit {
  private modalService = inject(NgbModal);

  BuscarOtraReserva() {
    location.replace('mi-reserva');
  }
  Pagar() {

    this.NuevaReserva = JSON.parse(sessionStorage.getItem('reserva') as string);
    this.api.Tx.usarEnlace(this.NuevaReserva).subscribe((r) => {
      this.NuevaReserva = r
      sessionStorage.setItem('reserva', JSON.stringify(r));
      if(this.NuevaReserva.idEstadoReserva == EnumEstadoReserva.Anulada)
        {
          location.reload();
        }else
        {
          let form  = document.getElementById("formPago") as HTMLFormElement
          let inputToken = document.getElementById("token") as HTMLInputElement
          form.action = this.NuevaReserva.ordenCompra[0].url;
          inputToken.value = this.NuevaReserva.ordenCompra[0].token;
          form.submit()
        }

    });
  }

  PagarReserva = false;
  BuscarReserva() {
    this.loading.loadingOn();
    let nReserva = document.getElementById('NReserva') as HTMLInputElement;
    let regDF = new RegExp('^[Dd][Ff]\\d*$');
    let regNumeros = new RegExp('^[0-9]*$');
    let error = document.getElementById('DIVNReservaError') as HTMLElement;

    if (nReserva.value == '') {
      this.translate
        .get('error-nreserva-vacio')
        .subscribe((t) => (error.innerText = t));
    } else if (regDF.test(nReserva.value)) {
      let ajuste = nReserva.value.slice(2);
      location.replace('mi-reserva/' + ajuste);
    } else if (regNumeros.test(nReserva.value)) {
      location.replace('mi-reserva/' + nReserva.value);
    } else {
      this.translate
        .get('error-nreserva')
        .subscribe((t) => (error.innerText = t));
    }
    this.loading.loadingOff();
  }
  getTotalCarro() {
    let total = 0;
    let reserva;
    if (!this.PagarReserva) {
      reserva = this.reserva;
    } else {
      reserva = this.NuevaReserva;
    }
    reserva.reservaServicio.forEach((i) => {
      total += i.cantidad * i.precioServicio.precio;
    });
    return total;
  }
  reserva!: ReservaDTO;
  IdReserva!: string;
  NuevaReserva!: ReservaDTO;
  constructor(
    private api: APIService,
    private route: ActivatedRoute,
    private loading: LoadingService,
    private sanitizer: DomSanitizer,
    private translate: TranslateService
  ) {}
  ngOnInit(): void {
    this.loading.loadingOn();
    this.IdReserva = this.route.snapshot.paramMap.get('id') as string;
    let sessionV = sessionStorage.getItem('reserva');
    let NReserva;

    if (sessionV != null) {
      NReserva = JSON.parse(sessionV) as ReservaDTO;
    }

    

    if (this.IdReserva != null) {
      this.api.Reservas.getById(Number(this.IdReserva)).subscribe({
            next: (d) => {
              this.reserva = d;
              this.api.Reservas.getLinkQR(d.id).subscribe((q) => {
                let objectURL = URL.createObjectURL(q);
                this.QR = this.sanitizer.bypassSecurityTrustUrl(objectURL);
              });
              if (this.reserva != undefined) {
                switch (this.reserva.idEstadoReserva) {
                  case EnumEstadoReserva.Confirmada:
                    this.estadoReserva = 'verde';
                    break;
                  case EnumEstadoReserva.PagoPendiente:
                    this.estadoReserva = 'azul';
                    break;
                  case EnumEstadoReserva.Anulada:
                    this.estadoReserva = 'rojo';
                    break;
                }
              }
            },
            error: (err) => {
              this.reserva404Visible = true;
              this.loading.loadingOff();
            },
            complete: () => this.loading.loadingOff(),
          });
        
      
    } else if (NReserva != null) {

      if(NReserva.idEstadoReserva == EnumEstadoReserva.Anulada)
      {
        sessionStorage.removeItem('reserva');
        const modalRef = this.modalService.open(ModalError);
        modalRef.componentInstance.error = "Se ha cancelado la reserva. Demasiados intentos de pago. (Too many retries)."; 
        this.loading.loadingOff()
        this.buscarReservaVisible = true;
      }
      else{
        this.PagarReserva = true;
        this.NuevaReserva = NReserva;
        this.estadoReserva = 'azul';
            let hoy = new Date();
            let segundos =
              300 -
              millisecondsToSeconds(
                getTime(hoy) - getTime(this.NuevaReserva.fechaIngreso)
              );
            this.timer.leftTime = segundos;
            if (segundos <= 0 ) {
              sessionStorage.removeItem('reserva');
              const modalRef = this.modalService.open(ModalError);
              modalRef.componentInstance.error = "Se agotó el tiempo para realizar el pago (Payment timeout)."; 
              delay(5000)
              location.reload()
            }
            this.loading.loadingOff();        
        this.route.queryParams.subscribe((q) => {
          if (q['token_ws'] != undefined) {
            this.loading.loadingOn()
            this.api.Reservas.ConfirmarReserva(this.NuevaReserva,q['token_ws']).subscribe({
              next : r=> {
                sessionStorage.removeItem('reserva');
                location.replace('mi-reserva/' + r.id);
              },
              error: err =>{
                const modalRef = this.modalService.open(ModalError);
                modalRef.componentInstance.error = err.error; 
                this.loading.loadingOff();
  
              }
            })
            
          }else{
            this.loading.loadingOff();        
          }
        })
      }
      
    } else {
      this.buscarReservaVisible = true;
      this.loading.loadingOff();
    }
  }
  estadoReserva!: string;
  QR!: SafeUrl;
  buscarReservaVisible!: boolean;
  reserva404Visible = false;
  timer = { leftTime: 0, notify: 0 };
  handleEvent(e: CountdownEvent) {
    if (e.left == 0) location.reload();
    
  }
}
@Component({
	selector: 'modal-err',
	standalone: true,
	template: `
		<div class="modal-header">
			<h4 class="modal-title">Error</h4>
			<button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
		</div>
		<div class="modal-body">
			<p>{{error}}</p>
		</div>
		<div class="modal-footer">
			<button type="button" class="btn btn-outline-dark" (click)="activeModal.dismiss();">Ok</button>
		</div>
	`,
})
export class ModalError {
	activeModal = inject(NgbActiveModal);

	@Input() error!: string;
}