import { ToastService } from './../../services/toast.service';
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
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { PanelService } from '../../services/panel service/panel-service';
import { lastValueFrom } from 'rxjs/internal/lastValueFrom';

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
    MatIconModule,
    MatTooltipModule,
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
    public readonly DataService: DataService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly http: HttpClient,
    private readonly ToastService: ToastService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.DataService.showLoader();
    this.DataService.clients$.subscribe((res) => {
      if (res.data) {
        this.client = res.data.find((c: { _id: string }) => c._id == this.id);
      }

      if (res.message == 'Client created')
        this.ToastService.showSuccess('Pet Added Successfully!');
    });
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
        this.DataService.formatPhoneNumber(this.clientForm);
      this.DataService.hideLoader();
    });

    this.activatedRoute.paramMap.subscribe((paraMap) => {
      this.id = paraMap.get('id')!;
      this.DataService.getPetById(this.id);
    });
    this.getBreeds().subscribe((data) => {
      this.breeds = this.flattenBreeds(data.message)
        .map(this.capitalizeBreed)
        .sort((a, b) => a.localeCompare(b));
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

    let contactMethod = this.DataService.removeNumberFormat(
      updatedValues.contactMethod!
    );
    updatedValues = {
      ...updatedValues,
      contactMethod,
    };
    this.DataService.updatePet(this.id, updatedValues);
  }

  async openDeletePanel() {
    const dialogRef = this.dialog.open(PanelService, {
      data: {
        title: `Delete ${this.client.petName}?`,
        confirmMsg: `Are you sure you want to delete the following data: 
        <br>
        <br><b>Pet: ${this.client.petName}</b>
        <br><b>Pet Parent: ${this.client.petParentName}</b>`,
        subMsg: 'This action cannot be undone.',
        btnTitle: 'Delete ',
        isMsgEditor: false,
        panelType: 'confirmPanel',
        headerType: 'warn',
      },
    });

    const result = await lastValueFrom(dialogRef.afterClosed());

    if (result) {
      this.deletePet();
    }
  }

  deletePet() {
    this.DataService.deletePet(this.id);
  }

  updateStatus(event: Event, id: any, status: any) {
    event.stopPropagation();
    this.DataService.updatePetStatus(id, status);
  }
}
