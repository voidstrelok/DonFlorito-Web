import { Routes } from '@angular/router';
import { HomeComponent } from './views/home/home.component';
import { ServiciosComponent } from './views/servicios/servicios.component';
import { NotFoundComponent } from './views/base/errores/not-found/not-found.component';
import { ContactoComponent } from './views/contacto/contacto.component';
import { ReservarComponent } from './views/reservar/reservar.component';
import { MiReservaComponent } from './views/mi-reserva/mi-reserva/mi-reserva.component';
import { AdminComponent } from './views/admin/admin.component';
import { ForbiddenComponent } from './views/base/errores/forbidden/forbidden/forbidden.component';
import { InternalErrorComponent } from './views/base/errores/internal-error/internal-error.component';

export const routes: Routes = [
    {'path' : '' , component:HomeComponent},
    {'path' : 'servicios' , component:ServiciosComponent},
    {'path' : 'contacto' , component:ContactoComponent},
    {'path' : 'reservar' , component:ReservarComponent},
    {'path' : 'mi-reserva/:id' , component:MiReservaComponent},
    {'path' : 'mi-reserva' , component:MiReservaComponent},
    {'path' : 'admin' , component:AdminComponent},
    {'path' : '403', component: ForbiddenComponent }, 
    {'path' : '500', component: InternalErrorComponent }, 

    //404
    {'path' : '**', pathMatch: 'full', component: NotFoundComponent }, 

];
