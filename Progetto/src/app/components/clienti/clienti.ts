import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  prenotazione: any = null;
  messaggio: string = '';
  errore: string = '';

  mostraModalModifica: boolean = false;
  nuoviOspiti: any[] = [];

  nuovaEmail: string = '';
  nuovoPin: string = '';

  capienzaRecuperata: number | null = null;

  ngOnInit(): void {
    const raw = localStorage.getItem('prenotazione_corrente');
    if (raw) {
      this.prenotazione = JSON.parse(raw);
      this.caricaCapienzaStanza();
    } else {
      this.router.navigate(['/utenti']);
    }
  }

  caricaCapienzaStanza(): void {
    if (this.capienzaStanza() !== null) return;

    this.prenotazioniService.getTutteLeStanze().subscribe({
      next: (stanze: any[]) => {
        if (!stanze || !this.prenotazione) return;

        const idStanza = this.prenotazione.idStanza || this.prenotazione.id_stanza ||
                         (typeof this.prenotazione.stanza === 'object' ? this.prenotazione.stanza?.id : this.prenotazione.stanza);
        const numStanza = this.prenotazione.numeroStanza || this.prenotazione.numero_stanza ||
                          this.prenotazione.stanza?.numeroStanza || this.prenotazione.stanza?.numero;

        const stanzaTrovata = stanze.find(s =>
          (idStanza && (s.id == idStanza || s.idStanza == idStanza)) ||
          (numStanza && (s.numeroStanza == numStanza || s.numero == numStanza))
        );

        if (stanzaTrovata) {
          const cap = stanzaTrovata.tipologiaStanza?.capienza ?? stanzaTrovata.tipologia?.capienza ?? stanzaTrovata.capienza;
          if (cap) {
            this.capienzaRecuperata = Number(cap);
            this.cdr.detectChanges();
          }
        }
      },
      error: err => console.warn('Impossibile recuperare la capienza dalle stanze:', err)
    });
  }

  capienzaStanza(): number | null {
    if (this.capienzaRecuperata !== null) return this.capienzaRecuperata;
    if (!this.prenotazione) return null;

    const p = this.prenotazione;
    const cap = p.stanza?.tipologiaStanza?.capienza ??
                p.stanza?.tipologia?.capienza ??
                p.stanza?.capienza ??
                p.tipologiaStanza?.capienza ??
                p.tipologia?.capienza ??
                p.capienzaStanza ??
                p.capienza;

    return cap ? Number(cap) : null;
  }

  superaCapienza(): boolean {
    const cap = this.capienzaStanza();
    if (cap === null) return false;
    return this.nuoviOspiti.length > cap;
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
    const cap = this.capienzaStanza();
    if (cap !== null && this.nuoviOspiti.length >= cap) {
      alert(`Impossibile aggiungere altri ospiti! La capienza massima di questa stanza e' di ${cap} persone.`);
      return;
    }
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

    if (this.superaCapienza()) {
      const cap = this.capienzaStanza();
      this.errore = `Hai inserito ${this.nuoviOspiti.length} ospiti, ma la capienza massima della stanza e' di ${cap}.`;
      return;
    }

    const ospitiFormattati = this.nuoviOspiti.map(ospite => ({
      nome: ospite.nome,
      cognome: ospite.cognome,
      datanascita: (ospite.datanascita || ospite.dataNascita) ? (ospite.datanascita || ospite.dataNascita) : null,
      dataNascita: (ospite.datanascita || ospite.dataNascita) ? (ospite.datanascita || ospite.dataNascita) : null
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
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errore = err.error?.error || 'Superata capienza massima della stanza.';
        this.cdr.detectChanges();
      }
    });
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
        this.cdr.detectChanges();
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