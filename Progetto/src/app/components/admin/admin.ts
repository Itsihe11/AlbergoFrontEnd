import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { CamereService } from '../../services/camere.service';
import { TipoCamera, Stanza } from '../../interface/tipocamera';
import { RichiestaAdmin } from '../../interface/richiestaadmin';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html'
})
export class Admin implements OnInit {
  username = '';
  password = '';
  errorMessage = '';
  isLogged = false;
  sezioneAttiva: 'tipologie' | 'stanze' | 'elenco' = 'tipologie';

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

  constructor(
    private adminService: AdminService,
    private camereService: CamereService
  ) {}

  ngOnInit(): void {
    this.isLogged = this.adminService.isLoggedIn();
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
        this.isLogged = true;
        this.errorMessage = '';
        this.caricaDati();
      },
      error: err => {
        this.errorMessage = err.error || 'Credenziali non valide.';
      }
    });
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
  }

  salvaTipoCamera(): void {
    if (!this.nuovoTipoCamera.nome || this.nuovoTipoCamera.prezzo <= 0) {
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

  logout(): void {
    this.adminService.logout();
    this.isLogged = false;
  }
}