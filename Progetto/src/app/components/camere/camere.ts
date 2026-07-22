import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CamereService } from '../../services/camere.service';
import { TipoCamera } from '../../interface/tipocamera';

@Component({
  selector: 'app-camere',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './camere.html'
})
export class Camere implements OnInit {
  private camereService = inject(CamereService);

  tipiCamera = signal<TipoCamera[]>([]);
  caricamento = signal(true);
  errore = signal<string | null>(null);

  private svgFallback = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 24 24' fill='%23f3f4f6' stroke='%239ca3af' stroke-width='1.5'><rect x='2' y='3' width='20' height='18' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/><path d='M21 15l-5-5L5 21'/></svg>";
  private immagineDefault = 'assets/camere/placeholder.jpg';

  getImmagine(tipologiaOrNome: TipoCamera | string): string {
    if (!tipologiaOrNome) return this.immagineDefault;

    const nome = (typeof tipologiaOrNome === 'object'
      ? (tipologiaOrNome.nome || (tipologiaOrNome as any).nomeTipologia || '')
      : tipologiaOrNome).toString().trim();

    if (!nome) return this.immagineDefault;

    const nomeLower = nome.toLowerCase();

    const imgLocale = localStorage.getItem('img_camera_' + nomeLower);
    if (imgLocale && imgLocale.trim() !== '') {
      return imgLocale.trim();
    }

    if (typeof tipologiaOrNome === 'object') {
      const imgCustom = (tipologiaOrNome as any).immagine || 
                        (tipologiaOrNome as any).foto || 
                        (tipologiaOrNome as any).immagineUrl ||
                        (tipologiaOrNome as any).urlImmagine ||
                        (tipologiaOrNome as any).url_immagine;
      
      if (imgCustom && imgCustom.toString().trim() !== '') {
        return imgCustom.toString().trim();
      }
    }

    if (nomeLower.includes('singol')) return 'assets/camere/singole.jpg';
    if (nomeLower.includes('doppi')) return 'assets/camere/doppia.webp';
    if (nomeLower.includes('spa')) return 'assets/camere/spa.jpg';
    if (nomeLower.includes('presidential')) return 'assets/camere/presidential.avif';
    if (nomeLower.includes('superior') || nomeLower.includes('suite')) return 'assets/camere/suite.jpg';

    return this.immagineDefault;
  }

  onImgError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = this.svgFallback;
    }
  }

  ngOnInit(): void {
    this.camereService.getTipiCamera().subscribe({
      next: dati => {
        this.tipiCamera.set(dati);
        this.caricamento.set(false);
      },
      error: err => {
        console.error('Camere: errore ricevuto', err);
        this.errore.set('Impossibile caricare le camere al momento.');
        this.caricamento.set(false);
      }
    });
  }
}