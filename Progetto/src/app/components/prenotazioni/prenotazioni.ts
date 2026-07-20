import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PrenotazioniService } from '../../services/prenotazioni-service';
import { CamereService } from '../../services/camere.service';
import { Ospite } from '../../interface/prenotazione';
import { Stanza, TipoCamera } from '../../interface/tipocamera';

@Component({
  selector: 'app-prenotazioni',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './prenotazioni.html',
  styleUrl: './prenotazioni.css',
})
export class Prenotazioni implements OnInit {

  private prenotazioniService = inject(PrenotazioniService);
  private camereService = inject(CamereService);

  tipiCamera: TipoCamera[] = [];
  stanzeDisponibili: Stanza[] = [];

  caricamentoCamere = true;
  caricamentoStanze = false;
  erroreCamere: string | null = null;

  prezzoSpa = 200;
  supplementoPensioneCompleta = 15;

  tipoPrenotazione: 'ALBERGO' | 'ALBERGO_SPA' | 'SPA' = 'ALBERGO';
  tipoCamera = '';
  stanzaSelezionata: number | null = null;
  checkIn = '';
  checkOut = '';
  pensione: 'MEZZA' | 'COMPLETA' = 'MEZZA';
  metodoPagamento: 'BONIFICO' | 'CARTA' = 'CARTA';

  ospiti: Ospite[] = [{ nome: '', cognome: '', dataNascita: '' }];

  messaggio: string | null = null;
  errore: string | null = null;

  ngOnInit(): void {
    this.caricamentoCamere = true;
    this.camereService.getTipiCamera().subscribe({
      next: (data) => {
        console.log('Tipi camera ricevuti dal backend:', data);
        this.tipiCamera = data;
        this.caricamentoCamere = false;
      },
      error: (err) => {
        console.error('Errore nel recupero tipi camera:', err);
        this.erroreCamere = 'Impossibile caricare i tipi di camera.';
        this.caricamentoCamere = false;
      }
    });
  }

 onTipoCameraChange(tipoSelezionato: string): void {
  if (!tipoSelezionato) {
    this.stanzeDisponibili = [];
    return;
  }

  this.tipoCamera = tipoSelezionato; // Assicuriamo che la variabile sia aggiornata
  this.caricamentoStanze = true;
  this.stanzeDisponibili = []; // Resettiamo la lista precedente

  this.camereService.getStanzePerTipo(tipoSelezionato).subscribe({
    next: (stanze) => {
      console.log('Stanze filtrate trovate:', stanze); // 🔍 Utile per il debug
      this.stanzeDisponibili = stanze;
      this.caricamentoStanze = false;
    },
    error: (err) => {
      console.error('Errore nel caricamento delle stanze:', err);
      this.caricamentoStanze = false;
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
      const camera = this.tipiCamera.find(c => 
        c.nome === this.tipoCamera || 
        (c as any).tipoCamera === this.tipoCamera || 
        (c as any).tipo === this.tipoCamera
      );

      const prezzoCamera = camera?.prezzo ?? 0;
      totale += prezzoCamera * notti;

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

    if (this.includeAlbergo() && !this.stanzaSelezionata) {
      this.errore = 'Seleziona una stanza valida.';
      return;
    }

    if (this.ospiti.some(o => !o.nome || !o.cognome || !o.dataNascita)) {
      this.errore = 'Compila i dati di tutti gli ospiti.';
      return;
    }

    const payloadPrenotazione: any = {
      tipoPrenotazione: this.tipoPrenotazione,
      tipoCamera: this.includeAlbergo() ? this.tipoCamera : undefined,
      stanzaId: this.includeAlbergo() ? this.stanzaSelezionata : undefined,
      checkIn: this.checkIn,
      checkOut: this.checkOut,
      pensione: this.includeAlbergo() ? this.pensione : undefined,
      ospiti: this.ospiti,
      metodoPagamento: this.metodoPagamento,
      caparra: this.caparra(),
      prezzoTotale: this.prezzoTotale(),
    };

    console.log('Payload inviato a PrenotazioniService:', payloadPrenotazione);

    this.prenotazioniService.creaPrenotazione(payloadPrenotazione).subscribe({
      next: (res) => {
        console.log('Risposta dal servizio prenotazioni:', res);
        this.messaggio = 'Prenotazione effettuata con successo!';
      },
      error: (err) => {
        console.error('Errore durante il salvataggio:', err);
        this.errore = 'Errore durante il salvataggio della prenotazione.';
      }
    });
  }
}