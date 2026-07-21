import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

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
  statusStanza = 'disponibile';
  tipoCameraSelezionato: TipoCamera | null = null;
  idTipoCameraSelezionato: number | string | null = null; // 🟢 Aggiunto per il binding sicuro da <select>

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

    if (!this.isLogged) {
      this.isLogged = this.adminService.isLoggedIn();
    }

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
    localStorage.removeItem('utente_logged');
    this.isLogged = false;
    this.router.navigate(['/utenti']);
  }

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
    const nomeVal = (this.nuovoTipoCamera.nome || (this.nuovoTipoCamera as any).nomeTipologia || '').toString().trim();
    const prezzoVal = Number(this.nuovoTipoCamera.prezzo);

    if (!nomeVal || isNaN(prezzoVal) || prezzoVal <= 0) {
      alert('Inserisci un nome e un prezzo a notte maggiore di 0!');
      return;
    }

    const payload = {
      ...this.nuovoTipoCamera,
      nome: nomeVal,
      nomeTipologia: nomeVal,
      prezzo: prezzoVal,
      capienza: Number((this.nuovoTipoCamera as any).capienza || 2)
    };

    this.camereService.creaTipoCamera(payload).subscribe({
      next: () => {
        alert('Tipologia camera creata con successo!');
        this.nuovoTipoCamera = {
          nome: '',
          descrizione: '',
          prezzo: 0,
          capienza: 2
        };
        this.caricaDati();
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Errore creazione tipologia:', err);
        alert('Si è verificato un errore durante il salvataggio sul server.');
      }
    });
  }

  // 🟢 HELPER PER ESTRARRE L'ID DELLA TIPOLOGIA
  getTipologiaId(tipo: any): number | string {
    if (!tipo) return '';
    return tipo.id || tipo.idTipologia || tipo.id_tipologia || '';
  }

  // 🟢 CREAZIONE STANZA AGGIORNATA
  salvaStanza(): void {
    const numStanza = (this.numeroStanza || '').toString().trim();

    // Recupera l'oggetto tipologia sia se presente direttamente, sia cercando tramite ID
    let tipologiaObj = this.tipoCameraSelezionato;
    if (!tipologiaObj && this.idTipoCameraSelezionato) {
      tipologiaObj = this.tipiCamera.find(
        t => this.getTipologiaId(t).toString() === this.idTipoCameraSelezionato?.toString()
      ) || null;
    }

    if (!numStanza || !tipologiaObj) {
      alert('Inserisci il numero stanza e seleziona una tipologia.');
      return;
    }

    const nuovaStanza: any = {
      numeroStanza: numStanza,
      status: this.statusStanza,
      tipologia: tipologiaObj,
      tipologiaStanza: tipologiaObj
    };

    console.log('Salvataggio stanza:', nuovaStanza);

    this.camereService.creaStanza(nuovaStanza).subscribe({
      next: () => {
        alert('Stanza creata con successo!');
        this.numeroStanza = '';
        this.statusStanza = 'disponibile';
        this.tipoCameraSelezionato = null;
        this.idTipoCameraSelezionato = null;
        
        this.caricaDati();
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Errore salvataggio stanza:', err);
        alert('Si è verificato un errore durante il salvataggio della stanza.');
      }
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
      this.cdr.detectChanges();
      return;
    }

    if (this.includeAlbergo() && !this.checkOut) {
      this.errore = 'Seleziona la data di Check-out!';
      this.cdr.detectChanges();
      return;
    }

    if (this.includeAlbergo() && !this.stanzaSelezionata) {
      this.errore = 'Seleziona una stanza disponibile!';
      this.cdr.detectChanges();
      return;
    }

    if (this.includeAlbergo() && this.stanzaSelezionata) {
      const stanzaObj = this.stanzeDisponibili.find(
        s => this.getStanzaId(s).toString() === this.stanzaSelezionata.toString()
      );

      if (stanzaObj) {
        const capienzaStanza = Number(
          stanzaObj.tipologiaStanza?.capienza || 
          stanzaObj.tipologia?.capienza || 
          stanzaObj.capienza || 
          0
        );

        if (capienzaStanza > 0 && this.ospiti.length > capienzaStanza) {
          this.errore = `⚠️ Numero di ospiti (${this.ospiti.length}) superiore alla capienza massima della stanza selezionata (${capienzaStanza})!`;
          this.cdr.detectChanges();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
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
        console.log('Risposta backend ricevuta:', res);

        if (typeof res === 'string') {
          this.prenotazioneConfermata = {
            codicePrenotazione: res,
            tipoPrenotazione: this.tipoPrenotazione,
            costo_totale: this.prezzoTotale()
          };
        } else {
          this.prenotazioneConfermata = {
            ...res,
            costo_totale: res.costo_totale || res.costoTotale || this.prezzoTotale()
          };
        }

        this.messaggio = 'Prenotazione in sede registrata con successo!';
        this.cdr.detectChanges();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err: any) => {
        console.error('Errore risposta Spring Boot:', err);

        if (err.status === 200 || err.statusText === 'OK') {
          const codice = err.error?.text || err.error || 'CONFERMATA';
          this.prenotazioneConfermata = {
            codicePrenotazione: codice,
            tipoPrenotazione: this.tipoPrenotazione,
            costo_totale: this.prezzoTotale()
          };
          this.messaggio = 'Prenotazione in sede registrata con successo!';
          this.cdr.detectChanges();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        let msgExt = '';
        if (typeof err.error === 'string') {
          msgExt = err.error;
        } else if (err.error && typeof err.error.message === 'string') {
          msgExt = err.error.message;
        } else if (err.message) {
          msgExt = err.message;
        }

        if (msgExt.includes('capienza') || msgExt.includes('Numero ospiti')) {
          this.errore = '⚠️ Impossibile completare la prenotazione: Numero di ospiti superiore alla capienza massima della stanza!';
        } else if (msgExt) {
          this.errore = `⚠️ Errore dal server: ${msgExt}`;
        } else {
          this.errore = '⚠️ Errore durante la registrazione. Verificare i dati inseriti.';
        }

        this.cdr.detectChanges();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}