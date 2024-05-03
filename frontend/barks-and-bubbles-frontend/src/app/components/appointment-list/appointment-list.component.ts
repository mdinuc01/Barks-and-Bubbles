import { MatCardModule } from '@angular/material/card';
import { DataService } from './../../services/data.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

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

  constructor(private DataService: DataService) {}

  ngOnInit(): void {
    this.DataService.appointments$.subscribe((apps) => {
      this.appointments = apps;
    });

    this.DataService.getAllAppointments();
  }

  formatLocations(locations: string[]) {
    return locations.toString().replaceAll(',', ', ');
  }
}
