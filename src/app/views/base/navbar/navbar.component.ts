import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, NgbDropdownModule, TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {

  constructor(public translateService: TranslateService)
  {
    const userLang = localStorage.getItem('lang') || 'es-CL';
    this.translateService.setDefaultLang(userLang);    
  }

  lang = '';
  nombreIdiomaPrincipal = '';
  banderaPrincipal = '';
  nombreIdiomaSecundaria = '';
  banderaSecundaria = '';

  ngOnInit(): void {
    this.lang = localStorage.getItem('lang') || 'es-CL';   
    this.CambiarSelector(); 
  }

  CambiarSelector(): void {
    switch (this.lang) {
      case 'es-CL':
        this.nombreIdiomaPrincipal = 'Español';
        this.nombreIdiomaSecundaria = 'English';

        this.banderaPrincipal = 'fi fi-cl';
        this.banderaSecundaria = 'fi fi-us';

        break;
      case 'en-US':
        this.nombreIdiomaPrincipal = 'English';
        this.nombreIdiomaSecundaria = 'Español';

        this.banderaPrincipal = 'fi fi-us';
        this.banderaSecundaria = 'fi fi-cl';
        break;
      default:
        break;
    }
  }

  CambiarIdioma(lang: any) {
    localStorage.setItem('lang', lang);
    this.translateService.use(lang);
    this.ngOnInit();
  }
}
