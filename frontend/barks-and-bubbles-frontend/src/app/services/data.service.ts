import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DataService {
  private clientsSubject: BehaviorSubject<any[]> = new BehaviorSubject<any[]>(
    []
  );
  clients$: Observable<any[]> = this.clientsSubject.asObservable();
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
}
