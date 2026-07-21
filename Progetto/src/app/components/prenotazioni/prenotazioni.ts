import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrenotazioniService, PensioneInfo } from '../../services/prenotazioni-service';
import { Ospite } from '../../interface/prenotazione';

@Component({
  selector: 'app-prenotazioni',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prenotazioni.html',
  styleUrls: []
})
export class Prenotazioni implements OnInit {
  private prenotazioniService = inject(PrenotazioniService);

  // Form State
  tipoPrenotazione: string = 'ALBERGO'; // 'ALBERGO' oppure 'SPA'
  tipoCamera: string = '';
  stanzaSelezionata: string = '';
  pensione: string = 'MEZZA';
  checkIn: string = '';
  checkOut: string = '';
  metodoPagamento: string = 'BONIFICO'; // Solo Bonifico
  ospiti: Ospite[] = [{ nome: '', cognome: '', dataNascita: '' }];

  // Dati da DB / Fallback
  listaPensioni: PensioneInfo[] = [];
  prezzoSpa: number = 200;

  tipiCamera: any[] = [];
  stanzeDisponibili: any[] = [];

  // Servizi Aggiuntivi (Caricati da DB)
  listaServizi: any[] = [];
  serviziSelezionatiIds: number[] = [];

  // Flags e Feedback UI
  caricamentoCamere: boolean = false;
  erroreCamere: string = '';
  caricamentoStanze: boolean = false;
  messaggio: string = '';
  errore: string = '';

  // 🟢 AGGIUNTO: Memorizza la risposta di Spring Boot per mostrare la ricevuta
  prenotazioneConfermata: any = null;

  // 🟢 AGGIUNTO: Ripristina il modulo per inserire una nuova prenotazione
  nuovaPrenotazione(): void {
    this.prenotazioneConfermata = null;
    this.messaggio = '';
    this.errore = '';
    this.stanzaSelezionata = '';
    this.tipoCamera = '';
    this.serviziSelezionatiIds = [];
    this.checkIn = '';
    this.checkOut = '';
    this.ospiti = [{ nome: '', cognome: '', dataNascita: '' }];
  }

  // HELPER SERVIZI AGGIUNTIVI
  toggleServizio(id: any): void {
    const numId = Number(id);
    const index = this.serviziSelezionatiIds.indexOf(numId);
    if (index > -1) {
      this.serviziSelezionatiIds.splice(index, 1);
    } else {
      this.serviziSelezionatiIds.push(numId);
    }
  }

  isServizioSelezionato(id: any): boolean {
    return this.serviziSelezionatiIds.includes(Number(id));
  }

  getServizioId(servizio: any): number {
    if (!servizio) return 0;
    return Number(servizio.idservizio || servizio.idServizio || servizio.id || 0);
  }

  getServizioNome(servizio: any): string {
    if (!servizio) return '';
    return servizio.nomeservizio || servizio.nomeServizio || servizio.nome || 'Servizio';
  }

  getServizioPrezzo(servizio: any): number {
    if (!servizio) return 0;
    return Number(servizio.prezzi || servizio.prezzo || 0);
  }

  ngOnInit(): void {
    // 1. Carica pensioni da Spring Boot
    this.prenotazioniService.getPensioni().subscribe({
      next: (data: PensioneInfo[]) => {
        if (data && data.length > 0) this.listaPensioni = data;
      },
      error: (err: any) => console.warn('Pensione API offline: usati dati di fallback.', err)
    });

    // 2. Carica prezzo SPA
    this.prenotazioniService.getPrezzoSpa().subscribe({
      next: (val: number) => {
        if (val) this.prezzoSpa = val;
      },
      error: (err: any) => console.warn('SPA API offline: usato prezzo di fallback.', err)
    });

    // 3. Carica i servizi aggiuntivi dal DB
    this.caricaServizi();

    // 4. Carica i tipi di camera
    this.caricaTipiCamera();

    // 5. Carica inizialmente tutte le stanze dal DB
    this.caricaTutteLeStanze();
  }

  caricaServizi(): void {
    if (typeof this.prenotazioniService.getServizi === 'function') {
      this.prenotazioniService.getServizi().subscribe({
        next: (res: any[]) => {
          if (res) this.listaServizi = res;
        },
        error: (err: any) => console.warn('Servizi API offline.', err)
      });
    }
  }

  caricaTipiCamera(): void {
    this.caricamentoCamere = true;
    this.prenotazioniService.getTipiCamera().subscribe({
      next: (res: any[]) => {
        if (res && res.length > 0) {
          this.tipiCamera = res;
        } else {
          this.useDefaultTipiCamera();
        }
        this.caricamentoCamere = false;
      },
      error: (err: any) => {
        console.warn('Tipologie Camera API offline: usati dati di fallback.', err);
        this.useDefaultTipiCamera();
        this.caricamentoCamere = false;
      }
    });
  }

