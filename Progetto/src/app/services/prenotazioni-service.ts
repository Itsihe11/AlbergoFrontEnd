import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PensioneInfo } from '../interface/pensioneinfo';
import { ServizioInfo } from '../interface/servizioinfo';
import { TipoCamera, Stanza } from '../interface/tipocamera';
import { Prenotazione, PayloadPrenotazione, Ospite } from '../interface/prenotazione';

@Injectable({
  providedIn: 'root'
})
export class PrenotazioniService {
  private http = inject(HttpClient);
  private readonly urlPrenotazione = '/api/prenotazione';

  getPensioni(): Observable<PensioneInfo[]> {
    return this.http.get<PensioneInfo[]>(`${this.urlPrenotazione}/pensione`);
  }

  getPrezzoSpa(): Observable<number> {
    return this.http.get<number>(`${this.urlPrenotazione}/spa/prezzo`);
  }

  getServizi(): Observable<ServizioInfo[]> {
    return this.http.get<ServizioInfo[]>(`${this.urlPrenotazione}/servizi`);
  }

  getTipiCamera(): Observable<TipoCamera[]> {
    return this.http.get<TipoCamera[]>('/api/dipendente/tipologie/tipologieStanze');
  }

  getStanzeDisponibili(checkIn: string, checkOut: string): Observable<Stanza[]> {
    return this.http.get<Stanza[]>(`${this.urlPrenotazione}/disponibile/${checkIn}/${checkOut}`);
  }

  getTutteLeStanze(): Observable<Stanza[]> {
    return this.http.get<Stanza[]>('/api/dipendente/stanza/listaStanze');
  }

  creaPrenotazione(prenotazione: PayloadPrenotazione): Observable<Prenotazione> {
    return this.http.post<Prenotazione>(`${this.urlPrenotazione}/prenota`, prenotazione);
  }

  getPrenotazioniCliente(): Observable<Prenotazione[]> {
    return this.http.get<Prenotazione[]>(`${this.urlPrenotazione}/mie`);
  }

  annullaPrenotazione(id: string | number, modificaOspiti: boolean = false, bodyPayload?: any): Observable<any> {
    return this.http.put<any>(
      `${this.urlPrenotazione}/annulla/${id}/${modificaOspiti}`, 
      bodyPayload || {}
    );
  }

  cedePrenotazione(id: string | number, nuovoIntestatario: Ospite): Observable<Prenotazione> {
    return this.http.put<Prenotazione>(`${this.urlPrenotazione}/${id}/cedi`, nuovoIntestatario);
  }
}