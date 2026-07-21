import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoCamera, Stanza } from '../interface/tipocamera';

@Injectable({
  providedIn: 'root'
})
export class CamereService {
  private http = inject(HttpClient);

  private readonly apiStanze = '/api/dipendente/stanza';
  private readonly apiTipologie = '/api/dipendente/tipologie';


  getStanze(): Observable<Stanza[]> {
    return this.http.get<Stanza[]>(`${this.apiStanze}/listaStanze`);
  }

  creaStanza(stanza: Stanza): Observable<string> {
    return this.http.post(`${this.apiStanze}/datiStanza`, stanza, { responseType: 'text' });
  }

  eliminaStanza(id: number): Observable<string> {
    return this.http.delete(`${this.apiStanze}/cancellaStanza/${id}`, { responseType: 'text' });
  }

  getTipiCamera(): Observable<TipoCamera[]> {
    return this.http.get<TipoCamera[]>(`${this.apiTipologie}/tipologieStanze`);
  }

  getStanzePerTipo(nomeTipologia: string): Observable<Stanza[]> {
    return new Observable<Stanza[]>(observer => {
      this.getStanze().subscribe({
        next: stanze => {
          const filtrate = stanze.filter(s =>
            s.tipologia?.nome?.trim().toLowerCase() === nomeTipologia.trim().toLowerCase()
          );
          observer.next(filtrate);
          observer.complete();
        },
        error: err => observer.error(err)
      });
    });
  }

  creaTipoCamera(tipoCamera: TipoCamera): Observable<string> {
    return this.http.post(`${this.apiTipologie}/datiTipologia`, tipoCamera, { responseType: 'text' });
  }

  eliminaTipoCamera(id: number): Observable<string> {
    return this.http.delete(`${this.apiTipologie}/cancellaTipologia/${id}`, { responseType: 'text' });
  }
}