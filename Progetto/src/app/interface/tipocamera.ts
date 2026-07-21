export interface TipoCamera {
  id?: number;
  nome: string;
  prezzo: number;
  descrizione?: string;
  capienza?: number;
  tipoCamera?: string; // TODO temporaneo: alias legacy usato da Prenotazioni, non esiste sul backend
  [key: string]: any; // TODO temporaneo: da togliere quando Prenotazioni userà solo i campi reali
}

export interface Stanza {
  id?: number;
  numeroStanza: string;
  tipologia: TipoCamera;
  status?: string;
}