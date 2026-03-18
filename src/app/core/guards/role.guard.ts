import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

/** Verifies that the authenticated user holds the required role (default: 'ADMIN').
 *  Configure via route data: { data: { role: 'ADMIN' } }
 */
export const roleGuard: CanActivateFn = (route) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (!tokenService.isLoggedIn()) {
    return router.createUrlTree(['/auth/login']);
  }

  const requiredRole: string = route.data?.['role'] ?? 'ADMIN';

  if (tokenService.hasRole(requiredRole)) return true;

  return router.createUrlTree(['/cronos/dashboard']);
};
