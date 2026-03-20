import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';
import { ToastService } from '../../shared/services/toast.service';

/**
 * Numeric hierarchy: higher value = more privileged.
 * A user whose primary role has level ≥ required level is granted access.
 *
 * SUPER_ADMIN  → can access SUPER_ADMIN, ADMIN, MANAGER, USER routes
 * ADMIN        → can access ADMIN, MANAGER, USER routes
 * MANAGER      → can access MANAGER, USER routes
 * USER         → can access USER routes
 */
const ROLE_LEVEL: Record<string, number> = {
  'SUPER_ADMIN': 4,
  'ADMIN':       3,
  'MANAGER':     2,
  'USER':        1,
};

export const roleGuard: CanActivateFn = (route) => {
  const tokenService = inject(TokenService);
  const router       = inject(Router);
  const toast        = inject(ToastService);

  if (!tokenService.isLoggedIn()) {
    return router.createUrlTree(['/auth/login']);
  }

  const requiredRole: string = route.data?.['role'] ?? 'ADMIN';
  const primaryRole: string  = tokenService.getPrimaryRole();

  const userLevel     = ROLE_LEVEL[primaryRole]     ?? 0;
  const requiredLevel = ROLE_LEVEL[requiredRole]    ?? 0;

  if (userLevel >= requiredLevel) return true;

  toast.error(
    'Acceso restringido',
    `No tienes permisos para acceder a esta sección. Si necesitas acceso, contacta a un Administrador.`
  );
  return router.createUrlTree(['/cronos/dashboard']);
};