  private useDefaultTipiCamera(): void {
    this.tipiCamera = [
      { id: 1, nomeTipologia: 'Singola Standard' },
      { id: 2, nomeTipologia: 'Doppia Deluxe' },
      { id: 3, nomeTipologia: 'Suite' }
    ];
  }

  caricaTutteLeStanze(): void {
    this.caricamentoStanze = true;
    this.prenotazioniService.getTutteLeStanze().subscribe({
      next: (res: any[]) => {
        if (res && res.length > 0) {
          this.stanzeDisponibili = res;
        } else {
          this.useDefaultStanze();
        }
        this.caricamentoStanze = false;
      },
      error: (err: any) => {
        console.warn('Tutte le Stanze API offline: usate stanze di fallback.', err);
        this.useDefaultStanze();
        this.caricamentoStanze = false;
      }
    });
  }

  cercaStanzeDisponibili(): void {
    if (!this.checkIn || !this.checkOut) {
      if (this.stanzeDisponibili.length === 0) {
        this.caricaTutteLeStanze();
      }
      return;
    }

    this.stanzaSelezionata = '';
    this.caricamentoStanze = true;

    this.prenotazioniService.getStanzeDisponibili(this.checkIn, this.checkOut).subscribe({
      next: (res: any[]) => {
        if (res && res.length > 0) {
          this.stanzeDisponibili = res;
        } else {
          this.useDefaultStanze();
        }
        this.caricamentoStanze = false;
      },
      error: (err: any) => {
        console.warn('Stanze Disponibili API offline: usate stanze di fallback.', err);
        this.useDefaultStanze();
        this.caricamentoStanze = false;
      }
    });
  }

  private useDefaultStanze(): void {
    this.stanzeDisponibili = [
      { id: 1, numeroStanza: '101', tipologiaStanza: { nomeTipologia: 'Singola Standard', prezzo: 50 } },
      { id: 2, numeroStanza: '102', tipologiaStanza: { nomeTipologia: 'Singola Standard', prezzo: 50 } },
      { id: 3, numeroStanza: '201', tipologiaStanza: { nomeTipologia: 'Doppia Deluxe', prezzo: 90 } },
      { id: 4, numeroStanza: '301', tipologiaStanza: { nomeTipologia: 'Suite', prezzo: 150 } }
    ];
  }

  onTipoCameraChange(tipo: string): void {
    this.stanzaSelezionata = '';
    this.cercaStanzeDisponibili();
  }

  onDateChange(): void {
    this.cercaStanzeDisponibili();
  }

  // FILTRO DINAMICO
  get stanzeFiltrate(): any[] {
    if (!this.tipoCamera) {
      return this.stanzeDisponibili;
    }

    const tipoSel = this.tipoCamera.toString().toLowerCase().trim();

    return this.stanzeDisponibili.filter((stanza: any) => {
      const nomeTipo = this.getTipologiaStanzaNome(stanza).toLowerCase().trim();
      const idTipo = stanza.tipologiaStanza?.id?.toString() || stanza.tipologia?.id?.toString() || '';

      if (!nomeTipo && !idTipo) return true;

      return (nomeTipo !== '' && nomeTipo === tipoSel) ||
             (idTipo !== '' && idTipo === tipoSel) ||
             nomeTipo.includes(tipoSel) ||
             tipoSel.includes(nomeTipo);
    });
  }

  getValoreTipoCamera(tipo: any): string {
    if (!tipo) return '';
    if (typeof tipo === 'string') return tipo;
    return tipo.nomeTipologia || tipo.nome || tipo.tipo || tipo.tipoCamera || '';
  }

  getStanzaId(stanza: any): string | number {
    if (!stanza) return '';
    if (typeof stanza === 'string' || typeof stanza === 'number') return stanza;
    return stanza.id || stanza.idStanza || stanza.numeroStanza || stanza.numero || '';
  }

  getStanzaNumero(stanza: any): string | number {
    if (!stanza) return '';
    if (typeof stanza === 'string' || typeof stanza === 'number') return stanza;
    return stanza.numeroStanza || stanza.numero || stanza.id || stanza.idStanza || '';
  }

  getTipologiaStanzaNome(stanza: any): string {
    if (!stanza) return '';
    if (typeof stanza.tipologiaStanza === 'string') return stanza.tipologiaStanza;
    if (typeof stanza.tipologia === 'string') return stanza.tipologia;
    return stanza.tipologiaStanza?.nomeTipologia ||
           stanza.tipologiaStanza?.nome ||
           stanza.tipologia?.nomeTipologia ||
           stanza.tipologia?.nome ||
           stanza.tipoCamera ||
           stanza.tipo || '';
  }

  includeAlbergo(): boolean {
    return this.tipoPrenotazione === 'ALBERGO';
  }

  includeSpa(): boolean {
    return this.tipoPrenotazione === 'SPA';
  }

