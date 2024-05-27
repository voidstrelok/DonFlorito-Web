import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-internal-error',
  standalone: true,
  imports: [
    CommonModule,    TranslateModule

  ],
  templateUrl: './internal-error.component.html',
  styleUrl: './internal-error.component.css',
})
export class InternalErrorComponent implements OnInit {

  ngOnInit(): void { }

}
