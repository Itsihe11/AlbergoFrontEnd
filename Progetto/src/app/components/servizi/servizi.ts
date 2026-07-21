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
    { nome: 'Animali ammessi', descrizione: 'Accesso libero per gli animali.' },
    { nome: 'TV in camera', descrizione: 'Smart TV con accesso multimedia.' },
    { nome: 'Climatizzazione', descrizione: 'Aria condizionata inclusa nel pacchetto.' },
    { nome: 'Parcheggio', descrizione: 'Parcheggio gratuito senza tasse aggiuntive.' },
    { nome: 'SPA', descrizione: "Prenotabile insieme all'hotel (+200€ una tantum)." }
  ];
}