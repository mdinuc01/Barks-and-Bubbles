import { ToastService } from './../../services/toast.service';
import { subscribe } from 'diagnostics_channel';
import { DataService } from './../../services/data.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { Observable } from 'rxjs/internal/Observable';
import { HttpClient } from '@angular/common/http';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-client-page',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    FormsModule,
    CommonModule,
    MatAutocompleteModule,
    MatCardModule,
  ],
  templateUrl: './client-page.component.html',
  styleUrl: './client-page.component.scss',
})
export class ClientPageComponent implements OnInit, OnDestroy {
  id = '';
  client: any;
  clientForm = new FormGroup({
    petParentName: new FormControl(null),
    contactMethod: new FormControl(''),
    animalType: new FormControl(null),
    breed: new FormControl(null),
    petName: new FormControl(null),
    serviceArea: new FormControl(null),
    address: new FormControl(null),
    active: new FormControl(null),
  });
  breeds: string[] = [];
  filteredBreeds: string[] = [];
  private readonly apiUrl = 'https://dog.ceo/api/breeds/list/all';
  firstLoad = true;
  constructor(
    private readonly DataService: DataService,
    private readonly activatedRoute: ActivatedRoute,
    private http: HttpClient,
    private readonly ToastService: ToastService
  ) {}

  ngOnInit(): void {
    this.DataService.showLoader();
    this.DataService.pet$.subscribe((res) => {
      if (!res.data) return;

      if (res.message === 'Client updated' && !this.firstLoad)
        this.ToastService.showSuccess('Client Updated Successfully');

      this.client = res.data;
      this.clientForm = new FormGroup({
        petParentName: new FormControl(
          res.data.petParentName,
          Validators.required
        ),
        contactMethod: new FormControl(
          res.data.contactMethod,
          Validators.required
        ),
        animalType: new FormControl(res.data.animalType, Validators.required),
        breed: new FormControl(res.data.breed, Validators.required),
        petName: new FormControl(res.data.petName, Validators.required),
        serviceArea: new FormControl(res.data.serviceArea, Validators.required),
        address: new FormControl(res.data.address, Validators.required),
        active: new FormControl(res.data.active, Validators.required),
      });
      if (res.data.contactMethod.toLowerCase() !== 'messenger')
        this.formatPhoneNumber();
      this.DataService.hideLoader();
    });

    this.activatedRoute.paramMap.subscribe((paraMap) => {
      this.id = paraMap.get('id')!;
      this.DataService.getPetById(this.id);
    });
    this.getBreeds().subscribe((data) => {
      this.breeds = this.flattenBreeds(data.message)
        .map(this.capitalizeBreed)
        .sort();
      this.filteredBreeds = this.breeds;
    });

    this.firstLoad = false;
  }

  ngOnDestroy(): void {
    this.firstLoad = true;
  }

  getBreeds(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  flattenBreeds(breedsObj: any): string[] {
    const breeds = [];
    for (const breed in breedsObj) {
      if (breedsObj[breed].length) {
        breedsObj[breed].forEach((subBreed: string) => {
          breeds.push(`${subBreed} ${breed}`);
        });
      } else {
        breeds.push(breed);
      }
    }
    return breeds;
  }

  capitalizeBreed(breed: string): string {
    return breed
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  onSearchChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const searchValue = inputElement.value.toLowerCase();
    this.filteredBreeds = this.breeds.filter((breed) =>
      breed.toLowerCase().includes(searchValue)
    );
  }

  updatePet() {
    let updatedValues = this.clientForm.value;

    let contactMethod = this.removeNumberFormat(updatedValues.contactMethod!);
    updatedValues = {
      ...updatedValues,
      contactMethod,
    };
    this.DataService.updatePet(this.id, updatedValues);
  }

  formatPhoneNumber(event?: KeyboardEvent) {
    const input = this.clientForm.get('contactMethod');

    // Check if `input` exists and has a value
    if (input && input.value !== null) {
      const value = input.value as string;

      // If the input contains any letters, do not format
      if (/[a-zA-Z]/.test(value)) {
        return; // Exit the function without formatting
      }

      // Otherwise, remove all non-digit characters
      let cleaned = value.replace(/\D/g, '');

      // Handle backspace: remove the last digit if Backspace is pressed
      if (event && event.key === 'Backspace') {
        cleaned = cleaned.slice(0, -1);
      }

      // Limit to max of 10 digits
      if (cleaned.length > 10) {
        cleaned = cleaned.substring(0, 10);
      }

      // Format to (###) ###-####
      let formatted = cleaned;
      if (cleaned.length > 0) {
        formatted = `(${cleaned.substring(0, 3)}`;
        if (cleaned.length >= 4) {
          formatted += `) ${cleaned.substring(3, 6)}`;
        }
        if (cleaned.length >= 7) {
          formatted += `-${cleaned.substring(6, 10)}`;
        }
      }

      // Update the form control value with the formatted phone number
      input.setValue(formatted, { emitEvent: false });
    }
  }

  removeNumberFormat(phoneNumber: string): string {
    console.log({ phoneNumber });

    // Check if there are no letters in the phone number
    if (!/[a-zA-Z]/.test(phoneNumber)) {
      // Assign the result of replace to phoneNumber
      phoneNumber = phoneNumber.replace(/[^\d]/g, '');
    }

    return phoneNumber;
  }
}
