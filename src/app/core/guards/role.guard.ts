import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';
import { ToastService } from '../../shared/services/toast.service';

/**
 * Protects routes that require a specific role (default: 'ADMIN').
 * Configure via route data: { data: { role: 'ADMIN' } }
 *
 * Behaviour:
 * - Not authenticated  → redirect to /auth/login
 * - Authenticated but missing role → toast warning + redirect to /cronos/dashboard
 * - Has role → allow navigation
 */
export const roleGuard: CanActivateFn = (route) => {
  const tokenService = inject(TokenService);
  const router       = inject(Router);
  const toast        = inject(ToastService);

  if (!tokenService.isLoggedIn()) {
    return router.createUrlTree(['/auth/login']);
  }

  const requiredRole: string = route.data?.['role'] ?? 'ADMIN';

  if (tokenService.hasRole(requiredRole)) return true;

  toast.error(
    'Acceso restringido',
    `No tienes permisos para acceder a esta sección. Si necesitas acceso, contacta a un Administrador.`
  );
  return router.createUrlTree(['/cronos/dashboard']);
};
