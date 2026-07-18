import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PrenotazioniService } from '../../services/prenotazioni-service';
import { CamereService } from '../../services/camere.service';
import { Prenotazione, Ospite } from '../../interface/prenotazione';
import { TipoCamera } from '../../interface/tipocamera';

@Component({
  selector: 'app-prenotazioni',
  imports: [FormsModule],
  templateUrl: './prenotazioni.html',
  styleUrl: './prenotazioni.css',
})
export class Prenotazioni implements OnInit {

  private prenotazioniService = inject(PrenotazioniService);
  private camereService = inject(CamereService);

  tipiCamera: TipoCamera[] = [];
  caricamentoCamere = true;
  erroreCamere: string | null = null;

  prezzoSpa = 200;
  supplementoPensioneCompleta = 15;

  tipoPrenotazione: 'ALBERGO' | 'ALBERGO_SPA' | 'SPA' = 'ALBERGO';
  tipoCamera = '';
  checkIn = '';
  checkOut = '';
  pensione: 'MEZZA' | 'COMPLETA' = 'MEZZA';
  metodoPagamento: 'BONIFICO' | 'CARTA' = 'CARTA';

  ospiti: Ospite[] = [{ nome: '', cognome: '', dataNascita: '' }];

  messaggio: string | null = null;
  errore: string | null = null;

  ngOnInit(): void {
    this.camereService.getCamere().subscribe({
      next: (camere) => {
        this.tipiCamera = camere;
        if (camere.length > 0) {
          this.tipoCamera = camere[0].nome;
        }
        this.caricamentoCamere = false;
      },
      error: () => {
        this.erroreCamere = 'Impossibile caricare le camere. Riprova più tardi.';
        this.caricamentoCamere = false;
      }
    });
  }

  includeAlbergo(): boolean {
    return this.tipoPrenotazione === 'ALBERGO' || this.tipoPrenotazione === 'ALBERGO_SPA';
  }

  includeSpa(): boolean {
    return this.tipoPrenotazione === 'ALBERGO_SPA' || this.tipoPrenotazione === 'SPA';
  }

  numeroNotti(): number {
    if (!this.checkIn || !this.checkOut) return 0;
    const in_ = new Date(this.checkIn);
    const out = new Date(this.checkOut);
    const diff = out.getTime() - in_.getTime();
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  }

  prezzoTotale(): number {
    let totale = 0;
    const notti = this.numeroNotti();

    if (this.includeAlbergo() && notti > 0) {
      const camera = this.tipiCamera.find(c => c.nome === this.tipoCamera);
      if (camera) {
        totale += camera.prezzo * notti;
      }
      if (this.pensione === 'COMPLETA') {
        totale += this.supplementoPensioneCompleta * notti * this.ospiti.length;
      }
    }

    if (this.includeSpa()) {
      totale += this.prezzoSpa;
    }

    return totale;
  }

  caparra(): number {
    return Math.round(this.prezzoTotale() * 0.10 * 100) / 100;
  }

  aggiungiOspite(): void {
    this.ospiti.push({ nome: '', cognome: '', dataNascita: '' });
  }

  rimuoviOspite(index: number): void {
    if (this.ospiti.length > 1) {
      this.ospiti.splice(index, 1);
    }
  }

  prenota(): void {
    this.errore = null;
    this.messaggio = null;

    if (!this.checkIn || !this.checkOut || this.numeroNotti() <= 0) {
      this.errore = 'Inserisci date di check-in e check-out valide.';
      return;
    }
    if (this.ospiti.some(o => !o.nome || !o.cognome || !o.dataNascita)) {
      this.errore = 'Compila i dati di tutti gli ospiti.';
      return;
    }

    const prenotazione: Prenotazione = {
      tipoPrenotazione: this.tipoPrenotazione,
      tipoCamera: this.includeAlbergo() ? this.tipoCamera : undefined,
      checkIn: this.checkIn,
      checkOut: this.checkOut,
      pensione: this.includeAlbergo() ? this.pensione : undefined,
      ospiti: this.ospiti,
      metodoPagamento: this.metodoPagamento,
      caparra: this.caparra(),
      prezzoTotale: this.prezzoTotale(),
    };

    this.prenotazioniService.creaPrenotazione(prenotazione).subscribe({
      next: () => {
        this.messaggio = 'Prenotazione effettuata con successo!';
      },
      error: () => {
        this.errore = 'Errore durante la prenotazione. Riprova più tardi.';
      }
    });
  }
}