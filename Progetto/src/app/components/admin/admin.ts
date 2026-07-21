import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // 🟢 Importato Router per il logout
import { AdminService } from '../../services/admin.service';
import { CamereService } from '../../services/camere.service';
import { PrenotazioniService, PensioneInfo } from '../../services/prenotazioni-service';
import { TipoCamera, Stanza } from '../../interface/tipocamera';
import { RichiestaAdmin } from '../../interface/richiestaadmin';
import { Ospite } from '../../interface/prenotazione';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrls: []
})
export class Admin implements OnInit {
  private adminService = inject(AdminService);
  private camereService = inject(CamereService);
  private prenotazioniService = inject(PrenotazioniService);
  private router = inject(Router); // 🟢 Inject del Router

  // Auth & Navigation
  username = '';
  password = '';
  errorMessage = '';
  isLogged = false;
  sezioneAttiva: 'prenotazione' | 'tipologie' | 'stanze' | 'elenco' = 'prenotazione';

  // Stato Admin
  tipiCamera: TipoCamera[] = [];
  stanze: Stanza[] = [];

  nuovoTipoCamera: TipoCamera = {
    nome: '',
    descrizione: '',
    prezzo: 0,
    capienza: 2
  };

  numeroStanza = '';
  statusStanza = 'LIBERA';
  tipoCameraSelezionato: TipoCamera | null = null;

  // Stato Prenotazione
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
  stanzeDisponibili: any[] = [];
  listaServizi: any[] = [];
  serviziSelezionatiIds: number[] = [];

  caricamentoCamere: boolean = false;
  caricamentoStanze: boolean = false;
  messaggio: string = '';
  errore: string = '';
  prenotazioneConfermata: any = null;

  ngOnInit(): void {
    // 🟢 1. CONTROLLO SESSIONE DA LOCALSTORAGE
    const rawUser = localStorage.getItem('utente_logged');
    if (rawUser) {
      try {
        const user = JSON.parse(rawUser);
        if (user.ruolo === 'ADMIN') {
          this.isLogged = true;
          this.adminService.setLoggedIn(true);
        }
      } catch (e) {
        console.error('Errore parsing sessione admin:', e);
      }
    }

    // Fallback al controllo standard del servizio
    if (!this.isLogged) {
      this.isLogged = this.adminService.isLoggedIn();
    }

    // 🟢 2. SE LOGGATO, CARICA SUBITO I DATI SENZA CHIEDERE LOGIN
    if (this.isLogged) {
      this.caricaDati();
    }
  }

  onLogin(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'Inserisci sia username che password.';
      return;
    }

    const datiLogin: RichiestaAdmin = { username: this.username, password: this.password };

