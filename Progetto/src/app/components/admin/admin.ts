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

  todayDate: string = new Date().toISOString().split('T')[0];

  username = '';
  password = '';
  errorMessage = '';
  isLogged = false;

  sezioneAttiva: 'gestionePrenotazioni' | 'nuovaPrenotazione' | 'stanze' | 'tipologie' | 'servizi' = 'gestionePrenotazioni';

  mostraFormStanza: boolean = false;
  mostraFormTipologia: boolean = false;
  mostraFormServizio: boolean = false;

  idTipoCameraInModifica: number | string | null = null;
  idServizioInModifica: number | string | null = null;
  idStanzaInModifica: number | string | null = null;

  tipiCamera: TipoCamera[] = [];
  stanze: Stanza[] = [];

  listaPrenotazioni: any[] = [];
  caricamentoPrenotazioni: boolean = false;
  filtroStato: string = 'TUTTI';
  filtroRicerca: string = '';
  prenotazioneSelezionataModal: any = null;

  nuovoTipoCamera: TipoCamera & { immagine?: string } = {
    nome: '',
    descrizione: '',
    prezzo: 0,
    capienza: 2,
    immagine: ''
  };

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

  tipoPrenotazione: string = 'SPA';
  tipoCamera: string = '';
  stanzaSelezionata: string = '';
  pensione: string = 'MEZZA';
  checkIn: string = '';
  checkOut: string = '';
  metodoPagamento: string = 'CONTANTI';
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
    this.caricaPrenotazioni();

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

  caricaPrenotazioni(): void {
    this.caricamentoPrenotazioni = true;
    this.prenotazioniService.getAllPrenotazioni().subscribe({
      next: (res: any[]) => {
        this.listaPrenotazioni = res || [];
        this.caricamentoPrenotazioni = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Errore durante il caricamento delle prenotazioni:', err);
        this.caricamentoPrenotazioni = false;
        this.cdr.detectChanges();
      }
    });
  }

  get prenotazioniFiltrate(): any[] {
    return this.listaPrenotazioni.filter(p => {
      const codice = (p.codice_prenotazione || p.codicePrenotazione || '').toLowerCase();
      const tipo = (p.tipo_prenotazione || p.tipoPrenotazione || '').toLowerCase();
      const ricerca = this.filtroRicerca.toLowerCase().trim();

      const coincideRicerca = !ricerca || codice.includes(ricerca) || tipo.includes(ricerca);
      const coincideStato = this.filtroStato === 'TUTTI' || (p.stato || 'PENDENTE').toUpperCase() === this.filtroStato.toUpperCase();

      return coincideRicerca && coincideStato;
    });
  }

  effettuaCheckIn(codice: string): void {
    if (confirm(`Confermi l'esecuzione del Check-in per la prenotazione #${codice}?`)) {
      this.prenotazioniService.checkIn(codice).subscribe({
        next: (msg) => {
          alert(msg || 'Check-in effettuato con successo!');
          this.caricaPrenotazioni();
        },
        error: (err) => {
          alert('Errore durante il Check-in: ' + (err.error?.message || err.error || err.message));
        }
      });
    }
  }

  effettuaCheckOut(codice: string): void {
    if (confirm(`Confermi il Check-out ed il saldo del soggiorno per la prenotazione #${codice}?`)) {
      this.prenotazioniService.checkOut(codice).subscribe({
        next: (msg) => {
          alert(msg || 'Checkout completato e pagamento registrato!');
          this.caricaPrenotazioni();
        },
        error: (err) => {
          alert('Errore durante il Check-out: ' + (err.error?.message || err.error || err.message));
        }
      });
    }
  }

  apriDettaglioModal(p: any): void {
    this.prenotazioneSelezionataModal = p;
  }

  chiudiDettaglioModal(): void {
    this.prenotazioneSelezionataModal = null;
  }

  avviaModificaTipoCamera(t: any): void {
    this.idTipoCameraInModifica = this.getTipologiaId(t);
    const nomeVal = this.getValoreTipoCamera(t);
    const imgSalvata = localStorage.getItem('img_camera_' + nomeVal.toLowerCase()) || '';

    this.nuovoTipoCamera = {
      nome: nomeVal,
      descrizione: t.descrizione || '',
      prezzo: t.prezzo || 0,
      capienza: t.capienza || 2,
      immagine: imgSalvata
    };
    this.mostraFormTipologia = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  annullaModificaTipoCamera(): void {
    this.idTipoCameraInModifica = null;
    this.nuovoTipoCamera = { nome: '', descrizione: '', prezzo: 0, capienza: 2, immagine: '' };
    this.mostraFormTipologia = false;
  }

  salvaTipoCamera(): void {
    const nomeVal = (this.nuovoTipoCamera.nome || (this.nuovoTipoCamera as any).nomeTipologia || '').toString().trim();
    const prezzoVal = Number(this.nuovoTipoCamera.prezzo);

    if (!nomeVal || isNaN(prezzoVal) || prezzoVal <= 0) {
      alert('Inserisci un nome e un prezzo a notte maggiore di 0!');
      return;
    }

    if (this.nuovoTipoCamera.immagine && this.nuovoTipoCamera.immagine.trim() !== '') {
      localStorage.setItem('img_camera_' + nomeVal.toLowerCase(), this.nuovoTipoCamera.immagine.trim());
    }

    const idVal = this.idTipoCameraInModifica ? Number(this.idTipoCameraInModifica) : undefined;

    const payload: TipoCamera = {
      ...this.nuovoTipoCamera,
      id: idVal,
      nome: nomeVal,
      prezzo: prezzoVal,
      capienza: Number((this.nuovoTipoCamera as any).capienza || 2)
    };

    const callApi = (this.idTipoCameraInModifica && typeof (this.camereService as any).aggiornaTipoCamera === 'function')
      ? (this.camereService as any).aggiornaTipoCamera(this.idTipoCameraInModifica, payload)
      : this.camereService.creaTipoCamera(payload);

    callApi.subscribe({
      next: () => {
        alert(this.idTipoCameraInModifica ? 'Tipologia aggiornata con successo!' : 'Tipologia camera creata con successo!');
        this.annullaModificaTipoCamera();
        this.caricaDati();
      },
      error: (err: any) => {
        console.error('Errore salvataggio tipologia:', err);
        alert('Si e\' verificato un errore durante il salvataggio.');
      }
    });
  }

  avviaModificaServizio(s: any): void {
    this.idServizioInModifica = this.getServizioId(s);
    const nomeVal = this.getServizioNome(s);
    const chiave = 'img_servizio_' + nomeVal.toLowerCase().replace(/[\s-]/g, '');
    const imgSalvata = localStorage.getItem(chiave) || '';

    this.nuovoServizio = {
      nomeservizio: nomeVal,
      descrizione: this.getServizioDescrizione(s),
      prezzi: this.getServizioPrezzo(s),
      immagine: imgSalvata
    };
    this.mostraFormServizio = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  annullaModificaServizio(): void {
    this.idServizioInModifica = null;
    this.nuovoServizio = { nomeservizio: '', descrizione: '', prezzi: 0, immagine: '' };
    this.mostraFormServizio = false;
  }

  salvaServizio(): void {
    const nomeVal = (this.nuovoServizio.nomeservizio || '').trim();
    const prezzoVal = Number(this.nuovoServizio.prezzi);

    if (!nomeVal || isNaN(prezzoVal) || prezzoVal < 0) {
      alert('Inserisci un nome valido e un prezzo maggiore o uguale a 0!');
      return;
    }

    if (this.nuovoServizio.immagine && this.nuovoServizio.immagine.trim() !== '') {
      const chiave = 'img_servizio_' + nomeVal.toLowerCase().replace(/[\s-]/g, '');
      localStorage.setItem(chiave, this.nuovoServizio.immagine.trim());
    }

    const idVal = this.idServizioInModifica ? Number(this.idServizioInModifica) : undefined;

    const payload = {
      idservizio: idVal,
      id: idVal,
      nomeservizio: nomeVal,
      descrizione: (this.nuovoServizio.descrizione || '').trim(),
      prezzi: prezzoVal
    };

    const callApi = (this.idServizioInModifica && typeof (this.adminService as any).aggiornaServizio === 'function')
      ? (this.adminService as any).aggiornaServizio(this.idServizioInModifica, payload)
      : this.adminService.creaServizio(payload);

    callApi.subscribe({
      next: () => {
        alert(this.idServizioInModifica ? 'Servizio aggiornato con successo!' : 'Servizio creato con successo!');
        this.annullaModificaServizio();
        this.caricaServizi();
      },
      error: (err: any) => {
        console.error('Errore salvataggio servizio:', err);
        alert('Si e\' verificato un errore durante il salvataggio del servizio.');
      }
    });
  }

  avviaModificaStanza(s: any): void {
    this.idStanzaInModifica = s.id || this.getStanzaId(s);
    this.numeroStanza = s.numeroStanza || s.numero || '';
    this.statusStanza = s.status || 'disponibile';
    this.idTipoCameraSelezionato = this.getTipologiaId(s.tipologia || s.tipologiaStanza);
    this.mostraFormStanza = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  annullaModificaStanza(): void {
    this.idStanzaInModifica = null;
    this.numeroStanza = '';
    this.statusStanza = 'disponibile';
    this.idTipoCameraSelezionato = null;
    this.mostraFormStanza = false;
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

    const idVal = this.idStanzaInModifica ? Number(this.idStanzaInModifica) : undefined;

    const nuovaStanza: any = {
      id: idVal,
      numeroStanza: numStanza,
      status: this.statusStanza,
      tipologia: tipologiaObj,
      tipologiaStanza: tipologiaObj
    };

    const callApi = (this.idStanzaInModifica && typeof (this.camereService as any).aggiornaStanza === 'function')
      ? (this.camereService as any).aggiornaStanza(this.idStanzaInModifica, nuovaStanza)
      : this.camereService.creaStanza(nuovaStanza);

    callApi.subscribe({
      next: () => {
        alert(this.idStanzaInModifica ? 'Stanza aggiornata con successo!' : 'Stanza creata con successo!');
        this.annullaModificaStanza();
        this.caricaDati();
      },
      error: (err: any) => {
        console.error('Errore salvataggio stanza:', err);
        alert('Si e\' verificato un errore durante il salvataggio della stanza.');
      }
    });
  }

  getTipologiaId(tipo: any): number | string {
    if (!tipo) return '';
    return tipo.id || tipo.idTipologia || tipo.id_tipologia || '';
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
    if (this.includeAlbergo()) {
      this.cercaStanzeDisponibili();
    }
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

  getStanzaCapienza(stanza: any): number | string {
    if (!stanza) return '-';
    return stanza.tipologiaStanza?.capienza ?? stanza.tipologia?.capienza ?? stanza.capienza ?? '-';
  }

  capienzaStanzaSelezionata(): number | null {
    if (!this.includeAlbergo() || !this.stanzaSelezionata) return null;
    const stanzaObj = this.stanzeDisponibili.find(
      s => this.getStanzaId(s).toString() === this.stanzaSelezionata.toString()
    );
    if (!stanzaObj) return null;
    const capienza = stanzaObj.tipologiaStanza?.capienza ?? stanzaObj.tipologia?.capienza ?? stanzaObj.capienza;
    return capienza ? Number(capienza) : null;
  }

  superaCapienza(): boolean {
    if (!this.includeAlbergo()) return false;
    const cap = this.capienzaStanzaSelezionata();
    if (cap === null || cap <= 0) return false;
    return this.ospiti.length > cap;
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
      totale += (this.prezzoSpa * Math.max(1, this.ospiti.length));
    }

    return totale;
  }

  aggiungiOspite(): void {
    if (this.includeAlbergo() && this.stanzaSelezionata) {
      const cap = this.capienzaStanzaSelezionata();
      if (cap !== null && cap > 0 && this.ospiti.length >= cap) {
        alert(`Impossibile aggiungere altri ospiti! La capienza massima di questa stanza e' di ${cap} persone.`);
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
      this.errore = 'Seleziona la data per la prenotazione!';
      this.cdr.detectChanges();
      return;
    }

    if (this.checkIn < this.todayDate) {
      this.errore = 'Non e\' possibile selezionare una data antecedente ad oggi!';
      this.cdr.detectChanges();
      return;
    }

    if (this.includeAlbergo() && !this.checkOut) {
      this.errore = 'Seleziona la data di Check-out!';
      this.cdr.detectChanges();
      return;
    }

    if (this.includeAlbergo() && this.checkOut <= this.checkIn) {
      this.errore = 'La data di Check-out deve essere successiva a quella di Check-in!';
      this.cdr.detectChanges();
      return;
    }

    if (this.includeAlbergo() && !this.stanzaSelezionata) {
      this.errore = 'Seleziona una stanza disponibile!';
      this.cdr.detectChanges();
      return;
    }

    if (this.includeAlbergo() && this.superaCapienza()) {
      const cap = this.capienzaStanzaSelezionata();
      this.errore = `Numero di ospiti (${this.ospiti.length}) superiore alla capienza massima della stanza selezionata (${cap})!`;
      this.cdr.detectChanges();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    let idPensioneVal: number | null = null;
    if (this.includeAlbergo()) {
      if (this.pensione === 'COMPLETA') idPensioneVal = 1;
      else if (this.pensione === 'MEZZA') idPensioneVal = 2;
      else idPensioneVal = 3;
    }

    const payload = {
      idStanza: this.includeAlbergo() && this.stanzaSelezionata ? Number(this.stanzaSelezionata) : null,
      checkin: this.checkIn,
      checkout: this.includeAlbergo() ? (this.checkOut ? this.checkOut : this.checkIn) : this.checkIn,
      checkIn: this.checkIn,
      checkOut: this.includeAlbergo() ? (this.checkOut ? this.checkOut : this.checkIn) : this.checkIn,
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
        this.caricaPrenotazioni();
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
          this.caricaPrenotazioni();
          this.cdr.detectChanges();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        let msgExt = err.error?.message || err.error || err.message || '';
        if (msgExt.includes('capienza') || msgExt.includes('Numero ospiti')) {
          this.errore = 'Impossibile completare la prenotazione: Numero di ospiti superiore alla capienza massima della stanza!';
        } else if (msgExt) {
          this.errore = `Errore dal server: ${msgExt}`;
        } else {
          this.errore = 'Errore durante la registrazione. Verificare i dati inseriti.';
        }

        this.cdr.detectChanges();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}