import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpEvent,
  HttpRequest,
  HttpHandlerFn
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { ErrorResponse } from '../models/error-response.model';

// Module-level singletons para coordinar respuestas 401 concurrentes
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService  = inject(AuthService);
  const router       = inject(Router);
  const toast        = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 desde los propios endpoints de refresh o login → solo propagar
      if (
        error.status === 401 &&
        !req.url.includes('/auth/refresh') &&
        !req.url.includes('/auth/login')
      ) {
        return handle401(req, next, tokenService, authService, router, toast);
      }

      // 401 en /auth/refresh → el refresh token expiró o fue revocado
      if (error.status === 401 && req.url.includes('/auth/refresh')) {
        performLogoutAndRedirect(tokenService, authService, router, toast);
        return throwError(() => error.error as ErrorResponse);
      }

      // 403 / 404 / 500 → mostrar toast rojo, NUNCA cerrar la sesión
      if (error.status === 403 || error.status === 404 || error.status === 500) {
        const errorBody = error.error as ErrorResponse;
        const msg = errorBody?.message || 'Ha ocurrido un error inesperado.';
        toast.error('Error', msg);
        return throwError(() => errorBody);
      }

      const errorBody = error.error as ErrorResponse;
      return throwError(() => errorBody);
    })
  );
};

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenService: TokenService,
  authService: AuthService,
  router: Router,
  toast: ToastService
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) {
      isRefreshing = false;
      performLogoutAndRedirect(tokenService, authService, router, toast);
      return throwError(() => ({ message: 'No refresh token available' }));
    }

    return authService.refreshToken(refreshToken).pipe(
      switchMap(res => {
        isRefreshing = false;
        tokenService.saveTokens(res.data.accessToken, res.data.refreshToken);
        refreshTokenSubject.next(res.data.accessToken);
        return next(cloneWithToken(req, res.data.accessToken));
      }),
      catchError(err => {
        isRefreshing = false;
        performLogoutAndRedirect(tokenService, authService, router, toast);
        return throwError(() => err?.error as ErrorResponse);
      })
    );
  }

  // Otra petición ya disparó el refresh — esperar el nuevo token
  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(token => next(cloneWithToken(req, token)))
  );
}

function cloneWithToken(
  req: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/**
 * Mejor esfuerzo: invalidar sesión en el backend → mostrar toast →
 * limpiar localStorage → redirigir al login.
 * El POST de logout es fire-and-forget: el cierre local ocurre siempre.
 */
function performLogoutAndRedirect(
  tokenService: TokenService,
  authService: AuthService,
  router: Router,
  toast: ToastService
): void {
  const doFinalLogout = () => {
    toast.error(
      'Sesión expirada',
      'Tu sesión ha expirado por seguridad. Por favor, inicia sesión nuevamente.'
    );
    tokenService.clearTokens();
    router.navigate(['/auth/login']);
  };

  const storedRefreshToken = tokenService.getRefreshToken();
  if (storedRefreshToken) {
    authService
      .logout(storedRefreshToken)
      .subscribe({ complete: doFinalLogout, error: doFinalLogout });
  } else {
    doFinalLogout();
  }
}
