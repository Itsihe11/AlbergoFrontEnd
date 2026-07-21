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
    { idservizio: 1, nomeservizio: 'SPA', prezzi: 200 },
    { idservizio: 2, nomeservizio: 'TV', prezzi: 0 },
    { idservizio: 3, nomeservizio: 'WI-FI', prezzi: 0 },
    { idservizio: 4, nomeservizio: 'PARCHEGGIO', prezzi: 25 },
    { idservizio: 5, nomeservizio: 'SERVIZIO IN STANZA', prezzi: 75 }
  ];

  getImmagine(nomeServizio: string): string {
    if (!nomeServizio) return 'assets/servizi/placeholder.jpg';

    const normalizzato = nomeServizio.toLowerCase().replace(/[\s-]/g, '');

    const mappaImmagini: Record<string, string> = {
      'spa': 'assets/servizi/spa.jpg',
      'tv': 'assets/servizi/tv.jpg',
      'wifi': 'assets/servizi/wifi.jpg',
      'parcheggio': 'assets/servizi/parcheggio.jpg',
      'servizioinstanza': 'assets/servizi/room-service.jpg'
    };

    for (const chiave in mappaImmagini) {
      if (normalizzato.includes(chiave)) {
        return mappaImmagini[chiave];
      }
    }
    return 'assets/servizi/placeholder.jpg';
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
}