import { inject } from '@angular/core';
import { Router } from '@angular/router';
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

export const adminGuard = (): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.ruolo === 'ADMIN') {
    return true;
  }

  router.navigate(['/utenti']); 
  return false;
};