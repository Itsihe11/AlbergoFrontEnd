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

      // Estraiamo il nome dalla proprietà 'tipologia' inviata dal backend
      const nomeTipologia = 
        item.tipologia?.nome || 
        item.tipologia?.tipo || 
        item.tipologia?.nomeTipologia ||
        (typeof item.tipologia === 'string' ? item.tipologia : null) ||
        item.tipoCamera?.nome ||
        item.tipo;

      if (!nomeTipologia || !tipo) return false;

      // Confronto case-insensitive e senza spazi extra
      return String(nomeTipologia).trim().toLowerCase() === String(tipo).trim().toLowerCase();
    }))
  );
}
  creaStanza(stanza: Stanza): Observable<Stanza> {
    return this.http.post<Stanza>(this.apiStanze, stanza);
  }

  // 🟢 AGGIUNTO: Metodo mancante per creare un nuovo tipo di camera
  creaTipoCamera(tipoCamera: TipoCamera): Observable<TipoCamera> {
    return this.http.post<TipoCamera>(`${this.apiStanze}/tipo`, tipoCamera);
  }

  eliminaStanza(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiStanze}/${id}`);
  }
}