import { ToastService } from './../../services/toast.service';
import { CommonModule } from '@angular/common';
import { DataService } from './../../services/data.service';
import { MatCardModule } from '@angular/material/card';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.scss',
})
export class ClientListComponent implements OnInit {
  clients: any[] = [];

  constructor(
    private DataService: DataService,
    private ToastService: ToastService
  ) {}

  ngOnInit(): void {
    this.DataService.showLoader();
    this.DataService.clients$.subscribe((res) => {
      if (res.data) this.clients = res.data;

      if (res.message == 'Client created')
        this.ToastService.showSuccess('Pet Added Successfully!');
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
}