    this.adminService.login(datiLogin).subscribe({
      next: (res) => {
        this.adminService.setLoggedIn(true);
        localStorage.setItem('utente_logged', JSON.stringify({ ruolo: 'ADMIN', username: this.username }));
        this.isLogged = true;
        this.errorMessage = '';
        this.caricaDati();
      },
      error: err => {
        this.errorMessage = err.error || 'Credenziali non valide.';
      }
    });
  }

  logout(): void {
    this.adminService.logout();
    localStorage.removeItem('utente_logged'); // 🟢 Rimuove la sessione salvata
    this.isLogged = false;
    this.router.navigate(['/utenti']); // 🟢 Riporta alla schermata principale di login
  }

  // --- RESTO DEL CODICE INVARIATO ---
  caricaDati(): void {
    this.camereService.getTipiCamera().subscribe({
      next: dati => this.tipiCamera = dati,
      error: err => console.error('Errore caricamento tipologie:', err)
    });

    this.camereService.getStanze().subscribe({
      next: dati => this.stanze = dati,
      error: err => console.error('Errore caricamento stanze:', err)
    });

    this.prenotazioniService.getPensioni().subscribe({
      next: data => { if (data && data.length > 0) this.listaPensioni = data; },
      error: err => console.warn('Pensione API offline:', err)
    });

    this.prenotazioniService.getPrezzoSpa().subscribe({
      next: val => { if (val) this.prezzoSpa = val; },
      error: err => console.warn('SPA API offline:', err)
    });

    this.caricaServizi();
    this.caricaTutteLeStanze();
  }

  salvaTipoCamera(): void {
    if (!this.nuovoTipoCamera.nome || (this.nuovoTipoCamera.prezzo ?? 0) <= 0) {
      alert('Inserisci un nome e un prezzo validi.');
      return;
    }

    this.camereService.creaTipoCamera(this.nuovoTipoCamera).subscribe({
      next: () => {
        this.nuovoTipoCamera = { nome: '', descrizione: '', prezzo: 0, capienza: 2 };
        this.caricaDati();
      },
      error: err => console.error('Errore creazione tipologia:', err)
    });
  }

  salvaStanza(): void {
    if (!this.numeroStanza || !this.tipoCameraSelezionato) {
      alert('Inserisci il numero stanza e seleziona una tipologia.');
      return;
    }

    const nuovaStanza: Stanza = {
      numeroStanza: this.numeroStanza,
      status: this.statusStanza,
      tipologia: this.tipoCameraSelezionato
    };

    this.camereService.creaStanza(nuovaStanza).subscribe({
      next: () => {
        this.numeroStanza = '';
        this.statusStanza = 'LIBERA';
        this.tipoCameraSelezionato = null;
        this.caricaDati();
      },
      error: err => console.error('Errore salvataggio stanza:', err)
    });
  }

  eliminaStanza(id?: number): void {
    if (!id) return;
    this.camereService.eliminaStanza(id).subscribe({
      next: () => this.caricaDati(),
      error: err => console.error('Errore eliminazione stanza:', err)
    });
  }

  caricaServizi(): void {
    if (typeof this.prenotazioniService.getServizi === 'function') {
      this.prenotazioniService.getServizi().subscribe({
        next: res => { if (res) this.listaServizi = res; },
        error: err => console.warn('Servizi API offline.', err)
      });
    }
  }

  caricaTutteLeStanze(): void {
    this.caricamentoStanze = true;
    this.prenotazioniService.getTutteLeStanze().subscribe({
      next: res => {
        if (res && res.length > 0) this.stanzeDisponibili = res;
        this.caricamentoStanze = false;
      },
      error: err => {
        console.warn('Tutte le Stanze API offline.', err);
        this.caricamentoStanze = false;
      }
    });
  }

  cercaStanzeDisponibili(): void {
    if (!this.checkIn || !this.checkOut) return;
    this.stanzaSelezionata = '';
    this.caricamentoStanze = true;

    this.prenotazioniService.getStanzeDisponibili(this.checkIn, this.checkOut).subscribe({
      next: res => {
        if (res && res.length > 0) this.stanzeDisponibili = res;
        this.caricamentoStanze = false;
      },
      error: err => {
        console.warn('Stanze Disponibili API offline.', err);
        this.caricamentoStanze = false;
      }
    });
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
    return Number(servizio?.idservizio || servizio?.idServizio || servizio?.id || 0);
  }

  getServizioNome(servizio: any): string {
    return servizio?.nomeservizio || servizio?.nomeServizio || servizio?.nome || 'Servizio';
  }

  getServizioPrezzo(servizio: any): number {
    return Number(servizio?.prezzi || servizio?.prezzo || 0);
  }

  onTipoCameraChange(tipo: string): void {
    this.stanzaSelezionata = '';
    this.cercaStanzeDisponibili();
  }

  onDateChange(): void {
    this.cercaStanzeDisponibili();
  }

  get stanzeFiltrate(): any[] {
    if (!this.tipoCamera) return this.stanzeDisponibili;
    const tipoSel = this.tipoCamera.toString().toLowerCase().trim();

    return this.stanzeDisponibili.filter((stanza: any) => {
      const nomeTipo = this.getTipologiaStanzaNome(stanza).toLowerCase().trim();
      const idTipo = stanza.tipologiaStanza?.id?.toString() || stanza.tipologia?.id?.toString() || '';
      return nomeTipo === tipoSel || idTipo === tipoSel || nomeTipo.includes(tipoSel);
    });
  }

  getValoreTipoCamera(tipo: any): string {
    if (!tipo) return '';
    if (typeof tipo === 'string') return tipo;
    return tipo['nomeTipologia'] || tipo['nome'] || tipo['tipo'] || '';
  }

  getStanzaId(stanza: any): string | number {
    if (!stanza) return '';
    if (typeof stanza === 'string' || typeof stanza === 'number') return stanza;
    return stanza.id || stanza.idStanza || stanza.numeroStanza || '';
  }

  getStanzaNumero(stanza: any): string | number {
    if (!stanza) return '';
    if (typeof stanza === 'string' || typeof stanza === 'number') return stanza;
    return stanza.numeroStanza || stanza.numero || stanza.id || '';
  }

  getTipologiaStanzaNome(stanza: any): string {
    if (!stanza) return '';
    return stanza.tipologiaStanza?.['nomeTipologia'] || stanza.tipologia?.['nomeTipologia'] || stanza.tipologia?.['nome'] || '';
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
        const stanzaObj = this.stanzeDisponibili.find(s => this.getStanzaId(s).toString() === this.stanzaSelezionata.toString());
        if (stanzaObj) {
          const prezzoStanza = stanzaObj.tipologiaStanza?.prezzo || stanzaObj.tipologia?.prezzo || 0;
          totale += (prezzoStanza * notti);
        }
      }

      const pSel = this.listaPensioni.find((p: PensioneInfo) => p.tipo === this.pensione);
      if (pSel) {
        totale += (pSel.prezzo * notti * this.ospiti.length);
      }

      if (this.serviziSelezionatiIds.length > 0) {
        for (const id of this.serviziSelezionatiIds) {
          const sObj = this.listaServizi.find(s => this.getServizioId(s) === Number(id));
          if (sObj) totale += this.getServizioPrezzo(sObj);
        }
      }
    }

    if (this.includeSpa()) {
      totale += this.prezzoSpa;
    }

    return totale;
  }

  aggiungiOspite(): void {
    this.ospiti.push({ nome: '', cognome: '', dataNascita: '' });
  }

  rimuoviOspite(index: number): void {
    if (this.ospiti.length > 1) {
      this.ospiti.splice(index, 1);
    }
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

  prenota(): void {
    this.messaggio = '';
    this.errore = '';

    if (!this.checkIn) {
      this.errore = 'Seleziona prima la data di Check-in / Prenotazione!';
      return;
    }

    if (this.includeAlbergo() && !this.checkOut) {
      this.errore = 'Seleziona la data di Check-out!';
      return;
    }

    if (this.includeAlbergo() && !this.stanzaSelezionata) {
      this.errore = 'Seleziona una stanza disponibile!';
      return;
    }

    let idPensioneVal: number = 3;
    if (this.includeAlbergo()) {
      if (this.pensione === 'COMPLETA') idPensioneVal = 1;
      else if (this.pensione === 'MEZZA') idPensioneVal = 2;
      else idPensioneVal = 3;
    }

    const payload = {
      idStanza: this.includeAlbergo() && this.stanzaSelezionata ? Number(this.stanzaSelezionata) : null,
      checkin: this.checkIn,
      checkout: this.checkOut ? this.checkOut : this.checkIn,
      checkIn: this.checkIn,
      checkOut: this.checkOut ? this.checkOut : this.checkIn,
      idPensione: idPensioneVal,
      tipoPrenotazione: this.tipoPrenotazione,
      dovePrenotazione: 'SEDE',
      tipoPagamento: this.metodoPagamento,
      ospiti: this.ospiti,
      serviziAggiuntivi: this.includeAlbergo() ? this.serviziSelezionatiIds.map(id => Number(id)) : []
    };

    console.log('Payload inviato da Admin:', payload);

    this.prenotazioniService.creaPrenotazione(payload).subscribe({
      next: (res: any) => {
        this.prenotazioneConfermata = res;
        this.messaggio = 'Prenotazione in sede registrata con successo!';
      },
      error: (err: any) => {
        console.error('Errore risposta Spring Boot:', err);
        if (err.error && typeof err.error === 'string') {
          this.errore = err.error;
        } else if (err.error && err.error.message) {
          this.errore = err.error.message;
        } else {
          this.errore = 'Si è verificato un errore HTTP 500 sul server durante la registrazione.';
        }
      }
    });
  }
}