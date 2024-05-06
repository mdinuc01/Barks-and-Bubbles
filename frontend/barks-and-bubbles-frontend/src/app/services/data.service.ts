import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class DataService {
  private clientsSubject: BehaviorSubject<any[]> = new BehaviorSubject<any[]>(
    []
  );

  private appointmentsSubject: BehaviorSubject<any[]> = new BehaviorSubject<
    any[]
  >([]);
  private appointmentSubject: BehaviorSubject<any[]> = new BehaviorSubject<any>(
    []
  );

  clients$: Observable<any[]> = this.clientsSubject.asObservable();
  appointments$: Observable<any[]> = this.appointmentsSubject.asObservable();
  currentAppointment$: Observable<any[]> =
    this.appointmentSubject.asObservable();

  apiEndPoint = environment.domain;

  constructor(private http: HttpClient, private router: Router) {}

  getAllClients() {
    this.http
      .get<{ data: any[] }>(`${this.apiEndPoint}/client/`)
      .subscribe((response) => {
        this.clientsSubject.next(response.data);
      });
  }

  addClientsToTable(data: any[]) {
    this.http
      .put<{ data: any[] }>(`${this.apiEndPoint}/client/add`, { data })
      .subscribe((response) => {
        this.clientsSubject.next(response.data);
      });
  }

  getAllAppointments() {
    this.http
      .get<{ data: any[] }>(`${this.apiEndPoint}/appointment/`)
      .subscribe((response) => {
        this.appointmentsSubject.next(response.data);
      });
  }

  getAppointmentById(id: string) {
    this.http
      .get<{ data: any }>(`${this.apiEndPoint}/appointment/${id}`)
      .subscribe((response) => {
        this.appointmentSubject.next(response.data);
      });
  }

  addAppointment(data: any) {
    this.http
      .put<{ data: any[] }>(`${this.apiEndPoint}/appointment/add`, { data })
      .subscribe((response) => {
        this.appointmentsSubject.next(response.data);
      });
  }

  sendText(locations: [], date: string, appId: string) {
    this.http
      .put<{ data: any }>(`${this.apiEndPoint}/message/sendMessage`, {
        locations,
        date,
        appId,
      })
      .subscribe((response) => {
        this.appointmentSubject.next(response.data);
      });
  }

  //TODO: implements reply functionality
  sendReply() {}

  formatDate(inputDate: string, forSMS: boolean, forPanel: boolean): string {
    const date = new Date(inputDate);
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
    };
    const formattedDate = date.toLocaleDateString('en-US', options);

    // Add ordinal suffix to the day
    const day = date.getDate();
    let suffix = '';
    if (day === 1 || day === 21 || day === 31) {
      suffix = forSMS ? 'st' : '<sup>st</sup>';
    } else if (day === 2 || day === 22) {
      suffix = forSMS ? 'nd' : '<sup>nd</sup>';
    } else if (day === 3 || day === 23) {
      suffix = forSMS ? 'rd' : '<sup>rd</sup>';
    } else {
      suffix = forSMS ? 'th' : '<sup>th</sup>';
    }

    let year = forSMS ? '' : ', ' + date.getFullYear();
    year = forPanel ? '' : year;

    return `${formattedDate}${suffix}${year}`;
  }

  goHome() {
    this.router.navigateByUrl('/');
  }
}
