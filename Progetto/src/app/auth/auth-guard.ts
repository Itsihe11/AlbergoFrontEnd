import { inject } from '@angular/core';
import { Router,CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-services';





export const clienteGuard = (): boolean => {
  const router = inject(Router);

  // Verifichiamo se esiste la prenotazione o l'utente nel localStorage
  const haPrenotazione = !!localStorage.getItem('prenotazione_corrente');
  const haUtenteLogged = !!localStorage.getItem('utente_logged');

  // 🟢 Se almeno uno dei due è presente, sblocchiamo l'accesso
  if (haPrenotazione || haUtenteLogged) {
    return true;
  }

  // 🔴 Altrimenti rimandiamo al login /utenti
  console.warn('⛔ Accesso bloccato dal Guard: nessuna prenotazione in memoria.');
  router.navigate(['/utenti']); 
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = JSON.parse(localStorage.getItem('utente_logged') || '{}');

  // 🟢 Controlla se il ruolo è "ADMIN"
  if (user && user.ruolo === 'ADMIN') {
    return true;
  }

  console.warn('Accesso negato dal Guard: non sei Admin!');
  router.navigate(['/utenti']);
  return false;
};