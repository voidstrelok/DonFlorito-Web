import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import {
  CalendarDayViewComponent,
  CalendarModule,
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarView,
  CalendarWeekViewBeforeRenderEvent,
} from 'angular-calendar';

import {
  format,
sub
} from 'date-fns';
import { Observable, Subject, elementAt, min } from 'rxjs';
import { EventColor } from 'calendar-utils';
import { ParametrosDTO } from '../../../../models/ParametrosDTO';
import { ReservaDTO } from '../../../../models/ReservaDTO';

import { WeekViewHour, WeekViewHourColumn } from 'calendar-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { APIService } from '../../../../services/api.service';
import { LoadingService } from '../../../../services/loading.service';
import { TipoServicioDTO } from '../../../../models/TipoServicioDTO';
import { ContenedorEventosDTO } from '../../../../models/ContenedorEventosDTO';
import { ReservaServicioCreacionDTO } from '../../../../models/ReservaServicioCreacionDTO';
import { EnumTipoServicio } from '../../../../models/enum/EnumTipoServicio';
import { EnumServicio } from '../../../../models/enum/EnumServicio';

const colors: Record<string, EventColor> = {
  red: {
    primary: '#ad2121',
    secondary: '#FAE3E3',
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF',
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#FDF1BA',
  },
};


@Component({
  selector: 'selector-servicio',
  standalone: true,
  imports: [
    CommonModule,
    CalendarModule, TranslateModule
  ],
  templateUrl: './selector-servicio.component.html',
  styleUrl: './selector-servicio.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Default,
})
export class SelectorServicioComponent implements OnInit{
  
  horariosel! : ReservaServicioCreacionDTO
  imgMapa = ""
  disponibleDesde = ""
  hasta = ""
AgregarAlCarro() {  
  let btn = document.getElementById("btn-guardar") as HTMLButtonElement
  let select = document.getElementById("sel-disponibilidad") as HTMLSelectElement
  btn.disabled = true;
  if (select.selectedIndex != 0)
    this.horarioSeleccionado.emit({horario: this.horariosel , totalPrecio: this.totalPrecio})
}


CambioZonaQuinchos() {
let seleccion = document.getElementById("sel-quincho") as HTMLSelectElement
if(seleccion)
  {
    if(seleccion.value != "0")
      {
        switch(Number(seleccion.value)){
          case EnumServicio.QuinchosZonaPiscinas:
            this.posicionMapa = "quinchos-piscinas"
            break
          case EnumServicio.QuinchosZonaCanchas:
            this.posicionMapa = "quinchos-canchas"
            break
        }
        this.zonaQuinchoSeleccionado.emit({idQuincho: Number(seleccion.value)})
      }else{
        this.posicionMapa = "mapa-default"
      }
    
  }

}
HorarioSeleccionado($event : Event) {
  let btn = document.getElementById("btn-guardar") as HTMLButtonElement
  let select = $event.target as HTMLSelectElement
  if(select.selectedIndex!= 0)
    {
      btn.disabled = false;
    }else{
      btn.disabled = true;

    }
  let horario = this.horariosDisponibles[select.selectedIndex-1]  
  let nombre = this.tipoServicio?.servicio.find(s=>s.id == this.selectedServicio)?.nombre as string
  let precio = this.tipoServicio?.precioServicio[0]
  let minutos = this.tipoServicio?.precioServicio[0].minutos as number
  this.horariosel = {
    horaComienzo: horario.horaComienzo, 
    idServicio:this.selectedServicio , 
    cantidad : this.selectedPartidos, 
    idTipoServicio: this.idTipoServicio,
    nombre: nombre,
    precio: precio?.precio as number,
    idPrecioServicio: precio?.id as number,
    minutos: minutos
  }  
}

CambioCanchaPartidos() {
  let cancha = document.getElementById("sel-cancha") as HTMLSelectElement
  let partidos = document.getElementById("sel-partidos") as HTMLInputElement  
  this.api.Servicios.getCalendarioByServicio(Number(cancha.value),Number(partidos.value),this.fechaReserva).subscribe(d=>{
    this.reservas = d
    this.selectedPartidos = Number(partidos.value)
    this.selectedServicio = Number(cancha.value)
    this.refrescarCalendario()
  })
}
refrescarCalendario(){
 
  this.events = [] 
  this.horariosDisponibles = []

  let numInput = document.getElementById('sel-partidos') as HTMLInputElement
  this.reservas?.forEach(reserva => {
    let comienzo =  new Date(reserva.horaComienzo)
    let fin = new Date(reserva.horaFinal)      
    if(reserva.reservado)//mover codigo a la api service
    {
      this.events.push( {
        start: comienzo,
        end: fin, 
        title: "No Disponible",
        cssClass:"calendario-reservado"       
      })
    }else
    {
      this.translate.get("disponible-desde").subscribe(r=>{
        this.disponibleDesde=r
        this.translate.get("hasta").subscribe(r=>{
          this.hasta=r
          this.events.push( {
            start: comienzo,
            end: fin, 
            title: this.disponibleDesde+" "+format(comienzo,"p")+" "+this.hasta+" "+format(fin,"p"),
            cssClass:"calendario-disponible"
          })
          this.horariosDisponibles.push({
            horaComienzo : reserva.horaComienzo,
            horaFinal: reserva.horaFinal,
            texto: format(comienzo,"p")+" "+this.hasta+" "+format(fin,"p")
          })
          this.refresh.next();
        })
      })      
    }
  })    

}
totalPrecio: any;
totalMinutos: any;
  constructor(private api : APIService, private loading : LoadingService, private translate: TranslateService){}
  @Input({ required: true }) idTipoServicio!: number;
  @Input({ required: true }) fechaReserva!: string;
  @Output() horarioSeleccionado = new EventEmitter<{horario: ReservaServicioCreacionDTO, totalPrecio:number}>()
  @Output() zonaQuinchoSeleccionado = new EventEmitter<{idQuincho: number}>()
  //variables emitidas
  selectedServicio : number = 0
  selectedPartidos : number = 0
  /////////////////////////////////////

