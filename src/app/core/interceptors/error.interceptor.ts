import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpEvent,
  HttpRequest,
  HttpHandlerFn
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { TokenService } from '../services/token.service';
import { ToastService } from '../../shared/services/toast.service';
import { ErrorResponse } from '../models/error-response.model';
import { ApiResponse } from '../models/api-response.model';
import { TokenResponse } from '../models/auth.model';
import { environment } from '../../../environments/environment';

// Module-level singletons to coordinate concurrent 401 responses
let isRefreshing = false;
let refreshSubject = new BehaviorSubject<string | null>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router       = inject(Router);
  const http         = inject(HttpClient);
  const toast        = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 from the refresh or login endpoints themselves → just propagate
      if (
        error.status === 401 &&
        !req.url.includes('/auth/refresh') &&
        !req.url.includes('/auth/login')
      ) {
        return handle401(req, next, tokenService, router, http, toast);
      }

      // 403 / 404 / 500 → show red toast, NEVER close the session
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
  router: Router,
  http: HttpClient,
  toast: ToastService
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshSubject.next(null);

    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) {
      isRefreshing = false;
      performLogoutAndRedirect(tokenService, router, http, toast);
      return throwError(() => ({ message: 'No refresh token available' }));
    }

    return http
      .post<ApiResponse<TokenResponse>>(
        `${environment.apiUrl}/auth/refresh`,
        { refreshToken }
      )
      .pipe(
        switchMap(res => {
          isRefreshing = false;
          tokenService.saveTokens(res.data.accessToken, res.data.refreshToken);
          refreshSubject.next(res.data.accessToken);
          return next(cloneWithToken(req, res.data.accessToken));
        }),
        catchError(err => {
          isRefreshing = false;
          performLogoutAndRedirect(tokenService, router, http, toast);
          return throwError(() => err?.error as ErrorResponse);
        })
      );
  }

  // Another request already triggered a refresh — wait for the new token
  return refreshSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(token => next(cloneWithToken(req, token!)))
  );
}

function cloneWithToken(
  req: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/**
 * Best-effort backend logout → show session-expired toast → clear tokens → redirect.
 * The logout POST is fire-and-forget: we log out locally regardless of whether it succeeds.
 */
function performLogoutAndRedirect(
  tokenService: TokenService,
  router: Router,
  http: HttpClient,
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

  const refreshToken = tokenService.getRefreshToken();
  if (refreshToken) {
    // Best-effort: notify the backend so it can invalidate the session server-side.
    // We use subscribe with complete/error callbacks so the logout always happens.
    http
      .post(`${environment.apiUrl}/auth/logout`, { refreshToken })
      .subscribe({ complete: doFinalLogout, error: doFinalLogout });
  } else {
    doFinalLogout();
  }
}
