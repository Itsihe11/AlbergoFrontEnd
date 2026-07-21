export interface TipoCamera {
  id?: number;
  nomeTipologia?: string;
  nome?: string;
  descrizione?: string;
  capienza?: number;
  prezzo?: number;
  immagine?: string;
}

export interface Stanza {
  id?: number;
  idStanza?: number;
  numeroStanza?: string;
  numero?: string;
  status?: string;
  stato?: string;
  tipologiaStanza?: TipoCamera;
  tipologia?: TipoCamera;
  disponibile?: boolean;
}