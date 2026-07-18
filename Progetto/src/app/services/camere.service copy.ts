// quello vero, l'altro è un test

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CamereService {

  private readonly urlSpring = '/api/camere';

  constructor(private http: HttpClient) {}

  getCamere(): Observable<any[]> {
    return this.http.get<any[]>(this.urlSpring);
  }
}

