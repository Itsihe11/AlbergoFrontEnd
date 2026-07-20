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

  /**
   * Invia la richiesta HTTP POST a Spring Boot per salvare la prenotazione nel DB
   */
  creaPrenotazione(prenotazione: any): Observable<Prenotazione> {
    return this.http.post<Prenotazione>((`${this.urlSpring}/prenota`), prenotazione);
  }

  /**
   * Recupera le prenotazioni dell'utente dal DB
   */
  getPrenotazioniCliente(): Observable<Prenotazione[]> {
    return this.http.get<Prenotazione[]>(`${this.urlSpring}/mie`);
  }

  /**
   * Annulla una prenotazione sul DB
   */
  annullaPrenotazione(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlSpring}/${id}`);
  }

  /**
   * Cedimento della prenotazione a un nuovo intestatario sul DB
   */
  cedePrenotazione(id: number, nuovoIntestatario: Ospite): Observable<Prenotazione> {
    return this.http.put<Prenotazione>(`${this.urlSpring}/${id}/cedi`, nuovoIntestatario);
  }
}