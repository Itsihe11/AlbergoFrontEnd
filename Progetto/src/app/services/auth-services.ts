import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs'; // <-- Assicurati di importare 'of'
import { LoginRisposta } from '../interface/loginrisposta';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly urlSpring = '/api/auth';

  token: string | null = null;
  ruolo: 'CLIENTE' | 'ADMIN' | null = null;

  // MODIFICHIAMO QUESTO METODO PER IL TEST LOCALE:
  login(email: string, password: string): Observable<LoginRisposta> {
    let ruoloScelto: 'CLIENTE' | 'ADMIN' = 'CLIENTE';

    // Se inserisci "admin" come email, simuliamo l'accesso amministratore
    if (email.toLowerCase() === 'admin') {
      ruoloScelto = 'ADMIN';
    }

    // Usiamo 'of' per restituire immediatamente i dati come se arrivassero dal server
    return of({
      token: 'token-finto-di-test-12345',
      ruolo: ruoloScelto
    });
  }

  logout(): void {
    this.token = null;
    this.ruolo = null;
  }
  
  isLoggedIn(): boolean {
    return !!this.token;
  }
}