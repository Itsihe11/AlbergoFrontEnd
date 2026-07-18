import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-services';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token;

  if (token) {
    const reqClonata = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(reqClonata);
  }

  return next(req);
};