import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { PrenotazioniService } from '../../services/prenotazioni-service';
import { PensioneInfo } from '../../interface/pensioneinfo';
import { ServizioInfo } from '../../interface/servizioinfo';
import { TipoCamera, Stanza } from '../../interface/tipocamera';
import { Ospite, PayloadPrenotazione } from '../../interface/prenotazione';

@Component({
  selector: 'app-prenotazioni',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prenotazioni.html',
  styleUrls: []
})
export class Prenotazioni implements OnInit {
  private prenotazioniService = inject(PrenotazioniService);
  private cdr = inject(ChangeDetectorRef);

  formBlock: boolean = false;

  // Form State
  tipoPrenotazione: string = 'ALBERGO';
  tipoCamera: string = '';
  stanzaSelezionata: string = '';
  pensione: string = 'MEZZA';
  checkIn: string = '';
  checkOut: string = '';
  metodoPagamento: string = 'BONIFICO';

  ospiti: Ospite[] = [{ nome: '', cognome: '', dataNascita: '' }];
  listaPensioni: PensioneInfo[] = [];
  prezzoSpa: number = 200;
  tipiCamera: TipoCamera[] = [];
  stanzeDisponibili: Stanza[] = [];
  listaServizi: ServizioInfo[] = [];
  serviziSelezionatiIds: number[] = [];

  caricamentoCamere: boolean = false;
  caricamentoStanze: boolean = false;

  messaggio: string = '';
  errore: string = '';
  prenotazioneConfermata: any = null;

