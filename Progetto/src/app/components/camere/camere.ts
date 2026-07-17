import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-camere',
  imports: [RouterLink],
  templateUrl: './camere.html',
  styleUrl: './camere.css',
})
export class Camere {
  totaleCamere: number = 50;

  tipiCamera: TipoCamera[] = [
    { nome: 'Singola', descrizione: 'Ideale per un soggiorno da sfigati', 
      prezzo: 30, immagine: 'photo' },
    { nome: 'Doppia', descrizione: 'Spaziosa, con letto matrimoniale per 2... non sarò omofobo', 
      prezzo: 45, immagine: 'photo' },
    { nome: 'Suite', descrizione: 'La sfigatisuite, top di gamma', 
      prezzo: 70, immagine: 'photo' }
  ];
}
