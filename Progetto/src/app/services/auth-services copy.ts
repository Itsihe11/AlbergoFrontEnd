// questo è quello giusto, l'altro è una prova per vedere se si connette

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRisposta } from '../interface/loginrisposta';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly urlSpring = '/api/auth';

  token: string | null = null;
  ruolo: 'CLIENTE' | 'ADMIN' | null = null;

  login(email: string, password: string): Observable<LoginRisposta> {
    return this.http.post<LoginRisposta>(`${this.urlSpring}/login`, { email, password });
  }

  logout(): void {
    this.token = null;
    this.ruolo = null;
  }
  
  isLoggedIn(): boolean {
    return !!this.token;
  }
}