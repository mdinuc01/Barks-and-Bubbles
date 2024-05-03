import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DataService } from './services/data.service';
import { FormGroup, FormControl, Validators, NgControl } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ClientListComponent } from './components/client-list/client-list.component';
import { HomeComponent } from './components/home/home.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileReaderComponent } from './components/file-reader-component/file-reader-component.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';

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
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    FileReaderComponent,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
})
export class AppComponent implements OnInit {
  title = 'barks-and-bubbles-frontend';
  showClientPanel = false;
  showAppPanel = false;
  isPanelVisible = false;
  options: string[] = [];
  selectedOption: string = '';
  appForm = new FormGroup({
    date: new FormControl(null, [Validators.required]),
    location: new FormControl(null, [Validators.required]),
  });

  constructor(private DataService: DataService) {}

  ngOnInit(): void {
    this.DataService.clients$.subscribe((res) => {
      this.hidePanels();

      if (res.length) {
        res.forEach((client: { serviceArea: string }) => {
          if (!this.options.includes(client.serviceArea)) {
            this.options.push(client.serviceArea);
          }
        });
      }
    });
  }

  hidePanels() {
    this.showClientPanel = false;
    this.showAppPanel = false;
  }

  createAppointment() {
    let date = this.appForm.get('date')?.value;
    let location = this.appForm.get('location')?.value;

    let data = { date, location };
    this.DataService.addAppointment(data);
    this.appForm.reset();
    this.hidePanels();
  }
}
