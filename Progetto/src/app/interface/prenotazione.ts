export interface Ospite {
  nome: string;
  cognome: string;
  dataNascita: string;
}

export interface Prenotazione {
  id?: number;
  tipoPrenotazione: 'ALBERGO' | 'ALBERGO_SPA' | 'SPA';
  tipoCamera?: string;
  checkIn: string;
  checkOut: string;
  pensione?: 'MEZZA' | 'COMPLETA';
  ospiti: Ospite[];
  metodoPagamento: 'BONIFICO' | 'CARTA';
  caparra: number;
  prezzoTotale: number;
  stato?: 'CONFERMATA' | 'ANNULLATA';
}