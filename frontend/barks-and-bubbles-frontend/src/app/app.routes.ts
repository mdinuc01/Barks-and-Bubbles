import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AppointmentPageComponent } from './components/appointment-page/appointment-page.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './services/AuthGuard';
import { ClientPageComponent } from './components/client-page/client-page.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'appointment/:id',
    component: AppointmentPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'client/:id',
    component: ClientPageComponent,
    canActivate: [AuthGuard],
  },
];
