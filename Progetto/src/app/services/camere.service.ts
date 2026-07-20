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
  private readonly apiStanze = '/api/stanza';

  getStanze(): Observable<Stanza[]> {
    return this.http.get<Stanza[]>(`${this.apiStanze}/lista`);
  }

  getTipiCamera(): Observable<TipoCamera[]> {
    return this.http.get<TipoCamera[]>(`${this.apiStanze}/lista`);
  }

  getStanzePerTipo(tipo: string): Observable<Stanza[]> {
    return this.getStanze().pipe(
      map(stanze => stanze.filter(s => {
        const item = s as any;
        return item.tipo === tipo || item.tipoCamera === tipo || item.nome === tipo;
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