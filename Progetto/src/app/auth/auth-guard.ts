import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-services';

export const clienteGuard = (): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.ruolo === 'CLIENTE') {
    return true;
  }

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