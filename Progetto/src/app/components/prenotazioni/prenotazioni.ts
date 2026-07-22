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

  todayDate: string = new Date().toISOString().split('T')[0];

  formBlock: boolean = false;

  tipoPrenotazione: string = 'ALBERGO';
  tipoCamera: string = '';
  stanzaSelezionata: string = '';
  pensione: string = 'MEZZA';
  checkIn: string = '';
  checkOut: string = '';
  metodoPagamento: string = 'CARTA';

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

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data?.content || data?.data || []);
        if (list.length > 0) {
          this.listaPensioni = list;
          this.pensione = list[0].tipo || 'MEZZA';
        }
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
      finalize(() => this.cdr.detectChanges())
    ).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.content || res?.data || []);
        if (list.length > 0) this.listaServizi = list;
      },
      error: (err: any) => console.warn('Servizi API offline.', err)
    });
  }

  caricaTipiCamera(): void {
    this.caricamentoCamere = true;
    this.prenotazioniService.getTipiCamera().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.content || res?.data || []);
        if (list.length > 0) {
          this.tipiCamera = list;
        } else {
          this.useDefaultTipiCamera();
        }
        this.caricamentoCamere = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.warn('Tipologie Camera API offline: usati dati di fallback.', err);
        this.useDefaultTipiCamera();
        this.caricamentoCamere = false;
        this.cdr.detectChanges();
      }
    });
  }

  private useDefaultTipiCamera(): void {
    this.tipiCamera = [
      { id: 1, nomeTipologia: 'Singola Standard', prezzo: 50, capienza: 1 },
      { id: 2, nomeTipologia: 'Doppia Deluxe', prezzo: 90, capienza: 2 },
      { id: 3, nomeTipologia: 'Suite', prezzo: 150, capienza: 4 }
    ];
  }

  caricaTutteLeStanze(): void {
    this.caricamentoStanze = true;
    this.prenotazioniService.getTutteLeStanze().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.content || res?.data || []);
        if (list.length > 0) {
          this.stanzeDisponibili = list;
        } else {
          this.useDefaultStanze();
        }
        this.caricamentoStanze = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.warn('Tutte le Stanze API offline: usate stanze di fallback.', err);
        this.useDefaultStanze();
        this.caricamentoStanze = false;
        this.cdr.detectChanges();
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

    this.caricamentoStanze = true;
    this.prenotazioniService.getStanzeDisponibili(this.checkIn, this.checkOut).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.content || res?.data || []);
        if (list.length > 0) {
          this.stanzeDisponibili = list;
        } else {
          this.useDefaultStanze();
        }
        const esisteStanza = this.stanzeDisponibili.some(s => this.getStanzaId(s).toString() === this.stanzaSelezionata.toString());
        if (!esisteStanza) {
          this.stanzaSelezionata = '';
        }
        this.caricamentoStanze = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.warn('Stanze Disponibili API offline: usate stanze di fallback.', err);
        this.useDefaultStanze();
        this.caricamentoStanze = false;
        this.cdr.detectChanges();
      }
    });
  }

  private useDefaultStanze(): void {
    this.stanzeDisponibili = [
      { id: 1, numeroStanza: '101', tipologiaStanza: { id: 1, nomeTipologia: 'Singola Standard', prezzo: 50, capienza: 1 } },
      { id: 2, numeroStanza: '102', tipologiaStanza: { id: 1, nomeTipologia: 'Singola Standard', prezzo: 50, capienza: 1 } },
      { id: 3, numeroStanza: '201', tipologiaStanza: { id: 2, nomeTipologia: 'Doppia Deluxe', prezzo: 90, capienza: 2 } },
      { id: 4, numeroStanza: '301', tipologiaStanza: { id: 3, nomeTipologia: 'Suite', prezzo: 150, capienza: 4 } }
    ];
  }

  onTipoCameraChange(tipo: string): void {
    this.stanzaSelezionata = '';
    this.cercaStanzeDisponibili();
  }

  onDateChange(): void {
    if (this.includeAlbergo()) {
      this.cercaStanzeDisponibili();
    }
  }

  getTipologiaId(tipo: any): string {
    if (!tipo) return '';
    if (typeof tipo === 'number' || typeof tipo === 'string') return tipo.toString();
    return (tipo.id || tipo.idTipologia || tipo.idTipoCamera || tipo.id_tipologia || '').toString();
  }

  getValoreTipoCamera(tipo: any): string {
    if (!tipo) return '';
    if (typeof tipo === 'string') return tipo;
    return tipo.nomeTipologia || tipo.nome || tipo.descrizione || tipo.denominazione || tipo.tipo || tipo.tipoCamera || '';
  }

  // Estrae il prezzo passando dalla TipologiaStanza associata
  getPrezzoStanza(stanza: Stanza | null | undefined): number {
    if (!stanza) return 0;
    return stanza.tipologiaStanza?.prezzo ?? stanza.tipologia?.prezzo ?? 0;
  }

  get stanzeFiltrate(): Stanza[] {
    if (!this.tipoCamera) {
      return this.stanzeDisponibili;
    }

    const target = this.tipoCamera.toString().toLowerCase().trim();

    return this.stanzeDisponibili.filter((stanza: any) => {
      if (!stanza) return false;

      const idStanzaTipo = (
        stanza.tipologia?.id ||
        stanza.tipologiaStanza?.id ||
        stanza.idTipologia ||
        stanza.idTipo ||
        ''
      ).toString().toLowerCase().trim();

      const nomeStanzaTipo = (
        stanza.tipologia?.nomeTipologia ||
        stanza.tipologia?.nome ||
        stanza.tipologiaStanza?.nomeTipologia ||
        stanza.tipologiaStanza?.nome ||
        (typeof stanza.tipologia === 'string' ? stanza.tipologia : '') ||
        ''
      ).toString().toLowerCase().trim();

      if (!idStanzaTipo && !nomeStanzaTipo) return true;

      return (
        idStanzaTipo === target ||
        nomeStanzaTipo === target ||
        (nomeStanzaTipo !== '' && target !== '' && (nomeStanzaTipo.includes(target) || target.includes(nomeStanzaTipo)))
      );
    });
  }

  getStanzaId(stanza: any): string | number {
    if (!stanza) return '';
    if (typeof stanza === 'number' || typeof stanza === 'string') return stanza;
    return stanza.id ?? stanza.idStanza ?? stanza.id_stanza ?? stanza.numeroStanza ?? stanza.numero ?? '';
  }

  getStanzaNumero(stanza: any): string | number {
    if (!stanza) return '';
    if (typeof stanza === 'number' || typeof stanza === 'string') return stanza;
    return stanza.numeroStanza ?? stanza.numero ?? stanza.numero_stanza ?? stanza.id ?? stanza.idStanza ?? '';
  }

  getStanzaCapienza(stanza: any): number | string {
    if (!stanza) return '-';
    return stanza.tipologiaStanza?.capienza ?? stanza.tipologia?.capienza ?? stanza.capienza ?? stanza.maxOspiti ?? '-';
  }

  capienzaStanzaSelezionata(): number | null {
    if (!this.includeAlbergo() || !this.stanzaSelezionata) return null;
    const stanzaObj = this.stanzeDisponibili.find(
      s => this.getStanzaId(s).toString() === this.stanzaSelezionata.toString()
    );
    if (!stanzaObj) return null;
    const cap = this.getStanzaCapienza(stanzaObj);
    return (cap !== '-' && !isNaN(Number(cap))) ? Number(cap) : null;
  }

  superaCapienza(): boolean {
    if (!this.includeAlbergo()) return false;
    const capienza = this.capienzaStanzaSelezionata();
    if (capienza === null || capienza <= 0) return false;
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
      this.checkOut = '';
    }
  }

  numeroNotti(): number {
    if (!this.includeAlbergo() || !this.checkIn || !this.checkOut) return 0;
    const start = new Date(this.checkIn);
    const end = new Date(this.checkOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
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
          // Utilizziamo il metodo helper per estrarre il prezzo dalla tipologia
          const prezzoStanza = this.getPrezzoStanza(stanzaObj);
          totale += (prezzoStanza * notti);
        }
      }

      const pSel = this.listaPensioni.find((p: any) => p.tipo === this.pensione || p.id === this.pensione);
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
      totale += (this.prezzoSpa * Math.max(1, this.ospiti.length));
    }

    return totale;
  }

  caparra(): number {
    return Math.round(this.prezzoTotale() * 0.1);
  }

  aggiungiOspite(): void {
    if (this.includeAlbergo() && this.stanzaSelezionata) {
      const capienzaMax = this.capienzaStanzaSelezionata();
      if (capienzaMax !== null && capienzaMax > 0 && this.ospiti.length >= capienzaMax) {
        alert(`Impossibile aggiungere altri ospiti! La capienza massima di questa stanza è di ${capienzaMax} persone.`);
        return;
      }
    }
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

    if (!this.checkIn) {
      this.mostraErrore('Seleziona la data per la prenotazione!');
      return;
    }

    if (this.checkIn < this.todayDate) {
      this.mostraErrore("Non è possibile selezionare una data antecedente ad oggi!");
      return;
    }

    const checkInFinale = this.checkIn;
    const checkOutFinale = this.includeAlbergo() ? (this.checkOut ? this.checkOut : this.checkIn) : this.checkIn;

    if (this.includeAlbergo()) {
      if (!this.checkOut) {
        this.mostraErrore('Seleziona la data di Check-out!');
        return;
      }

      if (this.checkOut <= this.checkIn) {
        this.mostraErrore('La data di Check-out deve essere successiva a quella di Check-in!');
        return;
      }

      if (!this.stanzaSelezionata) {
        this.mostraErrore('Seleziona una stanza disponibile!');
        return;
      }

      if (this.superaCapienza()) {
        const capienza = this.capienzaStanzaSelezionata();
        this.mostraErrore(`Numero ospiti (${this.ospiti.length}) superiore alla capienza massima della stanza (max ${capienza}).`);
        return;
      }
    }

    for (let i = 0; i < this.ospiti.length; i++) {
      if (!this.ospiti[i].nome?.trim() || !this.ospiti[i].cognome?.trim()) {
        this.mostraErrore(`Inserisci nome e cognome per l'ospite #${i + 1}`);
        return;
      }
    }

    let idPensioneVal: number = 2;
    if (this.includeAlbergo()) {
      const pSel = this.listaPensioni.find((p: any) => p.tipo === this.pensione);
      if (pSel && (pSel as any).id) {
        idPensioneVal = Number((pSel as any).id);
      } else if (this.pensione.includes('COMPLETA')) {
        idPensioneVal = 1;
      } else if (this.pensione.includes('MEZZA')) {
        idPensioneVal = 2;
      } else {
        idPensioneVal = 3;
      }
    }

    let idStanzaVal: number | null = null;
    if (this.includeAlbergo() && this.stanzaSelezionata) {
      idStanzaVal = Number(this.stanzaSelezionata);
    }

    const serviziIds = this.includeAlbergo() ? this.serviziSelezionatiIds.map(id => Number(id)) : [];

    const payload: PayloadPrenotazione = {
      idStanza: idStanzaVal,
      checkin: checkInFinale,
      checkout: checkOutFinale,
      checkIn: checkInFinale,
      checkOut: checkOutFinale,
      idPensione: idPensioneVal,
      tipoPrenotazione: this.tipoPrenotazione,
      dovePrenotazione: 'WEB',
      tipoPagamento: this.metodoPagamento,
      ospiti: this.ospiti,
      serviziAggiuntivi: serviziIds
    };

    this.prenotazioniService.creaPrenotazione(payload).subscribe({
      next: (res: any) => {
        if (res && typeof res === 'object') {
          this.prenotazioneConfermata = res;
        } else {
          this.prenotazioneConfermata = {
            codicePrenotazione: typeof res === 'string' && res ? res : 'PREN-' + Math.floor(1000 + Math.random() * 9000),
            tipoPrenotazione: this.tipoPrenotazione,
            costo_totale: this.prezzoTotale(),
            deposito: this.caparra()
          };
        }

        this.messaggio = 'Prenotazione confermata con successo!';
        this.scrollToTop();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        let msgErrore = "Si è verificato un errore durante la registrazione della prenotazione.";

        if (err.error && typeof err.error === 'string') {
          msgErrore = err.error;
        } else if (err.error && err.error.message) {
          msgErrore = err.error.message;
        } else if (err.message) {
          msgErrore = err.message;
        }

        this.mostraErrore(msgErrore);
        this.cdr.detectChanges();
      }
    });
  }
}