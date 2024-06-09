import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgbModalConfig, NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { retry, delay } from 'rxjs';
import { ReservaDTO } from '../../../models/ReservaDTO';
import { APIService } from '../../../services/api.service';
import { LoadingService } from '../../../services/loading.service';
import { PersonaDTO } from '../../../models/PersonaDTO';

@Component({
  selector: 'admin-personas',
  standalone: true,
  imports: [
    CommonModule,NgbPaginationModule
  ],
  templateUrl: './admin-personas.component.html',
  styleUrl: './admin-personas.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class AdminPersonasComponent { 
  open(content: any) {
		this.modalService.open(content);
	}
pagina=1
elemPagina = 6
  constructor(private api : APIService,private loading : LoadingService, config: NgbModalConfig, private modalService: NgbModal){
    // customize default values of modals used by this component tree
		config.backdrop = 'static';
		config.keyboard = false;
  }
  $personas!: PersonaDTO[]
  
  
  ngOnInit(): void {
    this.loading.loadingOn()
    this.api.Personas.getPersonas().pipe(retry(3), delay(1000)).subscribe({
      next: r => {
        this.$personas = r        
        this.loading.loadingOff()
      },
      error: err=> location.reload()
      
    })
  }
}
