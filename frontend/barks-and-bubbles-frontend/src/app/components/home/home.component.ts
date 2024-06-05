import { Component } from '@angular/core';
import { ClientListComponent } from '../client-list/client-list.component';
import { MatButtonModule } from '@angular/material/button';
import { AppointmentListComponent } from '../appointment-list/appointment-list.component';
import { LoaderService } from '../../services/loader/loader.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [
    ClientListComponent,
    MatButtonModule,
    AppointmentListComponent,
    LoaderService,
  ],
})
export class HomeComponent {}