  partidos!: number;
  minutos!: number; 
  parametros!: ParametrosDTO;
  selectedDayViewDate!: Date;
  hourColumns!: WeekViewHourColumn[];
  tipoServicio$!: Observable<TipoServicioDTO>;
  tipoServicio!: TipoServicioDTO;
  reservas$? : Observable<ContenedorEventosDTO[]>
  reservas?: ContenedorEventosDTO[];
  events: CalendarEvent[] = [];
  horariosDisponibles = [{horaComienzo : new Date(), horaFinal:new Date(), texto: ""}]
  posicionMapa ="mapa-default"
  consulta$ = true
  refresh = new Subject<void>();

  segmentos = 1
  apertura = 0
  cierre = 0
  nombreServicioModal!: string;
  numeroPartidos=1
  maxPartidos = 6
  esModalQuincho= false
  ngOnInit()
  {    
    
    
    this.esModalQuincho = this.idTipoServicio == EnumTipoServicio.Quincho; 
    
    this.loading.loadingOn()
    let fechasplit = this.fechaReserva.split('-')
    this.viewDate = new Date(Number(fechasplit[2]),Number(fechasplit[1])-1,Number(fechasplit[0]))    

    this.selectedPartidos = 1

    this.api.Session.getParametros().subscribe(p =>{
      this.parametros = p;
      this.tipoServicio$ = this.api.Servicios.GetTipoServicioById(this.idTipoServicio)
      this.tipoServicio$.subscribe(ts=> {
        this.tipoServicio = ts; 
        if(!this.esModalQuincho)   {
          this.reservas$ = this.api.Servicios.getCalendarioByServicio(this.tipoServicio.servicio[0].id,1,this.fechaReserva)
          this.reservas$.subscribe(r=>{
            this.reservas = r;    
            console.log(this.parametros);
            
            if(this.tipoServicio?.precioServicio[0].minutos)
            {
              this.selectedServicio = this.tipoServicio.servicio[0].id
              this.minutos= this.tipoServicio.precioServicio[0].minutos*1
              this.apertura = new Date(this.parametros.horaApertura).getHours()
              this.cierre = new Date(sub(this.parametros.horaCierre,{minutes: this.minutos})).getHours()
              this.maxPartidos = Math.round(((this.cierre - this.apertura) / (this.minutos/60) )+1)

            }          
            this.calcularTotalServicio()
            this.refrescarCalendario()          
          })
        } else{
          this.CambioZonaQuinchos()
        }        
        this.loading.loadingOff()
          
      })
    }) 
    
  }
  
  view: CalendarView = CalendarView.Day;

  CalendarView = CalendarView;
  viewDate: Date = new Date()
  
  hourSegmentClicked(date: Date) {    
    this.selectedDayViewDate = date;
    this.addSelectedDayViewClass();
  }
  
  beforeWeekOrDayViewRender(event: CalendarWeekViewBeforeRenderEvent) {
    this.hourColumns = event.hourColumns;
    this.addSelectedDayViewClass();
  }
  private addSelectedDayViewClass() {
    this.hourColumns.forEach((column) => {
      column.hours.forEach((hourSegment) => {
        hourSegment.segments.forEach((segment) => {
          delete segment.cssClass;
          if (
            this.selectedDayViewDate &&
            segment.date.getTime() === this.selectedDayViewDate.getTime()
          ) {
            segment.cssClass = 'cal-day-selected';            
          }
        });
      });
    });
  }
  
  InputEntradasOnChange(event: Event) {
    let valor = Number((event.target as HTMLInputElement).value);
    if (valor < 0 || valor == 0) {
      (event.target as HTMLInputElement).value = '1';
    }
    else if(valor > this.maxPartidos)
    {
      (event.target as HTMLInputElement).value = this.maxPartidos.toString();
    }
    this.CambioCanchaPartidos()
  }

  calcularTotalServicio() {
    let labelTotal = document.getElementById('LBTotal');
    let labelTotalMinutos = document.getElementById('LBTotalMin');
    let numInput = document.getElementById('sel-partidos') as HTMLInputElement
    if (labelTotal && labelTotalMinutos) {
      labelTotal.innerText = String(Number(numInput.value) * Number(this.tipoServicio?.precioServicio[0].precio));
      labelTotalMinutos.innerText = String(Number(numInput.value) * Number(this.tipoServicio?.precioServicio[0].minutos));
    }
  }
 }
