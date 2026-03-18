import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

/** Prevents authenticated users from accessing public pages (login, register).
 *  Redirects to /cronos/dashboard if already logged in. */
export const guestGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (!tokenService.isLoggedIn()) return true;

  return router.createUrlTree(['/cronos/dashboard']);
};
