import { StorageService } from './storage.service';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class DataService {
  private loaderSubject: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  private clientsSubject: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  private appointmentsSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    []
  );
  private appointmentSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    []
  );

  loader$: Observable<any> = this.loaderSubject.asObservable();
  clients$: Observable<any> = this.clientsSubject.asObservable();
  appointments$: Observable<any> = this.appointmentsSubject.asObservable();
  currentAppointment$: Observable<any> = this.appointmentSubject.asObservable();
  apiEndPoint = environment.domain;
  token = '';
  headers: HttpHeaders;

  constructor(
    private http: HttpClient,
    private router: Router,
    private storageService: StorageService
  ) {
    this.token = this.storageService.getCookie('aj') ?? '';
    this.headers = new HttpHeaders().set('x-access-token', this.token);
  }

  getAllPets() {
    this.http
      .get<{ data: any[] }>(`${this.apiEndPoint}/pet/`, {
        headers: this.headers,
      })
      .subscribe((response) => {
        this.clientsSubject.next(response);
        this.loaderSubject.next(false);
      });
  }

  addPet(data: any) {
    this.http
      .post<{ data: any[] }>(`${this.apiEndPoint}/pet/add`, data, {
        headers: this.headers,
      })
      .subscribe((response) => {
        this.clientsSubject.next(response);
        this.loaderSubject.next(false);
      });
  }

  getAllAppointments() {
    this.http
      .get<{ data: any[] }>(`${this.apiEndPoint}/appointment/`, {
        headers: this.headers,
      })
      .subscribe((response) => {
        this.appointmentsSubject.next(response);
        this.loaderSubject.next(false);
      });
  }

  getAppointmentById(id: string) {
    this.http
      .get<{ data: any }>(`${this.apiEndPoint}/appointment/${id}`, {
        headers: this.headers,
      })
      .subscribe((response) => {
        this.appointmentSubject.next(response);
        this.loaderSubject.next(false);
      });
  }

  addAppointment(data: any) {
    this.http
      .post<{ data: any[] }>(`${this.apiEndPoint}/appointment/add`, data, {
        headers: this.headers,
      })
      .subscribe((response) => {
        this.appointmentsSubject.next(response);
        this.loaderSubject.next(false);
      });
  }

  sendText(locations: any[], date: string, appId: string) {
    this.http
      .put<{ data: any }>(
        `${this.apiEndPoint}/message/sendMessage`,
        { locations, date, appId },
        { headers: this.headers }
      )
      .subscribe((response) => {
        this.appointmentSubject.next(response);
        this.loaderSubject.next(false);
      });
  }

  loadReplies(appId: string, sentDate: string) {
    this.http
      .put<{ data: any }>(
        `${this.apiEndPoint}/message/getReplies`,
        { appId, sentDate },
        { headers: this.headers }
      )
      .subscribe((response) => {
        this.appointmentSubject.next(response);
        this.loaderSubject.next(false);
      });
  }

  saveTimes(appId: string, replies: any[]) {
    this.http
      .put<{ data: any }>(
        `${this.apiEndPoint}/appointment/time/${appId}`,
        { replies },
        { headers: this.headers }
      )
      .subscribe((response) => {
        this.appointmentSubject.next(response);
        this.loaderSubject.next(false);
      });
  }

  sendReplies(appId: string) {
    this.http
      .put<{ message: string }>(
        `${this.apiEndPoint}/message/sendReplies/${appId}`,
        {},
        { headers: this.headers }
      )
      .subscribe((response) => {
        this.appointmentSubject.next(response);
        this.loaderSubject.next(false);
      });
  }

  archiveAppointment(appId: string, isArchived: boolean) {
    this.http
      .put<{ data: any }>(
        `${this.apiEndPoint}/appointment/time/archive/${appId}`,
        { isArchived },
        { headers: this.headers }
      )
      .subscribe((response) => {
        this.appointmentsSubject.next(response);
      });
  }

  showLoader() {
    this.loaderSubject.next(true);
  }

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

  messageDateFormat(dateString: string) {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ending = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert 24-hour time to 12-hour time
    const day = String(date.getDate()).padStart(2, '0');
    const monthIndex = date.getMonth();
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = monthNames[monthIndex];
    const year = date.getFullYear();

    return `${formattedHours}:${minutes} ${ending} - ${month} ${day}, ${year}`;
  }

  goHome() {
    this.router.navigateByUrl('/home');
  }
}
