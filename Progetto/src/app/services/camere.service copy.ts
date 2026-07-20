import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoCamera,Stanza } from '../interface/tipocamera';

@Injectable({
  providedIn: 'root'
})
export class CamereService {

  private apiStanze = '/api/stanza'; 

  constructor(private http: HttpClient) {}

  getCamere(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiStanze}/lista`);
  }

  getStanze(): Observable<Stanza[]> {
    return this.http.get<Stanza[]>(`${this.apiStanze}/lista`);
  }

  getTipiCamera(): Observable<TipoCamera[]> {
    return this.http.get<TipoCamera[]>(`${this.apiStanze}/lista`);
  }

  creaTipoCamera(tipoCamera: TipoCamera): Observable<TipoCamera> {
    return this.http.post<TipoCamera>(`${this.apiStanze}/crea-tipo`, tipoCamera);
  }

  creaStanza(stanza: Stanza): Observable<Stanza> {
    return this.http.post<Stanza>(`${this.apiStanze}/crea`, stanza);
  }

  eliminaStanza(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiStanze}/${id}`);
  }
}