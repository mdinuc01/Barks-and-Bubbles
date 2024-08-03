import { CommonModule } from '@angular/common';
import { DataService } from './../../services/data.service';
import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

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
    ReactiveFormsModule,
    MatInputModule,
  ],
  templateUrl: './appointment-client-list.component.html',
  styleUrl: './appointment-client-list.component.scss',
})
export class AppointmentClientListComponent implements OnInit {
  @Input() appointment!: Appointment;
  @Input() addToList!: Boolean;

  petsWithLocations: any[] = [];
  filteredList: any[] = [];

  queryForm = new FormGroup({
    clientQuery: new FormControl(null),
  });

  constructor(private DataService: DataService) {}

  ngOnInit() {
    this.DataService.petsWithLocation$.subscribe((response) => {
      this.petsWithLocations = response.data;
      this.filteredList = response.data;
    });

    if (this.appointment && this.appointment.app)
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

  async addPetToReplyList(clientId: string) {
    this.DataService.addToReply(this.appointment.app._id, clientId);
    // await this.DataService.getAppointmentById(this.appointment.app._id);
    this.DataService.panelSubject.next(false);
  }

  filterList() {
    // Get the search term from the form and ensure it's not null or undefined
    let searchTerm = this.queryForm.get('clientQuery')?.value ?? '';

    // Convert searchTerm to lowercase for case-insensitive comparison
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    // Initialize an empty array to accumulate the filtered results
    const filteredResult: any[] = [];

    // If searchTerm is empty, return all data
    if (!lowerCaseSearchTerm) {
      this.filteredList = this.petsWithLocations;
    } else {
      // Loop through each area in petsWithLocations
      for (const area of this.petsWithLocations) {
        const areaName = Object.keys(area)[0];
        const areaData = area[`${areaName}`];

        // Ensure areaData and replies are defined
        if (areaData && Array.isArray(areaData)) {
          // Filter the replies based on the searchTerm
          const filteredReplies = areaData.filter(
            (reply: { petName: string; petParentName: string }) => {
              const petNameMatch = reply.petName
                .toLowerCase()
                .includes(lowerCaseSearchTerm);
              const petParentNameMatch = reply.petParentName
                .toLowerCase()
                .includes(lowerCaseSearchTerm);

              return petNameMatch || petParentNameMatch;
            }
          );

          // If there are any replies that match the searchTerm, add the area to the filteredResult
          if (filteredReplies.length > 0) {
            filteredResult.push({
              [areaName]: filteredReplies,
            });
          }
        }
      }

      // Update the filteredList with the filtered results
      this.filteredList = filteredResult;
    }
  }
}
