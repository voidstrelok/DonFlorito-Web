import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { environment } from '../../../../environments/environment';
import { Loader } from "@googlemaps/js-api-loader"

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [
    CommonModule,
    GoogleMapsModule
  ],
  templateUrl:'./mapa.component.html',
  styleUrl: './mapa.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class MapaComponent {  

  constructor(httpClient: HttpClient) {
    const mapOptions = {
      center: {
        lat: -29.9528848,
        lng: -71.2521104
      },
      zoom: 18,
      mapTypeId : 'hybrid',
      mapId:"123"
    };

    const loader = new Loader({
      apiKey: environment.GAPIKey,
      version: "weekly",
    });

    let mapa : google.maps.Map;
    loader.importLibrary('maps').then(({Map}) => {
      mapa = new Map(document.getElementById("map") as HTMLElement, mapOptions)
      loader.importLibrary('marker').then(({AdvancedMarkerElement}) => {
        new AdvancedMarkerElement({position:{
          lat: -29.9528848,
          lng: -71.252003
        },map:mapa});
      }).catch((e) => {  // do something
        
      })
    }).catch((e) => {  // do something
      
    })    
  } 
 }
