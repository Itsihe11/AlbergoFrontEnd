import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CamereService } from '../../services/camere.service';
import { TipoCamera } from '../../interface/tipocamera';

@Component({
  selector: 'app-camere',
  imports: [RouterLink],
  templateUrl: './camere.html',
  styleUrl: './camere.css',
})
export class Camere implements OnInit {

  private camereService = inject(CamereService);

  tipiCamera: TipoCamera[] = [];
  caricamento = true;
  errore: string | null = null;

  ngOnInit(): void {
    this.camereService.getCamere().subscribe({
      next: (camere) => {
        this.tipiCamera = camere;
        this.caricamento = false;
      },
      error: () => {
        this.errore = 'Impossibile caricare le camere. Riprova più tardi.';
        this.caricamento = false;
      }
    });
  }
}