  // Helper privato per scrollare la pagina in cima in modo fluido
  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Helper per mostrare un messaggio di errore e fare lo scroll in cima
  private mostraErrore(messaggioErrore: string): void {
    this.errore = messaggioErrore;
    this.scrollToTop();
  }

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
    this.prenotazioniService.getPensioni().subscribe({
      next: (data: PensioneInfo[]) => {
        if (data && data.length > 0) this.listaPensioni = data;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.warn('Pensione API offline: usati dati di fallback.', err)
    });

    this.prenotazioniService.getPrezzoSpa().subscribe({
      next: (val: number) => {
        if (val) this.prezzoSpa = val;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.warn('SPA API offline: usato prezzo di fallback.', err)
    });

    this.caricaServizi();
    this.caricaTipiCamera();
    this.caricaTutteLeStanze();
  }

  caricaServizi(): void {
    this.prenotazioniService.getServizi().pipe(
      finalize(() => {
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res: ServizioInfo[]) => {
        if (res) {
          this.listaServizi = res;
        }
      },
      error: (err: any) => console.warn('Servizi API offline.', err)
    });
  }

  caricaTipiCamera(): void {
    this.caricamentoCamere = true;
    this.prenotazioniService.getTipiCamera().subscribe({
      next: (res: TipoCamera[]) => {
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
      next: (res: Stanza[]) => {
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
      next: (res: Stanza[]) => {
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
      { id: 1, numeroStanza: '101', tipologiaStanza: { nomeTipologia: 'Singola Standard', prezzo: 50, capienza: 1 } },
      { id: 2, numeroStanza: '102', tipologiaStanza: { nomeTipologia: 'Singola Standard', prezzo: 50, capienza: 1 } },
      { id: 3, numeroStanza: '201', tipologiaStanza: { nomeTipologia: 'Doppia Deluxe', prezzo: 90, capienza: 2 } },
      { id: 4, numeroStanza: '301', tipologiaStanza: { nomeTipologia: 'Suite', prezzo: 150, capienza: 4 } }
    ];
  }

  onTipoCameraChange(tipo: string): void {
    this.stanzaSelezionata = '';
    this.cercaStanzeDisponibili();
  }

  onDateChange(): void {
    this.cercaStanzeDisponibili();
  }

  get stanzeFiltrate(): Stanza[] {
    if (!this.tipoCamera) {
      return this.stanzeDisponibili;
    }
    const tipoSel = this.tipoCamera.toString().toLowerCase().trim();
    return this.stanzeDisponibili.filter((stanza: Stanza) => {
      const nomeTipo = this.getTipologiaStanzaNome(stanza).toLowerCase().trim();
      const idTipo = stanza.tipologiaStanza?.id?.toString() || stanza.tipologia?.id?.toString() || '';
      if (!nomeTipo && !idTipo) return true;
      return (nomeTipo !== '' && nomeTipo === tipoSel) ||
             (idTipo !== '' && idTipo === tipoSel) ||
             nomeTipo.includes(tipoSel) ||
             tipoSel.includes(nomeTipo);
    });
  }

  getValoreTipoCamera(tipo: TipoCamera | string): string {
    if (!tipo) return '';
    if (typeof tipo === 'string') return tipo;
    return tipo.nomeTipologia || tipo.nome || '';
  }

  getStanzaId(stanza: Stanza | string | number): string | number {
    if (!stanza) return '';
    if (typeof stanza === 'string' || typeof stanza === 'number') return stanza;
    return stanza.id || stanza.idStanza || stanza.numeroStanza || stanza.numero || '';
  }

  getStanzaNumero(stanza: Stanza | string | number): string | number {
    if (!stanza) return '';
    if (typeof stanza === 'string' || typeof stanza === 'number') return stanza;
    return stanza.numeroStanza || stanza.numero || stanza.id || stanza.idStanza || '';
  }

  getTipologiaStanzaNome(stanza: Stanza): string {
    if (!stanza) return '';
    if (typeof stanza.tipologiaStanza === 'string') return stanza.tipologiaStanza;
    if (typeof stanza.tipologia === 'string') return stanza.tipologia;
    return stanza.tipologiaStanza?.nomeTipologia ||
           stanza.tipologiaStanza?.nome ||
           stanza.tipologia?.nomeTipologia ||
           stanza.tipologia?.nome || '';
  }

  capienzaStanzaSelezionata(): number | null {
    if (!this.stanzaSelezionata) return null;
    const stanzaObj = this.stanzeDisponibili.find(
      s => this.getStanzaId(s).toString() === this.stanzaSelezionata.toString()
    );
    if (!stanzaObj) return null;
    const capienza = stanzaObj.tipologiaStanza?.capienza ?? stanzaObj.tipologia?.capienza;
    return capienza ?? null;
  }

  superaCapienza(): boolean {
    const capienza = this.capienzaStanzaSelezionata();
    if (capienza === null) return false;
    return this.ospiti.length > capienza;
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

      if (this.serviziSelezionatiIds && this.serviziSelezionatiIds.length > 0) {
        for (const id of this.serviziSelezionatiIds) {
          const sObj = this.listaServizi.find(s => this.getServizioId(s) === Number(id));
          if (sObj) {
            totale += this.getServizioPrezzo(sObj);
          }
        }
      }
    }

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

    // Controlli client-side
    if (!this.checkIn) {
      this.mostraErrore('Seleziona prima la data di Check-in / Prenotazione!');
      return;
    }

    const checkInFinale = this.checkIn;
    const checkOutFinale = this.checkOut ? this.checkOut : this.checkIn;

    if (this.includeAlbergo() && !this.checkOut) {
      this.mostraErrore('Seleziona la data di Check-out!');
      return;
    }

    if (this.includeAlbergo() && !this.stanzaSelezionata) {
      this.mostraErrore('Seleziona una stanza disponibile!');
      return;
    }

    // Controllo capienza
    if (this.includeAlbergo() && this.superaCapienza()) {
      const capienza = this.capienzaStanzaSelezionata();
      this.mostraErrore(`Numero ospiti (${this.ospiti.length}) superiore alla capienza massima della stanza (max ${capienza}).`);
      return;
    }

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

    let idStanzaVal: number | null = null;
    if (this.includeAlbergo() && this.stanzaSelezionata) {
      idStanzaVal = Number(this.stanzaSelezionata);
    }

    const serviziIds = this.serviziSelezionatiIds.map(id => Number(id));

    const payload: PayloadPrenotazione = {
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
        this.prenotazioneConfermata = res;
        this.messaggio = 'Prenotazione confermata con successo!';
        this.scrollToTop();
      },
      error: (err: any) => {
        console.error('Errore risposta Spring Boot:', err);
        let msgErrore = 'Si è verificato un errore durante la registrazione della prenotazione.';

        if (err.error && typeof err.error === 'string') {
          msgErrore = err.error;
        } else if (err.error && err.error.message) {
          msgErrore = err.error.message;
        } else if (err.message) {
          msgErrore = err.message;
        }

        this.mostraErrore(msgErrore);
      }
    });
  }
}