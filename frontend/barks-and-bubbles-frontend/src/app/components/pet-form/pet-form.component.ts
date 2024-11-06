import { DataService } from './../../services/data.service';
import { Component, Input, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-pet-form',
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
  ],
  templateUrl: './pet-form.component.html',
  styleUrl: './pet-form.component.scss',
})
export class PetFormComponent implements OnInit {
  @Input() hidePanels!: () => void;

  petForm = new FormGroup({
    petParentName: new FormControl(null, [Validators.required]),
    contactMethod: new FormControl('', [Validators.required]),
    animalType: new FormControl(null, [Validators.required]),
    breed: new FormControl(null, [Validators.required]),
    petName: new FormControl(null, [Validators.required]),
    serviceArea: new FormControl(null, [Validators.required]),
    address: new FormControl(null, [Validators.required]),
  });

  private apiUrl = 'https://dog.ceo/api/breeds/list/all';
  breeds: string[] = [];
  filteredBreeds: string[] = [];

  constructor(public DataService: DataService, private http: HttpClient) {}

  ngOnInit(): void {
    this.getBreeds().subscribe((data) => {
      this.breeds = this.flattenBreeds(data.message)
        .map(this.capitalizeBreed)
        .sort();
      this.filteredBreeds = this.breeds;
    });
  }

  createClient() {
    let petValues = this.petForm.value;

    let contactMethod = this.DataService.removeNumberFormat(
      petValues.contactMethod!
    );

    petValues = {
      ...petValues,
      contactMethod,
    };

    this.DataService.addPet(petValues);
  }

  onCancel(event: Event) {
    event.preventDefault();
    this.petForm.reset();
    this.hidePanels();
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
}
