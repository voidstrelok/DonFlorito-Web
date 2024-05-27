import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [
    CommonModule,    TranslateModule

  ],
  templateUrl: './forbidden.component.html',
  styleUrl: './forbidden.component.css',
})
export class ForbiddenComponent implements OnInit {

  ngOnInit(): void { }

}
