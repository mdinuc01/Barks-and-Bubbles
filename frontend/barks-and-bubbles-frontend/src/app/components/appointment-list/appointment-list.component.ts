import { MatCardModule } from '@angular/material/card';
import { DataService } from './../../services/data.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    MatCardModule,
    CommonModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
  ],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.scss',
})
export class AppointmentListComponent implements OnInit {
  appointments: any[] = [];
  formatDate = this.DataService.formatDate;

  constructor(private DataService: DataService, public router: Router) {}

  ngOnInit(): void {
    this.DataService.appointments$.subscribe((apps) => {
      this.appointments = apps;
    });

    this.DataService.getAllAppointments();
  }

  formatLocations(locations: string[]) {
    return locations.toString().replaceAll(',', ', ');
  }

  viewAppointment(app: any) {
    this.DataService.showLoader();
    this.router.navigate(['appointment/', app._id]);
  }
}
