import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  NgbCarousel,
  NgbCarouselModule,
  NgbSlideEvent,
  NgbSlideEventSource,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule, TranslateModule, NgbCarouselModule],
  templateUrl: './servicios.component.html',
  styleUrl: './servicios.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ServiciosComponent implements OnInit {
  constructor(private http: HttpClient) {}
  ngOnInit(): void {}
  imgCanchas = this.cargarImagenes('canchas',6);
  imgQuinchos = this.cargarImagenes('quinchos',7);
  imgPiscinas = this.cargarImagenes('piscinas',8);
  imgTenis = this.cargarImagenes('tenis',0);

  imagenes!: string[];
  cargarImagenes(tipo: string,max:number): string[] {
    let imagenes = [];
    let i = 1;
    let continua = true;
    while (i<=max) {
        imagenes.push(environment.URL + 'assets/res/fotos/' + tipo + '/' + i.toString() + '.jpg');
        i+=1
    }
    return imagenes;
  }

  paused = false;
  unpauseOnArrow = false;
  pauseOnIndicator = false;
  pauseOnHover = true;
  pauseOnFocus = true;
  @ViewChild('carousel', { static: true })
  carousel!: NgbCarousel;

  togglePaused() {
    if (this.paused) {
      this.carousel.cycle();
    } else {
      this.carousel.pause();
    }
    this.paused = !this.paused;
  }

  onSlide(slideEvent: NgbSlideEvent) {
    if (
      this.unpauseOnArrow &&
      slideEvent.paused &&
      (slideEvent.source === NgbSlideEventSource.ARROW_LEFT ||
        slideEvent.source === NgbSlideEventSource.ARROW_RIGHT)
    ) {
      this.togglePaused();
    }
    if (
      this.pauseOnIndicator &&
      !slideEvent.paused &&
      slideEvent.source === NgbSlideEventSource.INDICATOR
    ) {
      this.togglePaused();
    }
  }
}
