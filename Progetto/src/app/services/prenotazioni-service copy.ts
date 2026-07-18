// copia vera, l'altra è un test


import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Prenotazione, Ospite } from '../interface/prenotazione';

@Injectable({
  providedIn: 'root'
})
export class PrenotazioniService {
  private http = inject(HttpClient);
  private readonly urlSpring = '/api/prenotazioni';

  creaPrenotazione(prenotazione: Prenotazione): Observable<Prenotazione> {
    return this.http.post<Prenotazione>(this.urlSpring, prenotazione);
  }

  getPrenotazioniCliente(): Observable<Prenotazione[]> {
    return this.http.get<Prenotazione[]>(`${this.urlSpring}/mie`);
  }

  annullaPrenotazione(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlSpring}/${id}`);
  }

  cedePrenotazione(id: number, nuovoIntestatario: Ospite): Observable<Prenotazione> {
    return this.http.put<Prenotazione>(`${this.urlSpring}/${id}/cedi`, nuovoIntestatario);
  }
}