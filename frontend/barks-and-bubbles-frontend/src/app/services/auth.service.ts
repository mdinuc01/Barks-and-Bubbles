import { StorageService } from './storage.service';
import { DataService } from './data.service';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const apiEndPoint = environment.domain;
const AUTH_API = `${apiEndPoint}/auth/`;
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn = false;

  constructor(
    private http: HttpClient,
    private DataService: DataService,
    private StorageService: StorageService
  ) {}

  login(username: string, password: string): Observable<any> {
    this.DataService.showLoader();

    return this.http.post(
      AUTH_API + 'signin',
      {
        username,
        password,
      },
      httpOptions
    );
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(
      AUTH_API + 'signup',
      {
        username,
        password,
      },
      httpOptions
    );
  }

  logout(): Observable<any> {
    this.DataService.hideLoader();
    this.DataService.goToLogin();
    return this.http.post(AUTH_API + 'signout', {}, httpOptions);
  }
}
