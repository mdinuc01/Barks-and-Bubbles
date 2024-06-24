import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AppointmentPageComponent } from './components/appointment-page/appointment-page.component';
import { LoginComponent } from './components/login/login.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'appointment/:id',
    component: AppointmentPageComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
];
