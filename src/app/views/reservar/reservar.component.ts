import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, TemplateRef, inject } from '@angular/core';
import {MatDatepickerInputEvent, MatDatepickerModule} from '@angular/material/datepicker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ServiciosService } from '../../services/servicios.service';
import { CatalogoComponent } from './catalogo/catalogo.component';
import { LoadingService } from '../../services/loading.service';
import { TipoServicioDTO } from '../../models/TipoServicioDTO';
import { EMPTY, Observable, elementAt } from 'rxjs';
import { provideNativeDateAdapter } from '@angular/material/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import { APIService } from '../../services/api.service';
import { ParametrosDTO } from '../../models/ParametrosDTO';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SelectorServicioComponent } from './catalogo/selector-servicio/selector-servicio.component';
import { daysToWeeks } from 'date-fns';
import { LoadingComponent } from "../base/loading/loading.component";
import { RutModel, formatRut, isRutValid } from '@ftapiat/js-rut-utils';
import { ReservaCreacionDTO } from '../../models/ReservaCreacionDTO';
import { HtmlParser } from '@angular/compiler';
import { ReservaServicioCreacionDTO } from '../../models/ReservaServicioCreacionDTO';
import { DeferBlockFixture } from '@angular/core/testing';
import { PersonaDTO } from '../../models/PersonaDTO';
import { PersonaCreacionDTO } from '../../models/PersonaCreacionDTO';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-reservar',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  templateUrl: './reservar.component.html',
  styleUrl: './reservar.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [
    CommonModule,
    TranslateModule,
    CatalogoComponent,
    MatDatepickerModule,
    MatFormFieldModule,
    SelectorServicioComponent,
    LoadingComponent,
  ],
})
export class ReservarComponent implements OnInit {
carroEnviado = false;

  carroVisible = true;
  personaVisible = false;
  formularioVisible = false;
  resumenVisible = false;

  fechaReserva = '';
  rut: string = '';
  persona!: PersonaDTO;
  primerNombre: string = '';
  segundoNombre: string = '';
  apellidoPaterno: string = '';
  apellidoMaterno: string = '';
  email: string = '';
  telefono: string = '';

  catalogo$!: TipoServicioDTO[];
  params!: ParametrosDTO;
  private modalService = inject(NgbModal);
  carroReady = false;

