import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./views/home/home.component').then((m) => m.HomeComponent) },
  { path: 'servicios', loadComponent: () => import('./views/servicios/servicios.component').then((m) => m.ServiciosComponent) },
  { path: 'contacto', loadComponent: () => import('./views/contacto/contacto.component').then((m) => m.ContactoComponent) },
  { path: 'reservar', loadComponent: () => import('./views/reservar/reservar.component').then((m) => m.ReservarComponent) },
  { path: 'mi-reserva/:id', loadComponent: () => import('./views/mi-reserva/mi-reserva/mi-reserva.component').then((m) => m.MiReservaComponent) },
  { path: 'mi-reserva', loadComponent: () => import('./views/mi-reserva/mi-reserva/mi-reserva.component').then((m) => m.MiReservaComponent) },
  { path: 'admin', loadComponent: () => import('./views/admin/admin.component').then((m) => m.AdminComponent) },
  { path: '403', loadComponent: () => import('./views/base/errores/forbidden/forbidden/forbidden.component').then((m) => m.ForbiddenComponent) },
  { path: '500', loadComponent: () => import('./views/base/errores/internal-error/internal-error.component').then((m) => m.InternalErrorComponent) },
  { path: '**', pathMatch: 'full', loadComponent: () => import('./views/base/errores/not-found/not-found.component').then((m) => m.NotFoundComponent) },
];
