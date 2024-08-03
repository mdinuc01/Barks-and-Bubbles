import { CommonModule } from '@angular/common';
import { DataService } from './../../services/data.service';
import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Init } from 'v8';

interface Appointment {
  location: any;
  app: {
    _id: string;
    location: [];
  };
}

@Component({
  selector: 'app-appointment-client-list',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    CommonModule,
  ],
  templateUrl: './appointment-client-list.component.html',
  styleUrl: './appointment-client-list.component.scss',
})
export class AppointmentClientListComponent implements OnInit {
  @Input() appointment!: Appointment;
  @Input() addToList!: Boolean;

  petsWithLocations = [];

  constructor(private DataService: DataService) {}

  ngOnInit() {
    this.DataService.petsWithLocation$.subscribe((response) => {
      this.petsWithLocations = response.data;
    });

    this.DataService.getPetsWithLocations(this.appointment.app._id);
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  getObjectValue(obj: any): any[] {
    return Object.values(obj);
  }

  getNumOfClients(obj: [any]) {
    let obj1 = Object.values(obj);
    let obj2 = Object.values(obj1);

    return obj2[0].length;
  }

  updateStatus(id: any, status: any, location: String) {
    this.DataService.updatePetStatusApp(id, status, this.appointment.app._id);
  }

  addPetToReplyList(clientId: string) {
    this.DataService.addToReply(this.appointment.app._id, clientId);
  }
}
