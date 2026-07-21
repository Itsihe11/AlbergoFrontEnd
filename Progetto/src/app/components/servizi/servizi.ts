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
    { idservizio: 1, nomeservizio: 'Animali ammessi', prezzi: 0 },
    { idservizio: 2, nomeservizio: 'TV in camera', prezzi: 0 },
    { idservizio: 3, nomeservizio: 'Climatizzazione', prezzi: 0 },
    { idservizio: 4, nomeservizio: 'Parcheggio', prezzi: 0 },
    { idservizio: 5, nomeservizio: 'SPA', prezzi: 200 }
  ];

  ngOnInit(): void {
    console.log('1. Inizio caricamento servizi...');
    
    this.prenotazioniService.getServizi().pipe(
      finalize(() => {
        console.log('3. Caricamento completato.');
        this.caricamento = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res: ServizioInfo[]) => {
        console.log('2. Risposta dal server:', res);
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