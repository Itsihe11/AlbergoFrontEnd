export interface TipoCamera {
  id?: number;
  nome?: string;
  tipoCamera?: string;
  prezzo?: number;
  [key: string]: any;
}

export interface Stanza {
  id?: number;
  numeroStanza: string;
  piano: number;
  disponibile: boolean;
  inVetrina?: boolean;
  tipoCamera: TipoCamera;
}