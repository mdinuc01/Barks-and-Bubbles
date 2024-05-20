import { DataService } from './../../services/data.service';
import { Component } from '@angular/core';
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

@Component({
  selector: 'app-pet-form',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
  ],
  templateUrl: './pet-form.component.html',
  styleUrl: './pet-form.component.scss',
})
export class PetFormComponent {
  petForm = new FormGroup({
    petParentName: new FormControl(null, [Validators.required]),
    contactMethod: new FormControl(null, [Validators.required]),
    animalType: new FormControl(null, [Validators.required]),
    breed: new FormControl(null, [Validators.required]),
    petName: new FormControl(null, [Validators.required]),
    serviceArea: new FormControl(null, [Validators.required]),
  });

  constructor(private DataService: DataService) {}

  createClient() {
    this.DataService.addPet(this.petForm.value);
  }
}
