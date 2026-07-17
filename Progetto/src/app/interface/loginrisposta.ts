export interface LoginRisposta {
  token: string;
  ruolo: 'CLIENTE' | 'ADMIN';
}