import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class DataService {
  clients: any[] = [];
  apiEndPoint = 'http://localhost:8800/api';

  constructor(private http: HttpClient) {}

  getAllClients(): Observable<any> {
    return this.http.get<{ data: any[] }>(`${this.apiEndPoint}/client/`);
  }

  addClientsToTable(data: any[]): Observable<any> {
    return this.http.put<{ data: any[] }>(`${this.apiEndPoint}/client/add`, {
      data,
    });
  }
}
