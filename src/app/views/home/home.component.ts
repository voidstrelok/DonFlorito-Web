import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

import { RouterLink } from '@angular/router';
import { MapaComponent } from '../../views/base/mapa/mapa.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    RouterLink,
    MapaComponent

  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent { 

  scroll(element : string) {
    var elemento = document.getElementById(element);
    var headerOffset = 75;
    var elementPosition = elemento?.getBoundingClientRect().top ?? 0;
    var offsetPosition = elementPosition + window.scrollY - headerOffset;
  
    window.scrollTo({
         top: offsetPosition,
         behavior: "smooth"
    });
  } 

}
