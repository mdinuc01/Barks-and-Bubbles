import { ToastService } from './toast.service';
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
  private serviceAreaSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    []
  );
  private appointmentsSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    []
  );
  private appointmentSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    []
  );
  private messageBuilderSubject: BehaviorSubject<any> =
    new BehaviorSubject<any>([]);
  private petsWithLocationsSubject: BehaviorSubject<any> =
    new BehaviorSubject<any>([]);
  panelSubject = new BehaviorSubject<boolean>(false);
  panel$ = this.panelSubject.asObservable();

  loader$: Observable<any> = this.loaderSubject.asObservable();
  clients$: Observable<any> = this.clientsSubject.asObservable();
  serviceAreas$: Observable<any> = this.serviceAreaSubject.asObservable();
  appointments$: Observable<any> = this.appointmentsSubject.asObservable();
  currentAppointment$: Observable<any> = this.appointmentSubject.asObservable();
  messageBuilder$: Observable<any> = this.messageBuilderSubject.asObservable();
  petsWithLocation$: Observable<any> =
    this.petsWithLocationsSubject.asObservable();
  apiEndPoint = environment.domain;
  token = '';
  headers: HttpHeaders;
  AUTH_API = `${this.apiEndPoint}/auth/`;
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private StorageService: StorageService,
    private ToastService: ToastService
  ) {
    this.token = this.StorageService.getCookie('aj') ?? '';
    this.headers = new HttpHeaders().set('x-access-token', this.token);
  }

  getAllPets() {
    this.http
      .get<{
        message: string;
        data: any;
      }>(`${this.apiEndPoint}/pet/`, {
        headers: this.headers,
      })
      .subscribe(
        (response) => {
          let serviceAreas: string[] = [];
          response.data.forEach((client: { serviceArea: string }) => {
            if (!serviceAreas.includes(client.serviceArea)) {
              serviceAreas.push(client.serviceArea);
            }
          });

          if (serviceAreas.length)
            serviceAreas = serviceAreas.sort((a, b) => a.localeCompare(b));

          this.serviceAreaSubject.next(serviceAreas);
          this.clientsSubject.next(response);
          this.loaderSubject.next(false);
        },
        async (error) => {
          if (error.status === 401) {
            await this.StorageService.clean();
            this.goToLogin();
            this.http
              .post(this.AUTH_API + 'signout', {}, this.httpOptions)
              .subscribe((r) => {
                this.ToastService.showSuccess(
                  'Session ended, please sign in again'
                );
              });
          }
        }
      );
  }

  addPet(data: any) {
    this.http
      .post<{ data: any[] }>(`${this.apiEndPoint}/pet/add`, data, {
        headers: this.headers,
      })
      .subscribe((response) => {
        let serviceAreas: string[] = [];
        response.data.forEach((client: { serviceArea: string }) => {
          if (!serviceAreas.includes(client.serviceArea)) {
            serviceAreas.push(client.serviceArea);
          }
        });

        if (serviceAreas.length)
          serviceAreas = serviceAreas.sort((a, b) => a.localeCompare(b));

        this.serviceAreaSubject.next(serviceAreas);
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

  updatePetStatus(id: any, status: any) {
    this.http
      .put<{ data: any[] }>(
        `${this.apiEndPoint}/pet/status`,
        {
          id,
          status,
        },
        {
          headers: this.headers,
        }
      )
      .subscribe((response) => {
        this.clientsSubject.next(response);
        this.loaderSubject.next(false);
      });
  }

  updatePetStatusApp(id: any, status: any, appId: string) {
    this.http
      .put<{ data: any[] }>(
        `${this.apiEndPoint}/pet/status`,
        {
          id,
          status,
        },
        {
          headers: this.headers,
        }
      )
      .subscribe((response) => {
        this.clientsSubject.next(response);
        this.loaderSubject.next(false);
        this.getAppointmentById(appId);
      });
  }

  getMessages() {
    this.http
      .get(`${this.apiEndPoint}/message/builder`, {
        headers: this.headers,
      })
      .subscribe((response) => {
        this.messageBuilderSubject.next(response);
      });
  }

  updateMessage(_id: string, updateMessage: string) {
    this.http
      .put(
        `${this.apiEndPoint}/message/builder/update`,
        {
          _id,
          updateMessage,
        },
        {
          headers: this.headers,
        }
      )
      .subscribe((response) => {
        if (response)
          this.ToastService.showSuccess('Message Updated Successfully');
      });
  }

  addToReply(appId: string, petId: string) {
    this.http
      .put<{ data: any }>(
        `${this.apiEndPoint}/appointment/addPetToReplies`,
        { appId, petId },
        { headers: this.headers }
      )
      .subscribe((response) => {
        this.getAppointmentById(appId);
      });
  }

  getPetsWithLocations(appId: string) {
    this.http
      .get<{ data: any[] }>(
        `${this.apiEndPoint}/pet/petsWithLocations/${appId}`,
        {
          headers: this.headers,
        }
      )
      .subscribe((response) => {
        this.petsWithLocationsSubject.next(response);
      });
  }

  showLoader() {
    this.loaderSubject.next(true);
  }

  hideLoader() {
    this.loaderSubject.next(false);
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
    this.loaderSubject.next(false);
  }

  goToLogin(): boolean {
    this.router.navigateByUrl('/login');
    this.loaderSubject.next(false);
    return false;
  }
}
