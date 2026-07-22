import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Prenotazione, Ospite } from '../interface/prenotazione';

export interface PensioneInfo {
  id?: number;
  tipo: string;
  nome?: string;
  prezzo: number;
}

export interface ServizioInfo {
  idservizio?: number;
  id?: number;
  nomeservizio: string;
  prezzi?: number;
  prezzo?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PrenotazioniService {
  private http = inject(HttpClient);
  private readonly urlPrenotazione = '/api/prenotazione';


loginUtente(email: string, pin: string): Observable<any> {
  return this.http.post<any>(`${this.urlPrenotazione}/login-utente`, { email, pin });
}
getPrenotazioneByCodice(codice: string): Observable<any> {
  return this.http.get<any>(`${this.urlPrenotazione}/codice/${codice}`);
}

modificaOspitiECreaAccount(payload: any): Observable<any> {
  return this.http.put<any>(`${this.urlPrenotazione}/modifica-ospiti-account`, payload);
}

  getPensioni(): Observable<PensioneInfo[]> {
    return this.http.get<PensioneInfo[]>(`${this.urlPrenotazione}/pensione`);
  }

  getPrezzoSpa(): Observable<number> {
    return this.http.get<number>(`${this.urlPrenotazione}/spa/prezzo`);
  }

  getServizi(): Observable<ServizioInfo[]> {
    return this.http.get<ServizioInfo[]>(`${this.urlPrenotazione}/servizi`);
  }

  getTipiCamera(): Observable<any[]> {
    return this.http.get<any[]>('/api/dipendente/tipologie/tipologieStanze');
  }

  getStanzeDisponibili(checkIn: string, checkOut: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlPrenotazione}/disponibile/${checkIn}/${checkOut}`);
  }

  getTutteLeStanze(): Observable<any[]> {
    return this.http.get<any[]>('/api/dipendente/stanza/listaStanze');
  }

  creaPrenotazione(prenotazione: any): Observable<Prenotazione> {
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