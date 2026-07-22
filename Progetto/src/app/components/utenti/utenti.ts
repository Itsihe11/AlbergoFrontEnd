import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PrenotazioniService } from '../../services/prenotazioni-service';

@Component({
  selector: 'app-utenti',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './utenti.html',
  styleUrls: []
})
export class Utenti {
  private router = inject(Router);
  private http = inject(HttpClient);
  private prenotazioniService = inject(PrenotazioniService);

  modalitaAccesso: 'codice' | 'account' = 'codice';

  codicePrenotazione: string = '';
  email: string = '';
  pin: string = '';

  errore: string = '';

  login(): void {
    this.errore = '';

    if (this.modalitaAccesso === 'codice') {
      if (!this.codicePrenotazione.trim()) {
        this.errore = 'Inserisci il Codice Prenotazione!';
        return;
      }

      this.prenotazioniService.getPrenotazioneByCodice(this.codicePrenotazione.trim()).subscribe({
        next: (prenotazione) => {
          localStorage.setItem('prenotazione_corrente', JSON.stringify(prenotazione));
          localStorage.removeItem('utente_logged');

          this.router.navigate(['/clienti']);
        },
        error: (err) => {
          console.error('Errore backend:', err);
          this.errore = 'Codice Prenotazione non trovato o non valido.';
        }
      });

    } else {
      if (!this.email.trim() || !this.pin.trim()) {
        this.errore = 'Inserisci le credenziali complete!';
        return;
      }

      const payload = {
        email: this.email.trim(),
        pin: this.pin.trim()
      };

      this.http.post<any>('/api/utente/login', payload).subscribe({
        next: (res) => {
          console.log('Login effettuato:', res);
          localStorage.setItem('utente_logged', JSON.stringify(res));

          if (res.ruolo === 'ADMIN') {
            console.log('Redirect verso Area Admin');
            this.router.navigate(['/admin']);
          } else {
            if (res.prenotazione) {
              localStorage.setItem('prenotazione_corrente', JSON.stringify(res.prenotazione));
            }
            console.log('Redirect verso Area Cliente');
            this.router.navigate(['/clienti']);
          }
        },
        error: (err) => {
          console.error('Errore login:', err);
          this.errore = err.error?.error || err.error?.message || 'Credenziali non valide (Email/Username o PIN/Password errati).';
        }
      });
    }
  }
}