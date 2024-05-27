import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule, Location } from '@angular/common';
import { HomeComponent } from './views/home/home.component';
import { NavbarComponent } from './views/base/navbar/navbar.component';
import { LoadingComponent } from './views/base/loading/loading.component';
import { FooterComponent } from "./views/base/footer/footer/footer.component";
import { environment } from '../environments/environment';

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
    imports: [RouterOutlet, TranslateModule, NavbarComponent, HomeComponent, LoadingComponent, FooterComponent,CommonModule]
})
export class AppComponent {
  esHome = false;
  demo = !environment.production
  constructor(private router: Router, private location: Location) {}

  ngOnInit(): void {
    //check si home
    this.esHome = this.location.path() == '';
  }



}
