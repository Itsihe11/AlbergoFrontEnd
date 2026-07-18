import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Prenotazione, Ospite } from '../interface/prenotazione';

@Injectable({
  providedIn: 'root'
})
export class PrenotazioniService {
  private http = inject(HttpClient);
  private readonly urlSpring = '/api/prenotazioni';

  // TEMPORANEO: metti false quando il backend Spring Boot è pronto
  private readonly USA_MOCK = true;

  private prenotazioniFinte: Prenotazione[] = [
    {
      id: 1,
      tipoPrenotazione: 'ALBERGO_SPA',
      tipoCamera: 'Doppia',
      checkIn: '2026-08-01',
      checkOut: '2026-08-05',
      pensione: 'MEZZA',
      ospiti: [{ nome: 'Mario', cognome: 'Rossi', dataNascita: '1990-01-01' }],
      metodoPagamento: 'CARTA',
      caparra: 40,
      prezzoTotale: 400,
      stato: 'CONFERMATA'
    }
  ];

  creaPrenotazione(prenotazione: Prenotazione): Observable<Prenotazione> {
    if (this.USA_MOCK) {
      const nuova = { ...prenotazione, id: this.prenotazioniFinte.length + 1, stato: 'CONFERMATA' as const };
      this.prenotazioniFinte.push(nuova);
      return of(nuova);
    }
    return this.http.post<Prenotazione>(this.urlSpring, prenotazione);
  }

  getPrenotazioniCliente(): Observable<Prenotazione[]> {
    if (this.USA_MOCK) {
      return of(this.prenotazioniFinte);
    }
    return this.http.get<Prenotazione[]>(`${this.urlSpring}/mie`);
  }

  annullaPrenotazione(id: number): Observable<void> {
    if (this.USA_MOCK) {
      const p = this.prenotazioniFinte.find(x => x.id === id);
      if (p) p.stato = 'ANNULLATA';
      return of(undefined);
    }
    return this.http.delete<void>(`${this.urlSpring}/${id}`);
  }

  cedePrenotazione(id: number, nuovoIntestatario: Ospite): Observable<Prenotazione> {
    if (this.USA_MOCK) {
      const p = this.prenotazioniFinte.find(x => x.id === id);
      if (p) p.ospiti[0] = nuovoIntestatario;
      return of(p!);
    }
    return this.http.put<Prenotazione>(`${this.urlSpring}/${id}/cedi`, nuovoIntestatario);
  }
}