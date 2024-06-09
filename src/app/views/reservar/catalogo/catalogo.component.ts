import { CommonModule, registerLocaleData } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, LOCALE_ID, OnInit, Output, TemplateRef, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TipoServicioDTO } from '../../../models/TipoServicioDTO';
import { EnumTipoServicio } from '../../../models/enum/EnumTipoServicio';
import { EnumServicio } from '../../../models/enum/EnumServicio';
import { ReservaDTO } from '../../../models/ReservaDTO';
import { EstadoReservaDTO } from '../../../models/EstadoReservaDTO';
import { ReservaServicioDTO } from '../../../models/ReservaServicioDTO';
import { ServicioDTO } from '../../../models/ServicioDTO';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SelectorServicioComponent } from "./selector-servicio/selector-servicio.component";
import { ParametrosDTO } from '../../../models/ParametrosDTO';
import { APIService } from '../../../services/api.service';
import { Observable } from 'rxjs';
import { ContenedorEventosDTO } from '../../../models/ContenedorEventosDTO';
import { ReservaServicioCreacionDTO } from '../../../models/ReservaServicioCreacionDTO';
import { format } from 'date-fns';
import { ReservaCreacionDTO } from '../../../models/ReservaCreacionDTO';
import { LoadingComponent } from "../../base/loading/loading.component";

@Component({
    selector: 'app-catalogo',
    standalone: true,
    templateUrl: './catalogo.component.html',
    styleUrl: './catalogo.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, TranslateModule, SelectorServicioComponent, LoadingComponent]
})
export class CatalogoComponent implements OnInit {


CambioZonaQuinchos(event: Event) {
  let element = event.target as HTMLSelectElement
  let inputContainer = document.getElementById("NumQuinchos")  as HTMLElement
  let input = document.getElementById("entradasQuincho")  as HTMLInputElement
  inputContainer.hidden = element.value == "0";    
  input.value = "0";
  this.CarroQuitar(EnumTipoServicio.Quincho);

}
guardarCarro() {
    //check carro con items
  if(this.Carro.length == 0)
    {
    }else{
      let fechaajuste = this.fechaReserva.split('-')      
      this.reserva = {
        idPersona:null,
        personaCreacion:null,
        reservaServicio: this.Carro,
        fechaReserva: new Date(fechaajuste[2]+"-"+fechaajuste[1]+"-"+fechaajuste[0]),
        ordenCompra : null
      }      
      this.carroFinal.emit(this.reserva);     
    }



}
GuardarZonaQuincho($event: { idQuincho: number; }) {
  let texto = document.getElementById("zona-seleccionada") as HTMLElement
  let quincho = this.Quinchos?.servicio.find(s=>s.id == $event.idQuincho)
  if(quincho)
    texto.innerText = quincho.nombre
}
  //VARIABLES CARRO
  Carro: ReservaServicioCreacionDTO[] = [];
  totalCarro = 0;

  CarroAgregar(item: ReservaServicioCreacionDTO) {
    const pos = this.Carro.map((e) => e.idTipoServicio).indexOf(
      item.idTipoServicio
    );
    if (pos != -1) {
      this.Carro.splice(pos, 1);
    }
    this.Carro.push(item);
    this.CalcularTotal();
  }
  CarroQuitar(id: number) {
    let contenedor = document.getElementById(
      'seleccionado-cont' + id.toString()
    ) as HTMLElement;
    const pos = this.Carro.map((e) => e.idTipoServicio).indexOf(id);
    if(contenedor!= null){
      contenedor.hidden=true
    }

    let selector = document.getElementById(
      'selector-cancha' + id.toString()
    ) as HTMLElement;
    if(selector != null){
      selector.classList.remove("cancha-seleccionada")
      selector.classList.add("cancha-no-seleccionada")
    }


    if (pos != -1) {
      this.Carro.splice(pos, 1);
    }
    this.CalcularTotal();
  }
  CalcularTotal() {
    this.totalCarro = 0;
    this.Carro.forEach((item) => {
      let precio = this.catalogo?.find((a) => a.id == item.idTipoServicio);
      if (precio) {
        this.totalCarro += item.cantidad * precio.precioServicio[0].precio;
      }
    });
  }
  GuardarHorario(EventData: {
    horario: ReservaServicioCreacionDTO;
    totalPrecio: number;
  }) {
    let contenedor = document.getElementById(
      'seleccionado-cont' + EventData.horario.idTipoServicio.toString()
    ) as HTMLElement;
    if(contenedor!= null){
      contenedor.hidden=false
    }


    let selector = document.getElementById(
      'selector-cancha' + EventData.horario.idTipoServicio.toString()
    ) as HTMLElement;
    if(selector != null){
      selector.classList.remove("cancha-no-seleccionada")
      selector.classList.add("cancha-seleccionada")  
    }

    let header = document.getElementById(
      'seleccionado' + EventData.horario.idTipoServicio.toString()
    ) as HTMLElement;
    let totalservicio = document.getElementById(
      'totalservicio' + EventData.horario.idTipoServicio.toString()
    ) as HTMLElement;
    let precio = this.catalogo?.find(
      (a) => a.id == EventData.horario.idTipoServicio
    );
    header.innerText =
      EventData.horario.cantidad.toString() +
      ' partido desde ' +
      format(EventData.horario.horaComienzo as Date, 'p');
    if (precio)
      totalservicio.innerText =
        '$' +
        (
          precio.precioServicio[0].precio * EventData.horario.cantidad
        ).toString();
    this.CarroAgregar(EventData.horario);
  }
  @Input({ required: true }) catalogo!: TipoServicioDTO[];
  @Input({ required: true }) fechaReserva!: string;
  @Output() carroFinal = new EventEmitter<ReservaCreacionDTO>()
  EnumTipoServicio: typeof EnumTipoServicio = EnumTipoServicio;
  EnumServicio: typeof EnumServicio = EnumServicio;
  parametros = {} as ParametrosDTO;
  private modalService = inject(NgbModal);
  idServicioModal!: number;

