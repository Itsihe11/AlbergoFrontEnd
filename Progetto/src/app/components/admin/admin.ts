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
  
  // Sezioni di navigazione
  sezioneAttiva: 'prenotazione' | 'stanze' | 'tipologie' | 'servizi' = 'prenotazione';

  // Flag per mostrare/nascondere i form di creazione
  mostraFormStanza: boolean = false;
  mostraFormTipologia: boolean = false;
  mostraFormServizio: boolean = false;

  // Stato Admin
  tipiCamera: TipoCamera[] = [];
  stanze: Stanza[] = [];

  // 📷 Modello Tipologia Camera con opzione immagine
  nuovoTipoCamera: TipoCamera & { immagine?: string } = {
    nome: '',
    descrizione: '',
    prezzo: 0,
    capienza: 2,
    immagine: ''
  };

  // 📷 Modello Servizio con opzione immagine
  nuovoServizio = {
    nomeservizio: '',
    descrizione: '',
    prezzi: 0,
    immagine: ''
  };

  numeroStanza = '';
  statusStanza = 'disponibile';
  tipoCameraSelezionato: TipoCamera | null = null;
  idTipoCameraSelezionato: number | string | null = null;

  // Stato Prenotazione
  tipoPrenotazione: string = 'SPA';
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
      next: () => {
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
      next: dati => {
        this.tipiCamera = [...dati];
        this.cdr.detectChanges();
      },
      error: err => console.error('Errore caricamento tipologie:', err)
    });

    this.camereService.getStanze().subscribe({
      next: dati => {
        this.stanze = [...dati];
        this.cdr.detectChanges();
      },
      error: err => console.error('Errore caricamento stanze:', err)
    });

    this.prenotazioniService.getPensioni().subscribe({
      next: data => {
        if (data && data.length > 0) {
          this.listaPensioni = [...data];
          this.cdr.detectChanges();
        }
      },
      error: err => console.warn('Pensione API offline:', err)
    });

    this.prenotazioniService.getPrezzoSpa().subscribe({
      next: val => { if (val) this.prezzoSpa = val; },
      error: err => console.warn('SPA API offline:', err)
    });

    this.caricaServizi();
    this.caricaTutteLeStanze();
  }

  // 🟢 SALVATAGGIO TIPOLOGIA CAMERA (CON PERSISTENZA LOCALSTORAGE)
  salvaTipoCamera(): void {
    const nomeVal = (this.nuovoTipoCamera.nome || (this.nuovoTipoCamera as any).nomeTipologia || '').toString().trim();
    const prezzoVal = Number(this.nuovoTipoCamera.prezzo);

    if (!nomeVal || isNaN(prezzoVal) || prezzoVal <= 0) {
      alert('Inserisci un nome e un prezzo a notte maggiore di 0!');
      return;
    }

    // 💾 Salviamo l'immagine in localStorage collegata al NOME della camera
    if (this.nuovoTipoCamera.immagine && this.nuovoTipoCamera.immagine.trim() !== '') {
      localStorage.setItem('img_camera_' + nomeVal.toLowerCase(), this.nuovoTipoCamera.immagine.trim());
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
        this.nuovoTipoCamera = { nome: '', descrizione: '', prezzo: 0, capienza: 2, immagine: '' };
        this.mostraFormTipologia = false;
        this.caricaDati();
      },
      error: err => {
        console.error('Errore creazione tipologia:', err);
        alert('Si è verificato un errore durante il salvataggio sul server.');
      }
    });
  }

  // 🟢 SALVATAGGIO SERVIZIO (CON PERSISTENZA LOCALSTORAGE)
  salvaServizio(): void {
    const nomeVal = (this.nuovoServizio.nomeservizio || '').trim();
    const prezzoVal = Number(this.nuovoServizio.prezzi);

    if (!nomeVal || isNaN(prezzoVal) || prezzoVal < 0) {
      alert('Inserisci un nome valido e un prezzo maggiore o uguale a 0!');
      return;
    }

    // 💾 Salviamo l'immagine in localStorage collegata al NOME del servizio
    if (this.nuovoServizio.immagine && this.nuovoServizio.immagine.trim() !== '') {
      const chiave = 'img_servizio_' + nomeVal.toLowerCase().replace(/[\s-]/g, '');
      localStorage.setItem(chiave, this.nuovoServizio.immagine.trim());
    }

    const payload = {
      nomeservizio: nomeVal,
      descrizione: (this.nuovoServizio.descrizione || '').trim(),
      prezzi: prezzoVal
    };

    this.adminService.creaServizio(payload).subscribe({
      next: () => {
        alert('Servizio creato con successo!');
        this.nuovoServizio = { nomeservizio: '', descrizione: '', prezzi: 0, immagine: '' };
        this.mostraFormServizio = false;
        this.caricaServizi();
      },
      error: (err: any) => {
        console.error('Errore creazione servizio:', err);
        alert('Si è verificato un errore durante il salvataggio del servizio.');
      }
    });
  }

  getTipologiaId(tipo: any): number | string {
    if (!tipo) return '';
    return tipo.id || tipo.idTipologia || tipo.id_tipologia || '';
  }

  salvaStanza(): void {
    const numStanza = (this.numeroStanza || '').toString().trim();

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

    this.camereService.creaStanza(nuovaStanza).subscribe({
      next: () => {
        alert('Stanza creata con successo!');
        this.numeroStanza = '';
        this.statusStanza = 'disponibile';
        this.tipoCameraSelezionato = null;
        this.idTipoCameraSelezionato = null;
        this.mostraFormStanza = false;
        this.caricaDati();
      },
      error: err => {
        console.error('Errore salvataggio stanza:', err);
        alert('Si è verificato un errore durante il salvataggio della stanza.');
      }
    });
  }

  eliminaStanza(id?: number): void {
    if (!id) return;
    if (confirm('Sei sicuro di voler eliminare questa stanza?')) {
      this.camereService.eliminaStanza(id).subscribe({
        next: () => {
          this.stanze = this.stanze.filter(s => s.id !== id);
          this.cdr.detectChanges();
          this.caricaDati();
        },
        error: err => {
          if (err.status === 200 || err.statusText === 'OK') {
            this.stanze = this.stanze.filter(s => s.id !== id);
            this.cdr.detectChanges();
            this.caricaDati();
            return;
          }
          console.error('Errore eliminazione stanza:', err);
          alert('Impossibile eliminare la stanza.');
        }
      });
    }
  }

  eliminaTipoCamera(id?: number | string): void {
    if (!id) {
      alert('ID tipologia non trovato!');
      return;
    }

    if (confirm('Sei sicuro di voler eliminare questa tipologia camera?')) {
      this.camereService.eliminaTipoCamera(id).subscribe({
        next: () => {
          this.tipiCamera = this.tipiCamera.filter(t => this.getTipologiaId(t).toString() !== id.toString());
          this.cdr.detectChanges();
          this.caricaDati();
        },
        error: (err: any) => {
          if (err.status === 200 || err.statusText === 'OK') {
            this.tipiCamera = this.tipiCamera.filter(t => this.getTipologiaId(t).toString() !== id.toString());
            this.cdr.detectChanges();
            this.caricaDati();
            return;
          }
          console.error('Errore eliminazione tipologia:', err);
          alert('Impossibile eliminare: la tipologia potrebbe essere usata da una stanza o prenotazione.');
        }
      });
    }
  }

  eliminaServizio(id?: number | string): void {
    const numId = Number(id);
    if (!numId || isNaN(numId)) {
      alert('ID servizio non valido!');
      return;
    }

    if (confirm('Sei sicuro di voler eliminare questo servizio?')) {
      this.adminService.eliminaServizio(numId).subscribe({
        next: () => {
          this.listaServizi = this.listaServizi.filter(s => this.getServizioId(s) !== numId);
          this.cdr.detectChanges();
          this.caricaServizi();
        },
        error: (err: any) => {
          if (err.status === 200 || err.statusText === 'OK') {
            this.listaServizi = this.listaServizi.filter(s => this.getServizioId(s) !== numId);
            this.cdr.detectChanges();
            this.caricaServizi();
            return;
          }
          console.error('Errore eliminazione servizio:', err);
          alert('Impossibile eliminare il servizio: verificare che non sia legato a prenotazioni esistenti.');
        }
      });
    }
  }

  caricaServizi(): void {
    if (typeof this.prenotazioniService.getServizi === 'function') {
      this.prenotazioniService.getServizi().subscribe({
        next: res => {
          if (res) {
            this.listaServizi = [...res];
            this.cdr.detectChanges();
          }
        },
        error: err => console.warn('Servizi API offline.', err)
      });
    }
  }

  caricaTutteLeStanze(): void {
    this.caricamentoStanze = true;
    this.prenotazioniService.getTutteLeStanze().subscribe({
      next: res => {
        if (res && res.length > 0) {
          this.stanzeDisponibili = [...res];
          this.cdr.detectChanges();
        }
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
        if (res && res.length > 0) {
          this.stanzeDisponibili = [...res];
          this.cdr.detectChanges();
        }
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

  getServizioDescrizione(servizio: any): string {
    return servizio?.descrizione || '-';
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

    this.prenotazioniService.creaPrenotazione(payload).subscribe({
      next: (res: any) => {
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

        let msgExt = err.error?.message || err.error || err.message || '';
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