import { Component, HostListener, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DataService } from './services/data.service';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ClientListComponent } from './components/client-list/client-list.component';
import { HomeComponent } from './components/home/home.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PetFormComponent } from './components/pet-form/pet-form.component';
import { LoaderService } from './services/loader/loader.service';
import { delay, of, switchMap } from 'rxjs';
@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [DataService, HttpClient, ClientListComponent, HomeComponent],
  imports: [
    RouterOutlet,
    HttpClientModule,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    MatSelectModule,
    ReactiveFormsModule,
    PetFormComponent,
    LoaderService,
  ],
})
export class AppComponent implements OnInit {
  title = 'barks-and-bubbles-frontend';
  showClientPanel = false;
  showAppPanel = false;
  isPanelVisible = false;
  showLoader = true;
  options: string[] = [];
  selectedOption: string = '';
  appForm = new FormGroup({
    date: new FormControl(null, [Validators.required]),
    location: new FormControl(null, [Validators.required]),
  });

  constructor(public DataService: DataService) {}

  ngOnInit(): void {
    this.DataService.clients$.subscribe((res) => {
      this.hidePanels();

      if (res.data) {
        res.data.forEach((client: { serviceArea: string }) => {
          if (!this.options.includes(client.serviceArea)) {
            this.options.push(client.serviceArea);
          }
        });
      }
    });

    this.DataService.loader$
      .pipe(switchMap((show) => (show ? of(show) : of(show).pipe(delay(2800)))))
      .subscribe((show) => {
        this.showLoader = show;
      });

    this.DataService.getAllPets();
  }

  hidePanels() {
    this.showClientPanel = false;
    this.showAppPanel = false;
  }

  showPanel(event: Event, isClient: boolean) {
    event.stopPropagation();

    if (isClient) {
      this.showClientPanel = !this.showClientPanel;
      this.showAppPanel = false;
    } else {
      this.showAppPanel = !this.showAppPanel;
      this.showClientPanel = false;
    }
  }

  createAppointment() {
    let date = this.appForm.get('date')?.value;
    let location = this.appForm.get('location')?.value;

    let data = { date, location };
    this.DataService.addAppointment(data);
    this.appForm.reset();
    this.hidePanels();
  }

  @HostListener('document:keydown.escape', ['$event'])
  keyPressHidePanels(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.showAppPanel || this.showClientPanel) this.hidePanels();
    }
  }
}
