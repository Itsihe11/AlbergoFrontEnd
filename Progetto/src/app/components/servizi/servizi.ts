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

  // 📷 Recupera l'immagine salvata dall'Admin in localStorage o ricade sui fallback
  getImmagine(servizioOrNome: ServizioInfo | string): string {
    if (!servizioOrNome) return this.immagineDefault;

    // Estragga il nome del servizio in modo sicuro
    const nome = (typeof servizioOrNome === 'object'
      ? this.getServizioNome(servizioOrNome)
      : servizioOrNome).toString().trim();

    if (!nome) return this.immagineDefault;

    // Normalizza il nome (rimuove spazi e caratteri speciali per la chiave)
    const normalizzato = nome.toLowerCase().replace(/[\s-]/g, '');

    // 1️⃣ Cerca se l'Admin ha salvato un URL personalizzato in localStorage
    const imgLocale = localStorage.getItem('img_servizio_' + normalizzato);
    if (imgLocale && imgLocale.trim() !== '') {
      return imgLocale.trim();
    }

    // 2️⃣ Se per caso l'oggetto arrivato dal backend contiene direttamente il campo
    if (typeof servizioOrNome === 'object') {
      const imgCustom = (servizioOrNome as any).immagine || 
                        (servizioOrNome as any).foto || 
                        (servizioOrNome as any).immagineUrl ||
                        (servizioOrNome as any).urlImmagine ||
                        (servizioOrNome as any).url_immagine;
      
      if (imgCustom && imgCustom.toString().trim() !== '') {
        return imgCustom.toString().trim();
      }
    }

    // 3️⃣ Cerca corrispondenze nella mappa delle immagini locali statiche
    for (const chiave in this.immaginiPerServizio) {
      if (normalizzato.includes(chiave)) {
        return this.immaginiPerServizio[chiave];
      }
    }

    // 4️⃣ Immagine di riserva
    return this.immagineDefault;
  }

  // 🛡️ Gestisce i fallimenti di caricamento dell'immagine (404/403) impostando il placeholder
  onImgError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = this.immagineDefault;
    }
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