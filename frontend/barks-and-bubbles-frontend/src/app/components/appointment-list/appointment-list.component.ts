import { ToastService } from './../../services/toast.service';
import { MatCardModule } from '@angular/material/card';
import { DataService } from './../../services/data.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AppointmentFilterPipe } from '../../pipes/appointment-filter.pipe';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  providers: [AppointmentFilterPipe],
  imports: [
    MatCardModule,
    CommonModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
  ],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.scss',
})
export class AppointmentListComponent implements OnInit, OnDestroy {
  appointments: any[] = [];
  formatDate = this.DataService.formatDate;
  archivedDisplayed = false;
  archivedDisplayedSubject = new BehaviorSubject<boolean>(false);

  // filteredAppointments: any[] = [];

  constructor(
    private DataService: DataService,
    public router: Router,
    private AppointmentFilterPipe: AppointmentFilterPipe,
    private ToastService: ToastService
  ) {
    this.DataService.appointments$.subscribe((res) => {
      if (res.data && res.data.length) {
        console.log({ res });
        this.appointments = res.data.sort(
          (
            a: { date: string | number | Date },
            b: { date: string | number | Date }
          ) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        if (
          res.message == 'Appointment Archived Successfully' &&
          !this.archivedDisplayed
        ) {
          this.ToastService.showSuccess('Appointment Archived Successfully!');
        }
        if (
          res.message == 'Appointment Archived Successfully' &&
          this.archivedDisplayed
        ) {
          this.ToastService.showSuccess('Appointment Activated Successfully!');
        }
        if (res.message == 'Appointment create') {
          this.ToastService.showSuccess('Appointment Added Successfully!');
        }
      }
    });
    this.archivedDisplayedSubject.subscribe(this.onArchivedDisplayedChange);
  }
  ngOnDestroy(): void {
    this.appointments = [];
    this.DataService.appointments$.subscribe();
  }

  ngOnInit(): void {
    this.DataService.getAllAppointments();
  }

  // Function to run whenever the value changes
  onArchivedDisplayedChange(newValue: boolean) {
    // console.log(`archivedDisplayed changed to: ${newValue}`);
    this.DataService.getAllAppointments();
  }

  setArchivedDisplayed(value: boolean) {
    this.archivedDisplayedSubject.next(value);
  }

  formatLocations(locations: string[]) {
    return locations.toString().replaceAll(',', ', ');
  }

  viewAppointment(app: any) {
    this.DataService.showLoader();
    this.router.navigate(['appointment/', app._id]);
  }

  shouldDisplayAppointment(app: any): boolean {
    return this.archivedDisplayed ? !app.active : app.active;
  }

  get filteredAppointments() {
    return this.AppointmentFilterPipe.transform(
      this.appointments,
      this.archivedDisplayed
    );
  }

  archiveApp(app: any, archive: boolean, event: Event) {
    event.stopPropagation();
    this.DataService.archiveAppointment(app._id, archive);
  }
}
