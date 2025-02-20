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
import { Router } from '@angular/router';

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
  serviceAreasObj: any[] = [];
  routes: any[] = [];
  services = ['Boarding', 'Grooming', 'Nail Trimming'];
  queryForm: FormGroup = new FormGroup({
    clientQuery: new FormControl(null),
    locationQuery: new FormControl(null),
  });
  controlRoute: { serviceAreas: any[] } = { serviceAreas: [] };

  constructor(
    private readonly DataService: DataService,
    private readonly ToastService: ToastService,
    private readonly dialog: MatDialog,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.DataService.showLoader();
    this.DataService.clients$.subscribe((res) => {
      if (res.data) {
        this.clients = res.data;
        this.clientsQry = res.data;
      }

      if (
        this.routes &&
        this.routes.length &&
        this.clients &&
        this.clients.length
      ) {
        this.orderClients();
      }

      if (res.message == 'Client created')
        this.ToastService.showSuccess('Pet Added Successfully!');
    });

    this.DataService.routes$.subscribe((routes) => {
      this.routes = routes.data.filter(
        (r: { name: string }) => r.name != 'control'
      );

      this.controlRoute = routes.data.find(
        (r: { name: string }) => r.name == 'control'
      );
    });

    this.DataService.serviceAreas$.subscribe((areas) => {
      this.serviceAreas = areas;

      if (
        this.routes &&
        this.routes.length &&
        this.clients &&
        this.clients.length
      ) {
        this.orderClients();
      }
    });

    this.DataService.getAllPets();
  }

  orderClients() {
    debugger;
    let serviceAreasMap = new Map();

    for (const s of this.controlRoute.serviceAreas) {
      if (!serviceAreasMap.has(s.name)) {
        let clients = this.clients.filter((c) => c.serviceArea == s.name);
        if (clients.length)
          serviceAreasMap.set(s.name, {
            name: s.name,
            time: s.time,
            increment: s.increment,
            length: s.length,
            clients,
          });
      }
    }

    this.serviceAreasObj = Array.from(serviceAreasMap.values());
    //sort serviceArea clients by order value
    this.serviceAreasObj = this.serviceAreasObj.map((area) => {
      let sortedClients = area.clients.sort(
        (a: { order: number }, b: { order: number }) => {
          if (a.order < b.order) {
            return -1;
          } else if (a.order > b.order) {
            return 1;
          }
          return 0;
        }
      );
      return { ...area, clients: sortedClients };
    });
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
    if (!this.queryForm.get('clientQuery') || !this.clients) return;
    // Initialize filtered clients array with the full list of clients
    this.clientsQry = this.clients;
    // Retrieve the values from the form controls
    const clientQuery =
      this.queryForm.get('clientQuery')?.value?.toLowerCase() || '';
    let locationQuery = this.queryForm.get('locationQuery')?.value || [];
    let servicesQuery: string[] = [];

    this.services.forEach((s) => {
      if (locationQuery.includes(s)) {
        servicesQuery.push(s);
        locationQuery = locationQuery.filter((l: string) => l != s);
      }
    });

    // Filter by client query if it exists
    //removed breed and address as these values can be null an causes issues
    if (clientQuery) {
      this.clientsQry = this.clientsQry.filter(
        (c) =>
          (c && c.petName.toLowerCase().includes(clientQuery)) ||
          c.petParentName.toLowerCase().includes(clientQuery) ||
          c.contactMethod.toLowerCase().includes(clientQuery) ||
          c.animalType.toLowerCase().includes(clientQuery) ||
          c.active.toString().toLowerCase().includes(clientQuery)
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
    if (servicesQuery.length) {
      this.clientsQry = this.clientsQry.filter((c) =>
        c.type.some((type: any) => servicesQuery.includes(type))
      );
    }
  }

  resetFilter() {
    this.queryForm.reset();
    this.clientsQry = this.clients;
  }

  updateStatus(event: Event, id: any, status: any) {
    event.stopPropagation();
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

  async openServiceAreaEditor() {
    const dialogRef = this.dialog.open(PanelService, {
      data: {
        title: 'Edit Service Areas',
        confirmMsg: '',
        subMsg: '',
        btnTitle: 'Save',
        isMsgEditor: true,
        panelType: 'serviceAreaEditor',
        serviceAreas: this.serviceAreasObj,
        routes: this.routes,
      },
    });

    const result = await lastValueFrom(dialogRef.afterClosed());

    if (result || !result) {
      await this.DataService.getAllPets();
      this.orderClients();
      this.resetFilter();
    }
  }

  goToClient(clientId: string) {
    this.router.navigate(['client/', clientId]);
  }
}
