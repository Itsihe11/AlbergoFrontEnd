import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
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
    return this.http.post<LoginRisposta>(`${this.urlSpring}/login`, { email, password }).pipe(
      tap((res) => {
        this.token = res.token;
        this.ruolo = res.ruolo;
      })
    );
  }

  logout(): void {
    this.token = null;
    this.ruolo = null;
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }
}