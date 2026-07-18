import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { TipoCamera } from '../interface/tipocamera';

@Injectable({
  providedIn: 'root'
})
export class CamereService {
  private http = inject(HttpClient);
  private readonly urlSpring = '/api/camere';

  getCamere(): Observable<TipoCamera[]> {
    // TEMPORANEO PER TEST - da togliere quando il backend è pronto
    return of([
      { nome: 'Singola', descrizione: 'Camera singola', prezzo: 30, immagine: 'photo' },
      { nome: 'Doppia', descrizione: 'Camera doppia', prezzo: 45, immagine: 'photo' },
      { nome: 'Suite', descrizione: 'Suite di lusso', prezzo: 70, immagine: 'photo' }
    ]);

    // return this.http.get<TipoCamera[]>(this.urlSpring); // riattiva quando il backend è pronto
  }
}