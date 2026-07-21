import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
          
          // 🟢 Navigazione aggiornata a /clienti
          this.router.navigate(['/clienti']);
        },
        error: (err) => {
          console.error('Errore backend:', err);
          this.errore = 'Codice Prenotazione non trovato o non valido.';
        }
      });

    } else {
      if (!this.email.trim() || !this.pin.trim()) {
        this.errore = 'Inserisci sia Email che PIN!';
        return;
      }

      this.prenotazioniService.loginUtente(this.email.trim(), this.pin.trim()).subscribe({
        next: (res) => {
          localStorage.setItem('utente_logged', JSON.stringify(res));
          if (res.prenotazione) {
            localStorage.setItem('prenotazione_corrente', JSON.stringify(res.prenotazione));
          }
          
          // 🟢 Navigazione aggiornata a /clienti
          this.router.navigate(['/clienti']);
        },
        error: (err) => {
          console.error('Errore login:', err);
          this.errore = 'Credenziali non valide (Email o PIN errati).';
        }
      });
    }
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }
}