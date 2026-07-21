import { ServizioInfo } from "./servizioinfo";
import { PensioneInfo } from "./pensioneinfo";

export interface Ospite {
  nome: string;
  cognome: string;
  dataNascita: string;
}

export interface PayloadPrenotazione {
  idStanza: number | null;
  checkin: string;
  checkout: string;
  checkIn: string;
  checkOut: string;
  idPensione: number;
  tipoPrenotazione: string;
  dovePrenotazione: string;
  tipoPagamento: string;
  ospiti: Ospite[];
  serviziAggiuntivi: number[];
}

export interface Prenotazione {
  id?: number;
  tipoPrenotazione: string;
  checkIn: string;
  checkOut: string;
  tipoPagamento: string;
  prezzoTotale?: number;
  caparra?: number;
  stato?: string;
  tipoCamera?: string;
  ospiti?: Ospite[];
  servizi?: ServizioInfo[];
}