import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-pagos',
  standalone: true,
  imports: [
    CommonModule,
  ],
  template: `<p>admin-pagos works!</p>`,
  styleUrl: './admin-pagos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPagosComponent { }
