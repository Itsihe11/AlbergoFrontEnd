import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Servizio {
  nome: string;
  descrizione: string;
  evidenziato?: boolean;
}

@Component({
  selector: 'app-servizi',
  imports: [RouterLink],
  templateUrl: './servizi.html'
})
export class Servizi {
  servizi: Servizio[] = [
    { nome: 'Animali ammessi', descrizione: 'Puoi portare il tuo animale.' },
    { nome: 'TV in camera', descrizione: 'Smart TV.' },
    { nome: 'Climatizzazione', descrizione: 'Aria condizionata(ne ho bisogno [ :( ] ).' },
    { nome: 'Parcheggio', descrizione: 'Parcheggio.' },
    { nome: 'SPA', descrizione: 'Prenotabile insieme con hotel (+200€ una tantum).' }
  ];
}