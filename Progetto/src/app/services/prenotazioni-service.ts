import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PensioneInfo } from '../interface/pensioneinfo';
import { ServizioInfo } from '../interface/servizioinfo';
import { TipoCamera, Stanza } from '../interface/tipocamera';
import { PayloadPrenotazione } from '../interface/prenotazione';

export type { PensioneInfo };

@Injectable({
  providedIn: 'root'
})
export class PrenotazioniService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/prenotazione';

  getPensioni(): Observable<PensioneInfo[]> {
    return this.http.get<PensioneInfo[]>(`${this.baseUrl}/pensione`);
  }

  getPrezzoSpa(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/spa/prezzo`);
  }

  getServizi(): Observable<ServizioInfo[]> {
    return this.http.get<ServizioInfo[]>(`${this.baseUrl}/servizi`);
  }

  getTipiCamera(): Observable<TipoCamera[]> {
    return this.http.get<TipoCamera[]>('http://localhost:8080/api/dipendente/tipologie/tipologieStanze');
  }

  getTutteLeStanze(): Observable<Stanza[]> {
    return this.http.get<Stanza[]>('http://localhost:8080/api/dipendente/stanza/listaStanze');
  }

  getStanzeDisponibili(checkIn: string, checkOut: string): Observable<Stanza[]> {
    return this.http.get<Stanza[]>(`${this.baseUrl}/disponibile/${checkIn}/${checkOut}`);
  }

  creaPrenotazione(payload: PayloadPrenotazione | any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/prenota`, payload);
  }

  getAllPrenotazioni(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/all`);
  }

  getPrenotazioneByCodice(codice: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/codice/${codice}`);
  }

  checkIn(codice: string): Observable<string> {
    return this.http.put(`${this.baseUrl}/checkin/${codice}`, {}, { responseType: 'text' });
  }

  checkOut(codice: string): Observable<string> {
    return this.http.put(`${this.baseUrl}/checkout/${codice}`, {}, { responseType: 'text' });
  }

  modificaOspitiECreaAccount(payload: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/modifica-ospiti-account`, payload);
  }

  annullaPrenotazione(codice: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/annulla/${codice}/false`, {});
  }
}