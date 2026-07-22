import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-services';


export const clienteGuard = (): boolean => {
  const router = inject(Router);

  const haPrenotazione = !!localStorage.getItem('prenotazione_corrente');
  const haUtenteLogged = !!localStorage.getItem('utente_logged');

  if (haPrenotazione || haUtenteLogged) {
    return true;
  }
  console.warn('Accesso bloccato dal Guard.');
  router.navigate(['/utenti']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = JSON.parse(localStorage.getItem('utente_logged') || '{}');

  if (user && user.ruolo === 'ADMIN') {
    return true;
  }

  console.warn('Accesso negato dal Guard: non sei Admin!');
  router.navigate(['/utenti']);
  return false;
};