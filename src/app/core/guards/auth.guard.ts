import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

/** Requires the user to be authenticated. Redirects to /auth/login otherwise. */
export const authGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.isLoggedIn()) return true;

  tokenService.clearTokens();
  return router.createUrlTree(['/auth/login']);
};
