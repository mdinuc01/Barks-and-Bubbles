import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DataService {
  private clientsSubject: BehaviorSubject<any[]> = new BehaviorSubject<any[]>(
    []
  );

  private appointmentsSubject: BehaviorSubject<any[]> = new BehaviorSubject<
    any[]
  >([]);

  clients$: Observable<any[]> = this.clientsSubject.asObservable();
  appointments$: Observable<any[]> = this.appointmentsSubject.asObservable();

  apiEndPoint = 'http://localhost:8800/api';

  constructor(private http: HttpClient) {}

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

  addAppointment(data: any) {
    this.http
      .put<{ data: any[] }>(`${this.apiEndPoint}/appointment/add`, { data })
      .subscribe((response) => {
        this.appointmentsSubject.next(response.data);
      });
  }

  formatDate(inputDate: string): string {
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
      suffix = 'st';
    } else if (day === 2 || day === 22) {
      suffix = 'nd';
    } else if (day === 3 || day === 23) {
      suffix = 'rd';
    } else {
      suffix = 'th';
    }

    return `${formattedDate}${suffix}, ${date.getFullYear()}`;
  }
}
