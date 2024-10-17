import { subscribe } from 'diagnostics_channel';
import { DataService } from './../../services/data.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormControl,
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
export class ClientPageComponent implements OnInit {
  client: any;
  clientForm = new FormGroup({
    petParentName: new FormControl(null),
    contactMethod: new FormControl(null),
    animalType: new FormControl(null),
    breed: new FormControl(null),
    petName: new FormControl(null),
    serviceArea: new FormControl(null),
    address: new FormControl(null),
    active: new FormControl(null),
  });
  breeds: string[] = [];
  filteredBreeds: string[] = [];
  private apiUrl = 'https://dog.ceo/api/breeds/list/all';

  constructor(
    private readonly DataService: DataService,
    private readonly activatedRoute: ActivatedRoute,
    private http: HttpClient
  ) {}
  ngOnInit(): void {
    this.DataService.showLoader();
    this.DataService.pet$.subscribe((res) => {
      if (!res.data) return;

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
      this.DataService.hideLoader();
    });

    this.activatedRoute.paramMap.subscribe((paraMap) => {
      let id = paraMap.get('id')!;
      this.DataService.getPetById(id);
    });
    this.getBreeds().subscribe((data) => {
      this.breeds = this.flattenBreeds(data.message)
        .map(this.capitalizeBreed)
        .sort();
      this.filteredBreeds = this.breeds;
    });
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
