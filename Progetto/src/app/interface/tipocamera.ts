

export interface TipoCamera {
  id?: number;
  nome?: string;
  nomeTipologia?: string; // 🟢 AGGIUNGI QUESTA RIGA
  descrizione?: string;
  prezzo?: number;
  capienza?: number;
  [key: string]: any;
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