  constructor(private api: APIService) {
    api.Session.getParametros().subscribe((d) => (this.parametros = d));
  }

  show: boolean = false;

  reserva: ReservaCreacionDTO = {
    idPersona: null,
    fechaReserva: new Date(),
    reservaServicio: this.Carro,
    personaCreacion: null,
    ordenCompra : null
  };

  hayCanchas = false;
  hayPiscina = false;
  hayQuincho = false;

  Quinchos = {} as TipoServicioDTO | undefined;
  Piscinas: TipoServicioDTO[] = [];
  ngOnInit(): void {    
    if (this.catalogo.length > 0) {
      this.hayCanchas =
        this.catalogo.find(
          (tipo) =>
            tipo.id != EnumTipoServicio.Quincho &&
            tipo.id != EnumTipoServicio.PiscinaGeneral &&
            tipo.id != EnumTipoServicio.PiscinaAM
        ) != null;
      this.hayQuincho =
        this.catalogo.find((tipo) => tipo.id === EnumTipoServicio.Quincho) != undefined;
      this.hayPiscina =
        this.catalogo.find(
          (tipo) =>
            tipo.id === EnumTipoServicio.PiscinaAM ||
            tipo.id === EnumTipoServicio.PiscinaAM
        ) != null;

      if (this.hayQuincho) {
        this.Quinchos = this.catalogo.find(
          (tipo) => tipo.id === EnumTipoServicio.Quincho
        );
      }
      if (this.hayPiscina) {
        this.Piscinas.push(
          this.catalogo.find(
            (tipo) => tipo.id === EnumTipoServicio.PiscinaGeneral
          ) as TipoServicioDTO
        );
        this.Piscinas.push(
          this.catalogo.find(
            (tipo) => tipo.id === EnumTipoServicio.PiscinaAM
          ) as TipoServicioDTO
        );
      }
    }
  }

  servicioOnChange(id: number, event: Event) {
    let DetalleServicio = document.getElementsByClassName(
      'Detalle' + id.toString()
    );
    let CBServicio = document.getElementById(
      'CB' + id.toString()
    ) as HTMLInputElement;

    if (DetalleServicio && CBServicio) {
      for (let i = 0; i < DetalleServicio.length; i++) {
        (DetalleServicio.item(i) as HTMLElement).hidden = !CBServicio.checked;
      }

      if (!CBServicio.checked) {
        this.CarroQuitar(id);
      }
    }
  }

  InputEntradasOnChange(event: Event, max: number, tipoServicio: number) {
    let valor = Number((event.target as HTMLInputElement).value);
    if (valor > max || valor < 0) {
      (event.target as HTMLInputElement).value = '0';
    } else if (valor != 0) {
      let tiposervicio = this.catalogo?.find((c) => c.id == tipoServicio);
      if (tiposervicio) {
        let item: ReservaServicioCreacionDTO = {
          idTipoServicio: tiposervicio.id,
          cantidad: valor,
          idServicio: tiposervicio.servicio[0].id,
          horaComienzo: undefined,
          nombre: tiposervicio.servicio[0].nombre,
          precio: tiposervicio.precioServicio[0].precio,
          idPrecioServicio: tiposervicio.precioServicio[0].id,
          minutos: 0,

        };
        if(tipoServicio == EnumTipoServicio.Quincho)
          {
            let quincho = document.getElementById("sel-quincho")  as HTMLSelectElement
            let service = tiposervicio?.servicio.find(s=>s.id == Number(quincho.value))
            item.idServicio = Number(quincho.value)
            item.nombre = service?.nombre as string
          }
        this.CarroAgregar(item);
        

      }
    } else if(valor == 0) {
      this.CarroQuitar(tipoServicio);
    }
  }

  //variables modal
  nombreServicioModal: string = '';
  numeroPartidos = 0;
  minutos = 0;
  reservaciones = {} as ReservaDTO[];

  showModalHorario(content: TemplateRef<any>, idTipoServicio: number) {
    this.idServicioModal = idTipoServicio;
    let servicios = {} as TipoServicioDTO;
    if (this.catalogo) {
      servicios = this.catalogo.find(
        (tipo) => tipo.id == idTipoServicio
      ) as TipoServicioDTO;
    }
    if (servicios) {
      this.nombreServicioModal = servicios.nombre;
      this.fechaReserva = (
        document.getElementById('selector-fecha') as HTMLInputElement
      ).value;
    }

    this.modalService
      .open(content, {
        ariaLabelledBy: 'modal-basic-title',
        centered: true,
        size: 'lg',
      })
      .result.then(
        (result) => {
          //console.log('a');
        },
        (reason) => {
          //console.log('b');
        }
      );
  }
}
