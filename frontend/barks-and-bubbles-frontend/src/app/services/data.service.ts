import { ToastService } from './toast.service';
import { StorageService } from './storage.service';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly loaderSubject: BehaviorSubject<any> =
    new BehaviorSubject<any>([]);
  private readonly clientsSubject: BehaviorSubject<any> =
    new BehaviorSubject<any>([]);
  private readonly petSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    []
  );
  private readonly serviceAreaSubject: BehaviorSubject<any> =
    new BehaviorSubject<any>([]);
  private readonly appointmentsSubject: BehaviorSubject<any> =
    new BehaviorSubject<any>([]);
  private readonly appointmentSubject: BehaviorSubject<any> =
    new BehaviorSubject<any>([]);
  private readonly messageBuilderSubject: BehaviorSubject<any> =
    new BehaviorSubject<any>([]);
  private readonly petsWithLocationsSubject: BehaviorSubject<any> =
    new BehaviorSubject<any>([]);
  panelSubject = new BehaviorSubject<boolean>(false);
  private readonly routeSubject: BehaviorSubject<any> =
    new BehaviorSubject<any>([]);
  private readonly replyLoader: BehaviorSubject<any> = new BehaviorSubject<any>(
    []
  );

  loader$: Observable<any> = this.loaderSubject.asObservable();
  clients$: Observable<any> = this.clientsSubject.asObservable();
  pet$: Observable<any> = this.petSubject.asObservable();
  serviceAreas$: Observable<any> = this.serviceAreaSubject.asObservable();
  appointments$: Observable<any> = this.appointmentsSubject.asObservable();
  currentAppointment$: Observable<any> = this.appointmentSubject.asObservable();
  messageBuilder$: Observable<any> = this.messageBuilderSubject.asObservable();
  petsWithLocation$: Observable<any> =
    this.petsWithLocationsSubject.asObservable();
  routes$: Observable<any> = this.routeSubject.asObservable();
  replyLoader$: Observable<any> = this.replyLoader.asObservable();

  apiEndPoint = environment.domain;
  token = '';
  headers: HttpHeaders;
  AUTH_API = `${this.apiEndPoint}/auth/`;
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly StorageService: StorageService,
    private readonly ToastService: ToastService
  ) {
    this.token = this.StorageService.getCookie('aj') ?? '';
    this.headers = new HttpHeaders().set('x-access-token', this.token);
  }

  getAllPets() {
    this.http
      .get<{
        message: string;
        data: any;
      }>(`${this.apiEndPoint}/client/`, {
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
      .post<{ data: { clients: any[]; createdId: string } }>(
        `${this.apiEndPoint}/client/add`,
        data,
        {
          headers: this.headers,
        }
      )
      .subscribe((response) => {
        let serviceAreas: string[] = [];
        response.data.clients.forEach((client: { serviceArea: string }) => {
          if (!serviceAreas.includes(client.serviceArea)) {
            serviceAreas.push(client.serviceArea);
          }
        });

        if (serviceAreas.length)
          serviceAreas = serviceAreas.sort((a, b) => a.localeCompare(b));

        this.serviceAreaSubject.next(serviceAreas);
        this.clientsSubject.next(response);

        this.router.navigate(['client/', response.data.createdId], {
          queryParams: { newClient: true },
        });
      });
  }

  deleteClient(id: string) {
    this.http
      .delete(`${this.apiEndPoint}/client/delete/${id}`, {
        headers: this.headers,
      })
      .subscribe((res: any) => {
        if (res.deleted) {
          this.goHome();
        }
        this.ToastService.showSuccess(res.message);
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
      .subscribe(
        (response) => {
          this.appointmentSubject.next(response);
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

  addAppointment(data: any) {
    this.http
      .post<{ data: any[] }>(`${this.apiEndPoint}/appointment/add`, data, {
        headers: this.headers,
      })
      .subscribe((response) => {
        this.appointmentsSubject.next(response);
      });
  }

  sendText(date: string, appId: string) {
    this.loaderSubject.next(true);

    this.http
      .put<{ data: any }>(
        `${this.apiEndPoint}/message/sendMessage`,
        { date, appId },
        { headers: this.headers }
      )
      .subscribe({
        next: (response) => {
          this.appointmentSubject.next(response);
          this.loaderSubject.next(false);
          this.getPetsWithLocations(appId);
          setTimeout(() => {
            this.loadReplies(appId, response.data.app.messages.sentDate);
          }, 5 * 1000);
        },
        error: (err) => {
          this.ToastService.showSuccess(err.error.message);
          this.loaderSubject.next(false);
        },
      });
  }

  loadReplies(appId: string, sentDate: string) {
    this.http
      .put<{ data: any }>(
        `${this.apiEndPoint}/message/getReplies`,
        { appId, sentDate },
        { headers: this.headers }
      )
      .subscribe({
        next: (response) => {
          this.appointmentSubject.next(response);
          this.replyLoader.next(false);
          this.ToastService.showSuccess('Replies Loaded Successfully!');
        },
        error: (err) => {
          this.ToastService.showSuccess(err.error.message);
          this.loaderSubject.next(false);
          this.replyLoader.next(false);
        },
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
      });
  }

  sendReplies(appId: string) {
    this.loaderSubject.next(true);

    this.http
      .put<{ message: string }>(
        `${this.apiEndPoint}/message/sendReplies/${appId}`,
        {},
        { headers: this.headers }
      )
      .subscribe({
        next: (response) => {
          this.appointmentSubject.next(response);
          this.loaderSubject.next(false);
        },
        error: (err) => {
          this.ToastService.showSuccess(err.error.message);
          this.loaderSubject.next(false); // Ensure loader is turned off
        },
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

  getPetById(id: string) {
    this.http
      .get(`${this.apiEndPoint}/client/${id}`, {
        headers: this.headers,
      })
      .subscribe((response) => {
        this.petSubject.next(response);
      });
  }

  updateClient(id: string, data: any) {
    this.http
      .put<{ data: any }>(
        `${this.apiEndPoint}/client/update/${id}`,
        { data },
        { headers: this.headers }
      )
      .subscribe((response) => {
        this.petSubject.next(response);
      });
  }

  updateClientOrder(clients: any) {
    this.http
      .put<{ updated: boolean; message: string }>(
        `${this.apiEndPoint}/client/client-order-change/`,
        { clients },
        { headers: this.headers }
      )
      .subscribe((res) => {
        if (res.updated) {
          this.ToastService.showSuccess(res.message);
        }
      });
  }

  updatePetStatus(id: any, status: any) {
    this.http
      .put<{ data: any[] }>(
        `${this.apiEndPoint}/client/status`,
        {
          id,
          status,
        },
        {
          headers: this.headers,
        }
      )
      .subscribe((response) => {
        this.ToastService.showSuccess(
          `Client is now ${status ? 'Active' : 'Deactivated'}`
        );
        this.clientsSubject.next(response);
      });
  }

  updatePetStatusApp(id: any, status: any, appId: string) {
    this.http
      .put<{ data: any[] }>(
        `${this.apiEndPoint}/client/status`,
        {
          id,
          status,
        },
        {
          headers: this.headers,
        }
      )
      .subscribe((response) => {
        this.ToastService.showSuccess(
          `Client is now ${status ? 'Active' : 'Deactivated'}`
        );
        this.clientsSubject.next(response);
        this.getAppointmentById(appId);
        this.getPetsWithLocations(appId);
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

  getAllRoutes() {
    this.http
      .get(`${this.apiEndPoint}/route/`, {
        headers: this.headers,
      })
      .subscribe((response) => {
        this.routeSubject.next(response);
      });
  }
  createRoute(name: string, serviceAreas: []) {
    this.http
      .post(
        `${this.apiEndPoint}/route/create`,
        { name, serviceAreas },
        {
          headers: this.headers,
        }
      )
      .subscribe((response) => {
        this.routeSubject.next(response);
      });
  }

  updateRoute(routeId: string, routeData: any) {
    this.http
      .put(
        `${this.apiEndPoint}/route/update`,
        { routeId, routeData },
        {
          headers: this.headers,
        }
      )
      .subscribe((response: any) => {
        this.routeSubject.next(response);
        this.ToastService.showSuccess(response.message);
      });
  }

  addToReply(appId: string, petId: string) {
    this.http
      .put<{
        message: string;
        data: any;
      }>(
        `${this.apiEndPoint}/appointment/addPetToReplies`,
        { appId, petId },
        { headers: this.headers }
      )
      .subscribe((response) => {
        this.getAppointmentById(appId);
        this.ToastService.showSuccess(response.message);
      });
  }

  deleteReply(appId: string, petId: string, serviceArea: string) {
    this.http
      .put<{
        message: string;
        data: any;
      }>(
        `${this.apiEndPoint}/appointment/deleteReply`,
        { appId, petId, serviceArea },
        { headers: this.headers }
      )
      .subscribe(
        (response) => {
          console.log({ response });
          this.getAppointmentById(appId);
          this.ToastService.showSuccess(response.message);
        },
        async (error) => {
          console.log({ error });
          this.ToastService.showSuccess(error.error.message);
        }
      );
  }

  getPetsWithLocations(appId: string) {
    this.http
      .get<{ data: any[] }>(
        `${this.apiEndPoint}/client/clientsWithLocations/${appId}`,
        {
          headers: this.headers,
        }
      )
      .subscribe((response) => {
        this.petsWithLocationsSubject.next(response);
        this.loaderSubject.next(false);
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

  clearFormGroupErrors(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control instanceof FormControl) {
        control.setErrors(null);
      } else if (control instanceof FormGroup) {
        this.clearFormGroupErrors(control);
      }
    });
  }

  goHome() {
    this.router.navigateByUrl('/home');
  }

  goToLogin(): boolean {
    this.router.navigateByUrl('/login');
    this.loaderSubject.next(false);
    return false;
  }

  formatPhoneNumber(phoneNumber: string) {
    let formatted = '';
    if (phoneNumber.length > 0) {
      formatted = `(${phoneNumber.substring(0, 3)}`;
      if (phoneNumber.length >= 4) {
        formatted += `) ${phoneNumber.substring(3, 6)}`;
      }
      if (phoneNumber.length >= 7) {
        formatted += `-${phoneNumber.substring(6, 10)}`;
      }
    }

    return formatted;
  }
  formatPhoneNumberWithKey(form: FormGroup, event?: KeyboardEvent) {
    const input = form.get('contactMethod');

    // Check if `input` exists and has a value
    if (input && input.value !== null) {
      const value = input.value as string;

      // If the input contains any letters, do not format
      if (/[a-zA-Z]/.test(value)) {
        return; // Exit the function without formatting
      }

      // Otherwise, remove all non-digit characters
      let cleaned = value.replace(/\D/g, '');

      // Handle backspace: remove the last digit if Backspace is pressed
      if (event && event.key === 'Backspace') {
        cleaned = cleaned.slice(0, -1);
      }

      // Limit to max of 10 digits
      if (cleaned.length > 10) {
        cleaned = cleaned.substring(0, 10);
      }

      // Format to (###) ###-####
      let formatted = cleaned;
      if (cleaned.length > 0) {
        formatted = `(${cleaned.substring(0, 3)}`;
        if (cleaned.length >= 4) {
          formatted += `) ${cleaned.substring(3, 6)}`;
        }
        if (cleaned.length >= 7) {
          formatted += `-${cleaned.substring(6, 10)}`;
        }
      }

      // Update the form control value with the formatted phone number
      input.setValue(formatted, { emitEvent: false });
    }
  }

  removeNumberFormat(phoneNumber: string): string {
    // Check if there are no letters in the phone number
    if (!/[a-zA-Z]/.test(phoneNumber)) {
      // Assign the result of replace to phoneNumber
      phoneNumber = phoneNumber.replace(/[^\d]/g, '');
    }

    return phoneNumber;
  }
}