  cambioTipoPrenotazione(): void {
    this.messaggio = '';
    this.errore = '';
    if (!this.includeAlbergo()) {
      this.stanzaSelezionata = '';
      this.tipoCamera = '';
      this.serviziSelezionatiIds = [];
    }
  }

  numeroNotti(): number {
    if (!this.checkIn || !this.checkOut) return 0;
    const start = new Date(this.checkIn);
    const end = new Date(this.checkOut);
    const diff = end.getTime() - start.getTime();
    const notti = Math.ceil(diff / (1000 * 3600 * 24));
    return notti > 0 ? notti : 0;
  }

  prezzoTotale(): number {
    let totale = 0;
    const notti = this.numeroNotti();

    // 1. Calcolo Albergo (Prezzo Stanza + Pensione + Servizi)
    if (this.includeAlbergo()) {
      if (this.stanzaSelezionata) {
        const stanzaObj = this.stanzeDisponibili.find(
          s => this.getStanzaId(s).toString() === this.stanzaSelezionata.toString()
        );
        if (stanzaObj) {
          const prezzoStanza = stanzaObj.tipologiaStanza?.prezzo || stanzaObj.tipologia?.prezzo || 0;
          totale += (prezzoStanza * notti);
        }
      }

      const pSel = this.listaPensioni.find((p: PensioneInfo) => p.tipo === this.pensione);
      if (pSel) {
        totale += (pSel.prezzo * notti * this.ospiti.length);
      }

      // Servizi aggiuntivi (solo se Albergo)
      if (this.serviziSelezionatiIds && this.serviziSelezionatiIds.length > 0) {
        for (const id of this.serviziSelezionatiIds) {
          const sObj = this.listaServizi.find(s => this.getServizioId(s) === Number(id));
          if (sObj) {
            totale += this.getServizioPrezzo(sObj);
          }
        }
      }
    }

    // 2. Calcolo SPA
    if (this.includeSpa()) {
      totale += this.prezzoSpa;
    }

    return totale;
  }

  caparra(): number {
    return Math.round(this.prezzoTotale() * 0.1);
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
    this.messaggio = '';
    this.errore = '';

    // 1. VALIDAZIONE DATE
    if (!this.checkIn) {
      this.errore = 'Seleziona prima la data di Check-in / Prenotazione!';
      return;
    }

    const checkInFinale = this.checkIn;
    const checkOutFinale = this.checkOut ? this.checkOut : this.checkIn;

    if (this.includeAlbergo() && !this.checkOut) {
      this.errore = 'Seleziona la data di Check-out!';
      return;
    }

    if (this.includeAlbergo() && !this.stanzaSelezionata) {
      this.errore = 'Seleziona una stanza disponibile!';
      return;
    }

    // 2. MAPPATURA PENSIONE (1: COMPLETA, 2: MEZZA, 3: NESSUNA)
    let idPensioneVal: number = 3;
    if (this.includeAlbergo()) {
      if (this.pensione === 'COMPLETA') {
        idPensioneVal = 1;
      } else if (this.pensione === 'MEZZA') {
        idPensioneVal = 2;
      } else {
        idPensioneVal = 3;
      }
    }

    // 3. MAPPATURA STANZA
    let idStanzaVal: number | null = null;
    if (this.includeAlbergo() && this.stanzaSelezionata) {
      idStanzaVal = Number(this.stanzaSelezionata);
    }

    // 4. MAPPATURA ID SERVIZI AGGIUNTIVI (Solo se Albergo)
    const serviziIds = this.includeAlbergo() ? this.serviziSelezionatiIds.map(id => Number(id)) : [];

    // 5. STRUTTURA PAYLOAD
    const payload = {
      idStanza: idStanzaVal,
      checkin: checkInFinale,
      checkout: checkOutFinale,
      checkIn: checkInFinale,
      checkOut: checkOutFinale,
      idPensione: idPensioneVal,
      tipoPrenotazione: this.tipoPrenotazione,
      dovePrenotazione: 'WEB',
      tipoPagamento: 'BONIFICO',
      ospiti: this.ospiti,
      serviziAggiuntivi: serviziIds
    };

    console.log('Payload inviato a Spring Boot:', payload);

    this.prenotazioniService.creaPrenotazione(payload).subscribe({
      next: (res: any) => {
        // 🟢 SALVA LA RISPOSTA RICEVUTA DA SPRING BOOT
        this.prenotazioneConfermata = res;
        this.messaggio = 'Prenotazione confermata con successo!';
        
        // Scorri in cima per mostrare subito la scheda di conferma
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err: any) => {
        console.error('Errore risposta Spring Boot:', err);

        if (err.error && typeof err.error === 'string') {
          this.errore = err.error;
        } else if (err.error && err.error.message) {
          this.errore = err.error.message;
        } else if (err.message) {
          this.errore = err.message;
        } else {
          this.errore = 'Si è verificato un errore durante la registrazione della prenotazione.';
        }
      }
    });
  }
}