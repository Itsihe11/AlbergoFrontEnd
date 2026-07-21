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
    'Singola': '/camere/singola.jpg',
    'Doppia': '/camere/doppia.webp',
    'Suite': '/camere/suite.jpg'
  };
  private immagineDefault = '/camere/placeholder.jpg';

  getImmagine(nomeTipologia: string): string {
    if (!nomeTipologia) return this.immagineDefault;

    const nomeLower = nomeTipologia.toLowerCase();

    if (nomeLower.includes('singol')) return 'assets/camere/singole.jpg';
    if (nomeLower.includes('doppi')) return 'assets/camere/doppia.webp';
    if (nomeLower.includes('suite') || nomeLower.includes('superior')) return 'assets/camere/suite.jpg';

    return this.immagineDefault;
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