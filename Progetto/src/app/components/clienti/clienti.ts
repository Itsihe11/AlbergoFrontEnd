import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PrenotazioniService } from '../../services/prenotazioni-service';

@Component({
  selector: 'app-clienti',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clienti.html',
  styleUrls: []
})
export class Clienti implements OnInit {
  private router = inject(Router);
  private prenotazioniService = inject(PrenotazioniService);

  prenotazione: any = null;
  messaggio: string = '';
  errore: string = '';

  // Gestione Modal / Modifica Ospiti
  mostraModalModifica: boolean = false;
  nuoviOspiti: any[] = [];

  nuovaEmail: string = '';
  nuovoPin: string = '';

  ngOnInit(): void {
    const raw = localStorage.getItem('prenotazione_corrente');
    if (raw) {
      this.prenotazione = JSON.parse(raw);
    } else {
      this.router.navigate(['/utenti']);
    }
  }

  annullaPrenotazione(): void {
    if (!confirm('Sei sicuro di voler annullare questa prenotazione?')) return;

    const codice = this.prenotazione.codice_prenotazione || this.prenotazione.codicePrenotazione;

    this.prenotazioniService.annullaPrenotazione(codice).subscribe({
      next: () => {
        alert('Prenotazione annullata con successo.');
        this.logout();
      },
      error: () => {
        this.errore = 'Impossibile annullare la prenotazione.';
      }
    });
  }

  apriModificaOspiti(): void {
    this.errore = '';
    this.messaggio = '';
    this.nuoviOspiti = JSON.parse(JSON.stringify(this.prenotazione.ospiti || []));
    this.nuovaEmail = this.prenotazione.email || '';
    this.nuovoPin = this.prenotazione.pin || '';
    this.mostraModalModifica = true;
  }

  aggiungiOspite(): void {
    this.nuoviOspiti.push({ nome: '', cognome: '', datanascita: '' });
  }

  rimuoviOspite(index: number): void {
    if (this.nuoviOspiti.length > 1) {
      this.nuoviOspiti.splice(index, 1);
    }
  }

  salvaModificaOspiti(): void {
    this.errore = '';
    this.messaggio = '';

    if (!this.nuovaEmail.trim() || !this.nuovoPin.trim()) {
      this.errore = 'Per modificare gli ospiti devi inserire Email e PIN!';
      return;
    }

    const ospitiFormattati = this.nuoviOspiti.map(ospite => ({
      nome: ospite.nome,
      cognome: ospite.cognome,
      datanascita: (ospite.datanascita || ospite.dataNascita) ? (ospite.datanascita || ospite.dataNascita) : null
    }));

    const payload = {
      codicePrenotazione: this.prenotazione.codice_prenotazione || this.prenotazione.codicePrenotazione,
      emailUtente: this.nuovaEmail.trim(),
      pinUtente: this.nuovoPin.trim(),
      ospiti: ospitiFormattati
    };

    this.prenotazioniService.modificaOspitiECreaAccount(payload).subscribe({
      next: () => {
        this.prenotazione.ospiti = [...ospitiFormattati];
        this.prenotazione.email = this.nuovaEmail.trim();
        this.prenotazione.pin = this.nuovoPin.trim();

        localStorage.setItem('prenotazione_corrente', JSON.stringify(this.prenotazione));

        this.mostraModalModifica = false;
        this.messaggio = 'Ospiti aggiornati e account creato con successo!';
      },
      error: (err) => {
        this.errore = err.error?.error || 'Superata capienza massima della stanza.';
      }
    });
  }

  chiudiModal(): void {
    this.mostraModalModifica = false;
  }

  logout(): void {
    localStorage.removeItem('prenotazione_corrente');
    localStorage.removeItem('utente_logged');
    this.router.navigate(['/utenti']);
  }
}