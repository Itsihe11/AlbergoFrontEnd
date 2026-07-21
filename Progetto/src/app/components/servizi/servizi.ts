import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PrenotazioniService } from '../../services/prenotazioni-service';
import { ServizioInfo } from '../../interface/servizioinfo';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-servizi',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './servizi.html',
  styleUrl: './servizi.css'
})
export class Servizi implements OnInit {
  private prenotazioniService = inject(PrenotazioniService);
  private cdr = inject(ChangeDetectorRef);

  servizi: ServizioInfo[] = [];
  caricamento: boolean = true;
  errore: string = '';

  private serviziFallback: ServizioInfo[] = [
    { idservizio: 1, nomeservizio: 'SPA', prezzi: 200, descrizione: 'Accesso completo alla nostra area benessere con piscina, sauna e trattamenti.' },
    { idservizio: 2, nomeservizio: 'TV', prezzi: 0, descrizione: 'Smart TV con accesso a canali internazionali e piattaforme streaming.' },
    { idservizio: 3, nomeservizio: 'WI-FI', prezzi: 0, descrizione: 'Connessione Wi-Fi ad alta velocità disponibile in tutte le aree dell\'hotel.' },
    { idservizio: 4, nomeservizio: 'PARCHEGGIO', prezzi: 25, descrizione: 'Posto auto riservato e sorvegliato all\'interno della struttura.' },
    { idservizio: 5, nomeservizio: 'SERVIZIO IN STANZA', prezzi: 75, descrizione: 'Ordina cibo e bevande direttamente in camera, 24 ore su 24.' }
  ];

  private immaginiPerServizio: Record<string, string> = {
    'spa': 'assets/servizi/spa.jpg',
    'tv': 'assets/servizi/tv.jpg',
    'wifi': 'assets/servizi/wifi.jpg',
    'parcheggio': 'assets/servizi/parcheggio.jpg',
    'servizioinstanza': 'assets/servizi/room-service.jpg'
  };
  private immagineDefault = 'assets/servizi/placeholder.jpg';

  getImmagine(nomeServizio: string): string {
    if (!nomeServizio) return this.immagineDefault;
    const normalizzato = nomeServizio.toLowerCase().replace(/[\s-]/g, '');

    for (const chiave in this.immaginiPerServizio) {
      if (normalizzato.includes(chiave)) {
        return this.immaginiPerServizio[chiave];
      }
    }
    return this.immagineDefault;
  }

  ngOnInit(): void {
    this.prenotazioniService.getServizi().pipe(
      finalize(() => {
        this.caricamento = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res: ServizioInfo[]) => {
        if (res && Array.isArray(res) && res.length > 0) {
          this.servizi = res;
        } else {
          this.servizi = this.serviziFallback;
        }
      },
      error: (err: any) => {
        console.warn('API Servizi offline: usati dati di fallback.', err);
        this.servizi = this.serviziFallback;
      }
    });
  }

  getServizioId(s: ServizioInfo): number {
    return Number(s.idservizio ?? s.id ?? 0);
  }

  getServizioNome(s: ServizioInfo): string {
    return s.nomeservizio || s.nome || 'Servizio';
  }

  getServizioPrezzo(s: ServizioInfo): number {
    return Number(s.prezzi ?? s.prezzo ?? 0);
  }

  getServizioDescrizione(s: ServizioInfo): string {
    return s.descrizione || '';
  }
}