import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CamereService } from '../../services/camere.service';
import { TipoCamera } from '../../interface/tipocamera';

@Component({
  selector: 'app-camere',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './camere.html',
  styleUrl: './camere.css',
})
export class Camere implements OnInit {

  private camereService = inject(CamereService);

  tipiCamera: TipoCamera[] = [];
  caricamento = true;
  errore: string | null = null;

  ngOnInit(): void {
    this.camereService.getStanze().subscribe({
      next: (stanzeFisiche: any[]) => {
        const stanzeSelezionate = stanzeFisiche.filter(s => s.inVetrina === true);

        this.tipiCamera = stanzeSelezionate
          .map(s => s.tipoCamera)
          .filter(tipo => tipo != null);

        this.caricamento = false;
      },
      error: (err) => {
        console.error('Errore durante il caricamento:', err);
        this.errore = 'Impossibile caricare le camere. Riprova più tardi.';
        this.caricamento = false;
      }
    });
  }
}