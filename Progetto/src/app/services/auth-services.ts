import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { LoginRisposta } from '../interface/loginrisposta';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly urlSpring = '/api/auth';

  // TEMPORANEO: metti false quando il backend Spring Boot è pronto
  private readonly USA_MOCK = true;

  token: string | null = null;
  ruolo: 'CLIENTE' | 'ADMIN' | null = null;

  login(email: string, password: string): Observable<LoginRisposta> {
    const richiesta: Observable<LoginRisposta> = this.USA_MOCK
      ? of({
          token: 'token-finto-di-test-12345',
          ruolo: email.toLowerCase() === 'admin' ? 'ADMIN' : 'CLIENTE'
        })
      : this.http.post<LoginRisposta>(`${this.urlSpring}/login`, { email, password });

    return richiesta.pipe(
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