export interface TipoCamera {
  id?: number;
  nome: string;
  prezzo: number;
  descrizione?: string;
  capienza?: number;
}

export interface Stanza {
  id?: number;
  numeroStanza: string;
  tipologia: TipoCamera;
  status?: string; 
}