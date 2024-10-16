import { ToastService } from './../../services/toast.service';
import { CommonModule } from '@angular/common';
import { DataService } from './../../services/data.service';
import { MatCardModule } from '@angular/material/card';
import { Component, OnInit } from '@angular/core';
import { SortPipe } from '../../pipes/sort.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PanelService } from '../../services/panel service/panel-service';
import { MatDialog } from '@angular/material/dialog';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    SortPipe,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.scss',
})
export class ClientListComponent implements OnInit {
  clients: any[] = [];
  clientsQry: any[] = [];
  isAscending = true;
  serviceAreas: any[] = [];
  routes: any[] = [];
  queryForm: FormGroup = new FormGroup({
    clientQuery: new FormControl(null),
    locationQuery: new FormControl(null),
  });

  constructor(
    private DataService: DataService,
    private ToastService: ToastService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.DataService.showLoader();
    this.DataService.clients$.subscribe((res) => {
      if (res.data) {
        this.clients = res.data;
        this.clientsQry = res.data;
      }

      if (res.message == 'Client created')
        this.ToastService.showSuccess('Pet Added Successfully!');
    });

    this.DataService.routes$.subscribe((routes) => {
      this.routes = routes.data;
    });
    this.DataService.serviceAreas$.subscribe((areas) => {
      this.serviceAreas = areas;
    });

    this.DataService.getAllPets();
  }

  formatNumber(number: string): string {
    // Remove any non-digit characters from the phone number
    const cleaned = ('' + number).replace(/\D/g, '');

    // Extract the different parts of the phone number
    const areaCode = cleaned.slice(0, 3);
    const middlePart = cleaned.slice(3, 6);
    const lastPart = cleaned.slice(6);

    // Format the phone number
    const formattedNumber = `(${areaCode}) ${middlePart}-${lastPart}`;

    return formattedNumber;
  }

  toggleSortOrder() {
    this.isAscending = !this.isAscending;
  }

  filterList() {
    // Initialize filtered clients array with the full list of clients
    this.clientsQry = this.clients;

    // Retrieve the values from the form controls
    const clientQuery =
      this.queryForm.get('clientQuery')?.value?.toLowerCase() || '';
    const locationQuery = this.queryForm.get('locationQuery')?.value || [];
    console.log({ c: this.clientsQry });
    // Filter by client query if it exists
    if (clientQuery) {
      this.clientsQry = this.clientsQry.filter(
        (c) =>
          c.petName.toLowerCase().includes(clientQuery) ||
          c.petParentName.toLowerCase().includes(clientQuery) ||
          c.contactMethod.toLowerCase().includes(clientQuery) ||
          c.animalType.toLowerCase().includes(clientQuery) ||
          c.address.toLowerCase().includes(clientQuery)
      );
    }

    // Filter by location query if it exists
    if (locationQuery.length) {
      let allAreas: string[] = [];

      locationQuery.forEach((area: any) => {
        if (!area.serviceAreas) return;
        area.serviceAreas.forEach((sa: { name: string }) => {
          if (!sa.name || !allAreas.includes(sa.name)) allAreas.push(sa.name);
        });
      });

      this.clientsQry = this.clientsQry.filter(
        (c) =>
          locationQuery.includes(c.serviceArea) ||
          allAreas.includes(c.serviceArea)
      );
    }
  }

  resetFilter() {
    this.queryForm.reset();
    this.clientsQry = this.clients;
  }

  updateStatus(id: any, status: any) {
    this.DataService.updatePetStatus(id, status);
  }

  async openRouteEditor() {
    const dialogRef = this.dialog.open(PanelService, {
      data: {
        title: 'Edit Routes',
        confirmMsg: '',
        subMsg: '',
        btnTitle: 'Save',
        isMsgEditor: true,
        panelType: 'routeEditor',
        serviceAreas: this.serviceAreas,
        routes: this.routes,
      },
    });

    const result = await lastValueFrom(dialogRef.afterClosed());

    if (result || !result) {
      this.DataService.getAllRoutes();
      this.DataService.getAllAppointments();
      this.resetFilter();
    }
  }
}
