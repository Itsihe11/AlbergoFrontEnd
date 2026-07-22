import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RichiestaAdmin } from '../interface/richiestaadmin';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = '/api/admin';
  private loggedIn: boolean = false; 

  constructor(private http: HttpClient) {}

  login(credentials: RichiestaAdmin): Observable<string> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { responseType: 'text' });
  }

  setLoggedIn(status: boolean): void {
    this.loggedIn = status;
  }

  logout(): void {
    this.loggedIn = false;
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }


creaServizio(servizio: { nomeservizio: string; descrizione: string; prezzi: number }): Observable<string> {
  return this.http.post('/api/dipendenti/servizi/datiServizi', servizio, { responseType: 'text' });
}

eliminaServizio(id: number | string): Observable<string> {
  return this.http.delete(`/api/dipendenti/servizi/cancellaServizi/${id}`, { responseType: 'text' });
}

}