  constructor(
    private api: APIService,
    private loadingservice: LoadingService,
    private translateservice: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadingservice.loadingOn();
    this.api.Session.getParametros().subscribe({
      next: d =>{
        this.params = d;
        if (!this.params.reservasEnabled) {
          location.replace('403');
        } else {
          this.loadingservice.loadingOff();
        }
      },
      error: err => location.replace("403")
    })
  }
  open(content: TemplateRef<any>) {
		this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
			(result) => {
			},
			(reason) => {
			},
		);
	}

  enviarCarro() {

    this.loadingservice.loadingOn();    
    this.api.Reservas.NuevaReserva(this.reserva).subscribe({
      next: r => {
        sessionStorage.setItem("reserva",JSON.stringify(r))
        location.replace("mi-reserva")
        this.loadingservice.loadingOff();
      },
      error: (err : HttpErrorResponse) =>{
        this.loadingservice.loadingOff()
        const modalRef = this.modalService.open(ModalError);
        modalRef.componentInstance.error = err.error;        
      }
    }) 
  }

  cancelarReserva() {
    location.reload(); 
  }

  getTotalCarro() {
    let total = 0;
    this.reserva.reservaServicio.forEach((i) => {
      total += i.cantidad * i.precio;
    });
    return total;
  }

  personaCreacion : PersonaCreacionDTO ={ rut:"",segundoNombre:"",apellidoMaterno:"",apellidoPaterno:"",email:"",nombre:"",telefono:0}
  irAlPago() {
    this.resetFormulario();
    if (this.validarFomulario()) {
      let rutDb = RutModel.fromString((
        document.getElementById('Rut') as HTMLInputElement
      ).value.trim())
      this.personaCreacion.rut =  rutDb.number.toString() +"-"+rutDb.dv.toString()
      this.personaCreacion.nombre = (
        document.getElementById('PrimerN') as HTMLInputElement
      ).value.trim();
      this.personaCreacion.segundoNombre = (
        document.getElementById('SegundoN') as HTMLInputElement
      ).value.trim();
      this.personaCreacion.apellidoPaterno = (
        document.getElementById('ApellidoP') as HTMLInputElement
      ).value.trim();
      this.personaCreacion.apellidoMaterno = (
        document.getElementById('ApellidoM') as HTMLInputElement
      ).value.trim();
      this.personaCreacion.email = (
        document.getElementById('Email') as HTMLInputElement
      ).value.trim();
      this.personaCreacion.telefono = Number((
        document.getElementById('Telefono') as HTMLInputElement
      ).value.trim());

      if(this.persona != undefined){
        this.reserva.idPersona = this.persona.id;
      }else{
        this.reserva.personaCreacion = this.personaCreacion
      }

      this.MuestraResumen();
      window.scrollTo({
        top: 0,
        behavior: "smooth"
   });
    }
  }
  MuestraResumen() {
    this.resumenVisible = true;
    this.personaVisible = false;
  }
  reserva!: ReservaCreacionDTO;

  resetFormulario() {
    this.resetInput('PrimerN');
    this.resetInput('SegundoN');
    this.resetInput('ApellidoP');
    this.resetInput('ApellidoM');
    this.resetInput('Email');
    this.resetInput('Telefono');
  }
  validarFomulario(): boolean {
    return (
      this.validarInput('PrimerN', 1) &&
      this.validarInput('SegundoN', 1) &&
      this.validarInput('ApellidoP', 1) &&
      this.validarInput('ApellidoM', 1) &&
      this.validarInput('Email', 3) &&
      this.validarInput('Telefono', 2)
    );
  }
  muestraError(element: string, txterror: string) {
    let el = document.getElementById('DIV' + element) as HTMLElement;
    let error = document.getElementById(
      'DIV' + element + 'Error'
    ) as HTMLElement;
    this.translateservice.get(txterror).subscribe((t) => (error.innerText = t));
    el.classList.add('error');
  }

  resetInput(element: string) {
    let el = document.getElementById('DIV' + element) as HTMLElement;
    let error = document.getElementById(
      'DIV' + element + 'Error'
    ) as HTMLElement;
    error.innerText = String.fromCharCode(160);
    el.classList.remove('error');
  }

  validarInput(element: string, tipo: number): boolean {
    let el = document.getElementById(element) as HTMLInputElement;
    let error = document.getElementById(element + 'Error') as HTMLElement;
    let valor = el.value;
    let soloTexto = new RegExp(
      '^[a-zA-ZÀ-ÿ\\u00f1\\u00d1]+(\\s*[a-zA-ZÀ-ÿ\\u00f1\\u00d1]*)*[a-zA-ZÀ-ÿ\\u00f1\\u00d1]+$'
    );
    let soloNumeros = new RegExp('^[0-9]*$');
    let email = new RegExp('^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$');
    if (valor.trim() == '') {
      this.muestraError(element, 'requerido');
      return false;
    }
    switch (tipo) {
      case 1: //solo texto
        if (!soloTexto.test(valor.trim())) {
          this.muestraError(element, 'error-solo-texto');
          return false;
        }
        break;
      case 2: //solo numeros
        if (!soloNumeros.test(valor.trim())) {
          this.muestraError(element, 'error-telefono');
          return false;
        } else if (valor.trim().length < 8) {
          this.muestraError(element, 'error-telefono');
          return false;
        }
        break;
      case 3: //mail
        if (!email.test(valor.trim())) {
          this.muestraError(element, 'error-mail');
          return false;
        }
        break;
    }
    return true;
  }

  buscarPersona() {
    this.resetInput('Rut');
    if (isRutValid(this.personaCreacion.rut)) {
      let rutmodel = RutModel.fromString(this.personaCreacion.rut);
      this.loadingservice.loadingOn();

      this.api.Personas.GetPersonaByRut(
        rutmodel.number + '-' + rutmodel.dv
      ).subscribe({
        next : r =>{

          this.persona = r;
          if (this.persona != null) {
            this.reserva.idPersona = this.persona.id
            this.MuestraDatosPersona();
          } else {
            this.formularioVisible = true;
          }
          this.loadingservice.loadingOff();
        },
        error : err=>{

        }
      })
    } else {
      this.muestraError('Rut', 'error-rut');
    }
  }
  formularioEnabled = true
  MuestraDatosPersona() {
    this.formularioVisible = true
    this.formularioEnabled = false
    this.personaCreacion = {
      rut : this.persona.rut,
      nombre : this.persona.nombre,
      segundoNombre:this.persona.segundoNombre,
      apellidoPaterno:this.persona.apellidoPaterno,
      apellidoMaterno:this.persona.apellidoMaterno,
      email:this.persona.email,
      telefono:this.persona.telefono
    }
  }
  
  regresarAlCarro() {
    this.carroVisible = true;
    this.personaVisible = false;
    window.scrollTo({
      top: 0,
      behavior: "smooth"
 });
  }

  catalogoEmit(event: ReservaCreacionDTO) {
    this.carroVisible = false;
    this.personaVisible = true;
    this.reserva = event;
    window.scrollTo({
      top: 0,
      behavior: "smooth"
 });
  }

  formatearRut(event: Event) {
    let input = event.target as HTMLInputElement;
    input.value = formatRut(input.value);
    this.personaCreacion.rut = formatRut(input.value);
  }


  FiltroFecha = (d: Date | null): boolean => {
    let date = d || new Date();
    let dia = date.getDay();
    let hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return date > hoy && dia !== 1; //TODO Controla martes a domingo
  };



  cambioFecha(event: MatDatepickerInputEvent<Date>) {
    this.loadingservice.loadingOn();
    let fecha = event.value;
    let hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fecha) {
      if (fecha >= hoy) {
        sessionStorage.removeItem('reserva');

        //si cambia fecha, resetear carro
        //cargar nuevas dispo
        this.api.Servicios.getCatalogo(this.fechaReserva).subscribe((data) => {
          if (data == null) location.replace("500");
          else this.catalogo$ = data;
          this.loadingservice.loadingOff();
        });
        this.fechaReserva = fecha.toLocaleString('es-CL').split(',')[0];
      } else {
        this.loadingservice.loadingOff();
      }
    } else {
      this.loadingservice.loadingOff();
    }
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