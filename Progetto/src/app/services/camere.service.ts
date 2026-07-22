import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Stanza, TipoCamera } from '../interface/tipocamera';

@Injectable({
  providedIn: 'root'
})
export class CamereService {
  private http = inject(HttpClient);
  private readonly apiStanze = '/api/dipendente/stanza';
  private readonly apiTipologiaStanze = '/api/dipendente/tipologie';

  getStanze(): Observable<Stanza[]> {
    return this.http.get<Stanza[]>(`${this.apiStanze}/listaStanze`);
  }

  getTipiCamera(): Observable<TipoCamera[]> {
    return this.http.get<TipoCamera[]>(`${this.apiTipologiaStanze}/tipologieStanze`);
  }

  getStanzePerTipo(tipo: string): Observable<Stanza[]> {
    return this.getStanze().pipe(
      map(stanze => stanze.filter(s => {
        const item = s as any;
        const nomeTipologia = item.tipologia?.nome;
        if (!nomeTipologia || !tipo) return false;
        return String(nomeTipologia).trim().toLowerCase() === String(tipo).trim().toLowerCase();
      }))
    );
  }

  creaStanza(stanza: Stanza): Observable<string> {
    return this.http.post(`${this.apiStanze}/datiStanza`, stanza, { responseType: 'text' });
  }

  creaTipoCamera(tipoCamera: TipoCamera): Observable<string> {
    return this.http.post(`${this.apiTipologiaStanze}/datiTipologia`, tipoCamera, { responseType: 'text' });
  }

  eliminaStanza(id: number): Observable<string> {
    return this.http.delete(`${this.apiStanze}/cancellaStanza/${id}`, { responseType: 'text' });
  }
  eliminaTipoCamera(id: number | string): Observable<any> {
  return this.http.delete(`${this.apiTipologiaStanze}/cancellaTipologia/${id}`); // verifica il tuo endpoint backend per le tipologie
}
}