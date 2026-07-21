import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TipoCamera,Stanza } from '../../interface/tipocamera';
import { Prenotazione } from '../../interface/prenotazione';


@Injectable({
  providedIn: 'root'
})
export class CamereService {

  private apiStanze = '/api/dipendente/stanza';
  private apiPrenotazioni = '/api/prenotazione';
  private apiTipologiaStanze ='/api/dipendente/tipologie'


  
  private stanzeLocali: Stanza[] = [];
  private prenotazioniLocali: Prenotazione[] = [];
  private idContatoreStanze = 100;
  private idContatorePrenotazioni = 1000;

  constructor(private http: HttpClient) {}

  // ==========================================
  // STANZE E TIPI CAMERA
  // ==========================================

  getStanze(): Observable<Stanza[]> {
    if (this.stanzeLocali.length > 0) {
      return of(this.stanzeLocali);
    }

    return this.http.get<Stanza[]>(`${this.apiStanze}/listaStanze`).pipe(
      tap(stanze => this.stanzeLocali = stanze)
    );
  }

  getTipiCamera(): Observable<TipoCamera[]> {
    return this.http.get<TipoCamera[]>(`${this.apiTipologiaStanze}/tipologieStanze`);
  }

  // SIMULAZIONE CREAZIONE STANZA
  creaStanza(stanza: Stanza): Observable<Stanza> {
    const nuovaStanza: Stanza = {
      ...stanza,
      id: this.idContatoreStanze++
    };
    
    this.stanzeLocali.push(nuovaStanza);
    console.log('Simulazione creazione stanza:', nuovaStanza);
    
    return of(nuovaStanza);
  }

  // SIMULAZIONE ELIMINAZIONE STANZA
  eliminaStanza(id: number): Observable<void> {
    this.stanzeLocali = this.stanzeLocali.filter(s => s.id !== id);
    console.log('Simulazione eliminazione stanza ID:', id);
    return of(void 0);
  }

  // SIMULAZIONE CREAZIONE TIPO CAMERA
  creaTipoCamera(tipoCamera: TipoCamera): Observable<TipoCamera> {
    return of(tipoCamera);
  }

  // ==========================================
  // PRENOTAZIONI
  // ==========================================

  // SIMULAZIONE CREAZIONE PRENOTAZIONE
  creaPrenotazione(prenotazione: Prenotazione): Observable<Prenotazione> {
    const nuovaPrenotazione: Prenotazione = {
      ...prenotazione,
      id: this.idContatorePrenotazioni++,
      stato: 'CONFERMATA'
    };

    this.prenotazioniLocali.push(nuovaPrenotazione);
    console.log('Simulazione creazione prenotazione:', nuovaPrenotazione);

    return of(nuovaPrenotazione);
  }

  // RECUPERO PRENOTAZIONI (per Pannello Admin)
  getPrenotazioni(): Observable<Prenotazione[]> {
    return of(this.prenotazioniLocali);
  }
}