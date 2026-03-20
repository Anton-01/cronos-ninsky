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

  // 1. Rol requerido: Si la ruta no especifica nada, el nivel mínimo es USER (1)
  // Cambiamos 'ADMIN' por 'USER' para no bloquear rutas generales por error.
  const requiredRole = route.data?.['role'] ?? 'USER';

  // 2. Obtener el rol del usuario (asegúrate que getPrimaryRole() devuelva "SUPER_ADMIN")
  const primaryRole = tokenService.getPrimaryRole();

  // DEBUG: Descomenta esta línea para ver exactamente qué está comparando en consola
  console.log(`User: ${primaryRole} (${ROLE_LEVEL[primaryRole]}), Required: ${requiredRole} (${ROLE_LEVEL[requiredRole]})`);

  const userLevel     = ROLE_LEVEL[primaryRole]     ?? 0;
  const requiredLevel = ROLE_LEVEL[requiredRole]    ?? 0;

  // 3. Validación
  if (userLevel >= requiredLevel) {
    return true;
  }

  // 4. Manejo de error
  toast.error(
      'Acceso restringido',
      `Tu nivel de acceso (${primaryRole}) no es suficiente para esta sección.`
  );

  return router.createUrlTree(['/cronos/dashboard']);
};