import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CamereService } from '../../services/camere.service';
import { TipoCamera } from '../../interface/tipocamera';

@Component({
  selector: 'app-camere',
  imports: [RouterLink],
  templateUrl: './camere.html'
})
export class Camere implements OnInit {
  private camereService = inject(CamereService);

  tipiCamera = signal<TipoCamera[]>([]);
  caricamento = signal(true);
  errore = signal<string | null>(null);

  private immaginiPerTipologia: Record<string, string> = {
    'Singola': '/assets/camere/singola.jpg',
    'Doppia': '/assets/camere/doppia.webp',
    'Suite': '/assets/camere/suite.jpg'
  };
  private immagineDefault = '/assets/camere/placeholder.jpg';

  getImmagine(nomeTipologia: string): string {
    return this.immaginiPerTipologia[nomeTipologia] ?? this.immagineDefault;
  }

  ngOnInit(): void {
    this.camereService.getTipiCamera().subscribe({
      next: dati => {
        this.tipiCamera.set(dati);
        this.caricamento.set(false);
      },
      error: err => {
        console.log('Camere: errore ricevuto', err);
        this.errore.set('Impossibile caricare le camere al momento.');
        this.caricamento.set(false);
      }
    });
  }
}