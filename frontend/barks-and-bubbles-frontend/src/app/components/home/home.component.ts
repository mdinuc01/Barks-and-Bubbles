import { Component } from '@angular/core';
import { FileReaderComponent } from '../file-reader-component/file-reader-component.component';
import { ClientListComponent } from '../client-list/client-list.component';
import { MatButtonModule } from '@angular/material/button';
import { AppointmentListComponent } from '../appointment-list/appointment-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [
    FileReaderComponent,
    ClientListComponent,
    MatButtonModule,
    AppointmentListComponent,
  ],
})
export class HomeComponent {}
