import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { TranslateModule } from '@ngx-translate/core';
import { MapaComponent } from '../../views/base/mapa/mapa.component';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    GoogleMapsModule,
    MapaComponent
  ],
  templateUrl: './contacto.component.html',
  styleUrl: './contacto.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactoComponent { }
